import numpy as np
import torch
import copy
from typing import Dict, Optional, Tuple


class MCTSNode:
    """Node in the Monte Carlo Tree Search"""
    
    def __init__(self):
        self.visit_count = 0
        self.value_sum = 0.0
        self.children: Dict[str, MCTSNode] = {}
        self.prior = 0.0
        
    @property
    def value(self) -> float:
        """Average value of this node"""
        if self.visit_count == 0:
            return 0.0
        return self.value_sum / self.visit_count
    
    def is_expanded(self) -> bool:
        """Check if node has been expanded"""
        return len(self.children) > 0
    
    def ucb_score(self, parent_visits: int, c_puct: float = 2.0) -> float:
        """
        Calculate UCB score using PUCT formula from AlphaGo.
        Balances exploration vs exploitation.
        
        Args:
            parent_visits: Visit count of parent node
            c_puct: Exploration constant (higher = more exploration)
            
        Returns:
            UCB score for this node
        """
        if self.visit_count == 0:
            # Unvisited nodes get bonus proportional to prior and parent visits
            return c_puct * self.prior * np.sqrt(parent_visits)
        
        # PUCT formula: Q(s,a) + c_puct * P(s,a) * sqrt(N(s)) / (1 + N(s,a))
        exploitation = self.value
        exploration = c_puct * self.prior * np.sqrt(parent_visits) / (1 + self.visit_count)
        
        return exploitation + exploration


class MCTS:
    """
    Monte Carlo Tree Search with neural network guidance.
    Core algorithm from AlphaGo paper.
    """
    
    def __init__(self, network, c_puct: float = 2.0, num_simulations: int = 400, 
                 temperature: float = 1.0, device: str = 'cpu'):
        """
        Initialize MCTS.
        
        Args:
            network: Neural network for position evaluation and move priors
            c_puct: Exploration constant for PUCT formula
            num_simulations: Number of simulations to run
            temperature: Temperature for move selection (1.0 = proportional, 0 = greedy)
            device: Device for neural network inference
        """
        self.network = network
        self.c_puct = c_puct
        self.num_simulations = num_simulations
        self.temperature = temperature
        self.device = device
        
    def search(self, game, return_root: bool = False) -> Dict[str, int]:
        """
        Run MCTS simulations from the given game state.
        
        Args:
            game: Current game state (QChessGame object)
            return_root: Whether to return the root node (for debugging)
            
        Returns:
            Dictionary mapping moves to visit counts
        """
        root = MCTSNode()
        
        # Run simulations
        for _ in range(self.num_simulations):
            # Make a copy for simulation
            game_copy = copy.deepcopy(game)
            
            # Run one simulation
            self._simulate(game_copy, root)
        
        # Return visit counts for all moves
        visits = {}
        for move, child in root.children.items():
            visits[move] = child.visit_count
            
        if return_root:
            return visits, root
        return visits
    
    def _simulate(self, game, node: MCTSNode) -> float:
        """
        Run one simulation from the given node.
        
        Args:
            game: Game state (will be modified during simulation)
            node: Current node in the tree
            
        Returns:
            Value of the terminal state or network evaluation
        """
        # Check if game is over
        outcome = game.is_finish_or_not()
        if outcome != 'continue':
            # Terminal state - return actual game outcome
            if outcome == 'white':
                return 1.0 if game.is_white else -1.0
            elif outcome == 'black':
                return -1.0 if game.is_white else 1.0
            else:  # Draw
                return 0.0
        
        # If node is not expanded, expand it
        if not node.is_expanded():
            return self._expand(game, node)
        
        # Select best child using PUCT
        action = self._select_child(node)
        
        # Apply the move
        game.run_short_cmd(action, tag_print=False)
        
        # Recursively simulate from child
        child = node.children[action]
        value = self._simulate(game, child)
        
        # Update node statistics (backup)
        node.visit_count += 1
        node.value_sum += value
        
        # Return value from opponent's perspective
        return -value
    
    def _expand(self, game, node: MCTSNode) -> float:
        """
        Expand a leaf node using the neural network.
        
        Args:
            game: Current game state
            node: Node to expand
            
        Returns:
            Value evaluation from the neural network
        """
        # Get neural network evaluation
        from .encoding import encode_game_state, move_to_index
        
        state = encode_game_state(game)
        state = state.to(self.device)
        
        # Get network predictions
        self.network.eval()
        with torch.no_grad():
            if state.dim() == 3:
                state = state.unsqueeze(0)
            policy_logits, value = self.network(state)
            policy_probs = torch.softmax(policy_logits, dim=1).squeeze(0)
            value = value.squeeze().item()
        
        # Get legal moves
        legal_moves = game.get_all_available_move()
        
        # Add children for all legal moves
        for move in legal_moves:
            child = MCTSNode()
            # Get prior from policy network
            move_idx = move_to_index(move)
            child.prior = policy_probs[move_idx].item()
            node.children[move] = child
        
        # Normalize priors (only for legal moves)
        prior_sum = sum(child.prior for child in node.children.values())
        if prior_sum > 0:
            for child in node.children.values():
                child.prior /= prior_sum
        
        # Update node statistics
        node.visit_count += 1
        node.value_sum += value
        
        return value
    
    def _select_child(self, node: MCTSNode) -> str:
        """
        Select the best child node using PUCT formula.
        
        Args:
            node: Parent node
            
        Returns:
            Action (move) corresponding to best child
        """
        best_score = -float('inf')
        best_action = None
        
        parent_visits = node.visit_count
        
        for action, child in node.children.items():
            score = child.ucb_score(parent_visits, self.c_puct)
            
            if score > best_score:
                best_score = score
                best_action = action
        
        return best_action
    
    def get_action_probabilities(self, game, temperature: Optional[float] = None) -> Tuple[str, np.ndarray]:
        """
        Get action probabilities from MCTS search.
        
        Args:
            game: Current game state
            temperature: Temperature for action selection (None = use self.temperature)
            
        Returns:
            Tuple of (selected_action, probability_distribution)
        """
        if temperature is None:
            temperature = self.temperature
            
        # Run MCTS search
        visits = self.search(game)
        
        if not visits:
            return None, None
        
        # Convert visits to probabilities
        moves = list(visits.keys())
        counts = np.array([visits[m] for m in moves], dtype=np.float32)
        
        if temperature == 0:
            # Greedy selection
            probs = np.zeros_like(counts)
            probs[np.argmax(counts)] = 1.0
            action = moves[np.argmax(counts)]
        else:
            # Apply temperature
            counts = counts ** (1.0 / temperature)
            probs = counts / counts.sum()
            # Sample action
            action = np.random.choice(moves, p=probs)
        
        return action, (moves, probs)