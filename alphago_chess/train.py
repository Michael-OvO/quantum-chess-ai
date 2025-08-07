import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from collections import deque
import random
import copy
import os
import time
from typing import List, Tuple, Optional
from tqdm import tqdm

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python.qchess.chess_utils import QChessGame
from .network import ChessNet
from .mcts import MCTS
from .encoding import encode_game_state, create_policy_target
from .utils import TrainingProgress, create_progress_bar, print_phase


class AlphaGoTrainer:
    """
    Training pipeline for AlphaGo-style probabilistic chess AI.
    Uses self-play, experience replay, and MCTS-guided policy improvement.
    """
    
    def __init__(self, 
                 network: Optional[ChessNet] = None,
                 lr: float = 0.001,
                 buffer_size: int = 100000,
                 batch_size: int = 64,
                 c_puct: float = 2.0,
                 num_simulations: int = 400,
                 device: str = 'auto',
                 quiet: bool = False):
        """
        Initialize the trainer.
        
        Args:
            network: Neural network (creates new if None)
            lr: Learning rate
            buffer_size: Size of experience replay buffer
            batch_size: Batch size for training
            c_puct: PUCT exploration constant
            num_simulations: MCTS simulations per move
            device: Device for training ('auto', 'cuda', or 'cpu')
            quiet: Suppress verbose output
        """
        # Set device
        if device == 'auto':
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)
        
        self.quiet = quiet
        
        # Initialize network
        if network is None:
            self.network = ChessNet().to(self.device)
        else:
            self.network = network.to(self.device)
        
        # Optimizer and loss
        self.optimizer = torch.optim.Adam(self.network.parameters(), lr=lr)
        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer, T_max=1000, eta_min=lr * 0.1
        )
        
        # Experience replay buffer
        self.buffer = deque(maxlen=buffer_size)
        self.batch_size = batch_size
        
        # MCTS parameters
        self.c_puct = c_puct
        self.num_simulations = num_simulations
        
        # Training statistics
        self.iteration = 0
        self.total_games = 0
        self.loss_history = []
        
    def self_play_game(self, temperature_schedule: Optional[List[float]] = None) -> List[Tuple]:
        """
        Play one self-play game using MCTS.
        
        Args:
            temperature_schedule: Temperature values for different game phases
                                 Default: [1.0]*30 + [0.5]*20 + [0.1]*50
        
        Returns:
            List of (state, policy, value) training tuples
        """
        if temperature_schedule is None:
            # Explore early, exploit later
            temperature_schedule = [1.0] * 30 + [0.5] * 20 + [0.1] * 50
        
        game = QChessGame()
        training_data = []
        
        # Create MCTS instance
        mcts = MCTS(
            network=self.network,
            c_puct=self.c_puct,
            num_simulations=self.num_simulations,
            device=self.device
        )
        
        move_count = 0
        
        while game.is_finish_or_not() == 'continue':
            # Get temperature for this move
            temp_idx = min(move_count, len(temperature_schedule) - 1)
            temperature = temperature_schedule[temp_idx]
            
            # Run MCTS to get visit counts
            visits = mcts.search(game)
            
            if not visits:
                break
            
            # Create policy target from visits
            policy_target = create_policy_target(visits, temperature=1.0)
            
            # Store state and policy
            state = encode_game_state(game)
            training_data.append((state, policy_target, game.is_white))
            
            # Select move based on visit counts and temperature
            moves = list(visits.keys())
            visit_counts = np.array([visits[m] for m in moves], dtype=np.float32)
            
            if temperature == 0:
                # Greedy
                action = moves[np.argmax(visit_counts)]
            else:
                # Sample with temperature
                probs = visit_counts ** (1.0 / temperature)
                probs = probs / probs.sum()
                action = np.random.choice(moves, p=probs)
            
            # Apply move
            try:
                game.run_short_cmd(action, tag_print=False)
                move_count += 1
            except Exception:
                # Invalid move, stop game
                break
            
            # Prevent infinite games
            if move_count > 200:
                break
        
        # Get game outcome
        outcome = game.is_finish_or_not()
        if outcome == 'white':
            white_value = 1.0
        elif outcome == 'black':
            white_value = -1.0
        else:
            white_value = 0.0
        
        # Create final training data with values
        result = []
        for state, policy, is_white in training_data:
            # Value from the perspective of the player to move
            value = white_value if is_white else -white_value
            result.append((state, policy, value))
        
        self.total_games += 1
        return result
    
    def train_step(self) -> float:
        """
        Perform one training step on a batch from the replay buffer.
        
        Returns:
            Total loss value
        """
        if len(self.buffer) < self.batch_size:
            return 0.0
        
        # Sample batch from buffer
        batch = random.sample(self.buffer, self.batch_size)
        
        # Prepare batch tensors
        states = torch.stack([s for s, _, _ in batch]).to(self.device)
        policies = torch.tensor(
            np.array([p for _, p, _ in batch]), 
            dtype=torch.float32
        ).to(self.device)
        values = torch.tensor(
            [v for _, _, v in batch], 
            dtype=torch.float32
        ).to(self.device)
        
        # Forward pass
        pred_policies, pred_values = self.network(states)
        pred_values = pred_values.squeeze()
        
        # Calculate losses
        # Policy loss: Cross-entropy between predicted and MCTS policies
        policy_loss = -torch.sum(policies * torch.log_softmax(pred_policies, dim=1)) / self.batch_size
        
        # Value loss: MSE between predicted and actual game outcomes
        value_loss = F.mse_loss(pred_values, values)
        
        # L2 regularization
        l2_reg = 1e-4
        l2_loss = sum(p.pow(2).sum() for p in self.network.parameters())
        
        # Total loss
        total_loss = policy_loss + value_loss + l2_reg * l2_loss
        
        # Backward pass
        self.optimizer.zero_grad()
        total_loss.backward()
        
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(self.network.parameters(), max_norm=1.0)
        
        self.optimizer.step()
        
        return total_loss.item()
    
    def train(self, 
              iterations: int = 1000,
              games_per_iter: int = 25,
              training_steps_per_iter: int = 200,
              checkpoint_freq: int = 10,
              evaluation_freq: int = 50):
        """
        Main training loop.
        
        Args:
            iterations: Number of training iterations
            games_per_iter: Self-play games per iteration
            training_steps_per_iter: Gradient updates per iteration
            checkpoint_freq: Save checkpoint every N iterations
            evaluation_freq: Evaluate model every N iterations
        """
        # Create progress tracker
        progress = TrainingProgress(iterations, quiet=self.quiet)
        progress.update_metrics(lr=self.optimizer.param_groups[0]['lr'])
        
        # Main iteration loop with progress bar
        iter_pbar = tqdm(range(self.iteration, self.iteration + iterations), 
                        desc="Training", disable=self.quiet)
        
        try:
            for iteration in iter_pbar:
                iter_start = time.time()
                positions_generated = 0
                
                # Self-play phase
                print_phase("Self-play phase", "🎮" if not self.quiet else "")
                
                game_pbar = create_progress_bar(games_per_iter, "Games", 
                                               unit="game", disable=self.quiet)
                
                try:
                    for game_idx in range(games_per_iter):
                        # Temperature schedule
                        if iteration < 100:
                            temp_schedule = [1.0] * 40 + [0.5] * 60
                        elif iteration < 500:
                            temp_schedule = [1.0] * 20 + [0.5] * 30 + [0.1] * 50
                        else:
                            temp_schedule = [1.0] * 10 + [0.1] * 90
                        
                        # Generate game
                        game_data = self.self_play_game(temp_schedule)
                        self.buffer.extend(game_data)
                        positions_generated += len(game_data)
                        
                        game_pbar.update(1)
                        game_pbar.set_postfix(positions=f"{positions_generated}")
                finally:
                    game_pbar.close()
                
                # Training phase
                if len(self.buffer) >= self.batch_size:
                    print_phase("Training phase", "🧠" if not self.quiet else "")
                    
                    train_pbar = create_progress_bar(training_steps_per_iter, "Steps",
                                                    unit="step", disable=self.quiet)
                    
                    try:
                        total_loss = 0
                        avg_loss = 0  # Initialize avg_loss
                        for step in range(training_steps_per_iter):
                            loss = self.train_step()
                            if loss is not None:  # Check if loss is valid
                                total_loss += loss
                            
                            avg_loss = total_loss / (step + 1)
                            train_pbar.update(1)
                            train_pbar.set_postfix(loss=f"{avg_loss:.4f}")
                        
                        if training_steps_per_iter > 0:
                            self.loss_history.append(avg_loss)
                        
                        # Update metrics
                        progress.update_metrics(
                            games=self.total_games,
                            positions=len(self.buffer),
                            loss=avg_loss,
                            lr=self.optimizer.param_groups[0]['lr']
                        )
                    finally:
                        train_pbar.close()
                    
                    # Update learning rate
                    self.scheduler.step()
                
                # Save checkpoint
                if (iteration + 1) % checkpoint_freq == 0:
                    self.save_checkpoint(iteration, silent=True)
                    if not self.quiet:
                        print(f"💾 Checkpoint saved → checkpoint_{iteration}.pt")
                
                # Evaluation
                if (iteration + 1) % evaluation_freq == 0:
                    win_rate = self.evaluate(silent=True)
                    progress.update_metrics(win_rate=win_rate * 100)
                    if not self.quiet:
                        print(f"📊 Evaluation: {win_rate:.1%} win rate")
                
                # Update iteration counter
                self.iteration = iteration + 1
                progress.next_iteration()
                
                # Update main progress bar
                iter_time = time.time() - iter_start
                iter_pbar.set_postfix(time=f"{iter_time:.1f}s", games=self.total_games)
        finally:
            iter_pbar.close()
            progress.finish()  # Clean up progress tracker
    
    def save_checkpoint(self, iteration: Optional[int] = None, silent: bool = False):
        """Save model checkpoint."""
        if iteration is None:
            iteration = self.iteration
            
        checkpoint = {
            'iteration': iteration,
            'model_state': self.network.state_dict(),
            'optimizer_state': self.optimizer.state_dict(),
            'scheduler_state': self.scheduler.state_dict(),
            'total_games': self.total_games,
            'loss_history': self.loss_history,
        }
        
        os.makedirs('checkpoints', exist_ok=True)
        path = f'checkpoints/checkpoint_{iteration}.pt'
        torch.save(checkpoint, path)
        
        # Also save as latest
        torch.save(checkpoint, 'checkpoints/checkpoint_latest.pt')
        
        if not silent and not self.quiet:
            print(f"💾 Saved checkpoint to {path}")
    
    def load_checkpoint(self, path: str):
        """Load model checkpoint."""
        checkpoint = torch.load(path, map_location=self.device)
        
        self.network.load_state_dict(checkpoint['model_state'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state'])
        self.iteration = checkpoint['iteration']
        self.total_games = checkpoint['total_games']
        self.loss_history = checkpoint.get('loss_history', [])
        
        if not self.quiet:
            print(f"✅ Loaded checkpoint (iteration {self.iteration})")
    
    def evaluate(self, silent: bool = False):
        """Evaluate current model performance."""
        if not silent and not self.quiet:
            print_phase("Evaluating", "📊")
        
        # Play a few games with greedy policy
        wins = 0
        games = 5
        
        for _ in range(games):
            game = QChessGame()
            mcts = MCTS(
                network=self.network,
                c_puct=self.c_puct,
                num_simulations=100,  # Fewer simulations for evaluation
                temperature=0.1,  # Low temperature for strong play
                device=self.device
            )
            
            moves = 0
            while game.is_finish_or_not() == 'continue' and moves < 200:
                action, _ = mcts.get_action_probabilities(game, temperature=0.1)
                if action is None:
                    break
                game.run_short_cmd(action, tag_print=False)
                moves += 1
            
            outcome = game.is_finish_or_not()
            if outcome == 'white':
                wins += 1
        
        win_rate = wins / games
        
        if not silent and not self.quiet:
            print(f"Won {wins}/{games} games ({win_rate:.0%})")
        
        return win_rate