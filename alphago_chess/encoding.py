import numpy as np
import torch
from typing import Tuple, List, Optional
import sys
import os

# Add parent directory to path to import qchess
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python.qchess.gym import game_to_observable, command_to_vector, vector_to_command


def encode_game_state(game) -> torch.Tensor:
    """
    Convert game state to neural network input.
    
    Creates a 20-channel 8x8 representation:
    - 8 channels: Correlation matrix features
    - 6 channels: Piece positions by type
    - 2 channels: Color positions
    - 1 channel: Turn indicator
    - 1 channel: Move count
    - 2 channels: Valid moves mask
    
    Args:
        game: QChessGame object
        
    Returns:
        Tensor of shape (20, 8, 8)
    """
    # Get quantum state information
    correlation, tag_white, piece_kind = game_to_observable(game)
    
    channels = []
    
    # 1. Correlation matrix features (8 channels)
    # The correlation matrix is 8x8x8x8, we need to extract meaningful features
    # Take diagonal slices and sum over correlations
    corr_reshaped = correlation.reshape(64, 64)
    
    # Split into 8 feature maps
    for i in range(8):
        # Take 8x8 blocks along the diagonal
        start_idx = i * 8
        end_idx = (i + 1) * 8
        channel = np.zeros((8, 8), dtype=np.float32)
        
        # Sum correlations for this block
        for j in range(8):
            block_start = j * 8
            block_end = (j + 1) * 8
            channel[j, :] = corr_reshaped[start_idx:end_idx, block_start:block_end].sum(axis=0)
        
        # Normalize
        if channel.max() > 0:
            channel = channel / channel.max()
        channels.append(channel)
    
    # 2. Piece positions by type (6 channels)
    # Types: 1=king, 2=queen, 3=bishop, 4=knight, 5=rook, 6=pawn
    for piece_type in range(1, 7):
        channel = (piece_kind == piece_type).astype(np.float32)
        channels.append(channel)
    
    # 3. Color positions (2 channels)
    # White pieces
    white_channel = (tag_white == 0).astype(np.float32)
    channels.append(white_channel)
    
    # Black pieces
    black_channel = (tag_white == 1).astype(np.float32)
    channels.append(black_channel)
    
    # 4. Turn indicator (1 channel)
    turn_channel = np.full((8, 8), float(game.is_white), dtype=np.float32)
    channels.append(turn_channel)
    
    # 5. Move count (1 channel) - normalized to [0, 1]
    move_count_channel = np.full((8, 8), min(game.current_step / 200.0, 1.0), dtype=np.float32)
    channels.append(move_count_channel)
    
    # 6. Valid moves mask (2 channels)
    # Create masks for where current player can move from and to
    valid_moves = game.get_all_available_move()
    
    from_mask = np.zeros((8, 8), dtype=np.float32)
    to_mask = np.zeros((8, 8), dtype=np.float32)
    
    for move in valid_moves:
        # Parse move to get source and destination
        parts = move.split(',')
        if len(parts) >= 2:
            # Parse source
            src = parts[0]
            if len(src) >= 2:
                src_col = ord(src[0]) - ord('a')
                src_row = int(src[1]) - 1
                if 0 <= src_col < 8 and 0 <= src_row < 8:
                    from_mask[7 - src_row, src_col] = 1.0
            
            # Parse destination
            dst = parts[1]
            if len(dst) >= 2:
                dst_col = ord(dst[0]) - ord('a')
                dst_row = int(dst[1]) - 1
                if 0 <= dst_col < 8 and 0 <= dst_row < 8:
                    to_mask[7 - dst_row, dst_col] = 1.0
    
    channels.append(from_mask)
    channels.append(to_mask)
    
    # Stack all channels
    state = np.stack(channels, axis=0)
    
    return torch.tensor(state, dtype=torch.float32)


def move_to_index(move: str) -> int:
    """
    Convert a move string to an index for the neural network output.
    
    We use a simple encoding scheme:
    - Normal moves: encoded as (src_square * 64 + dst_square)
    - Split moves: encoded as 4096 + unique_id
    - Merge moves: encoded as 4096 + unique_id
    
    Args:
        move: Move string in format "a1,b2" or "a1b1,c1" etc.
        
    Returns:
        Index in range [0, 4095]
    """
    # Use hash to create a deterministic mapping
    # This is simpler than explicit encoding and handles all move types
    move_hash = hash(move) % 4096
    return abs(move_hash)


def index_to_move(index: int, valid_moves: List[str]) -> Optional[str]:
    """
    Convert an index back to a move string.
    Since we use hashing, we need the list of valid moves to find the match.
    
    Args:
        index: Neural network output index
        valid_moves: List of valid moves in the current position
        
    Returns:
        Move string or None if no match
    """
    for move in valid_moves:
        if move_to_index(move) == index:
            return move
    return None


def create_policy_target(moves_visits: dict, temperature: float = 1.0) -> np.ndarray:
    """
    Create a policy target vector from MCTS visit counts.
    
    Args:
        moves_visits: Dictionary mapping moves to visit counts
        temperature: Temperature for controlling exploration
        
    Returns:
        Policy target vector of shape (4096,)
    """
    policy = np.zeros(4096, dtype=np.float32)
    
    if not moves_visits:
        return policy
    
    # Apply temperature
    moves = list(moves_visits.keys())
    visits = np.array(list(moves_visits.values()), dtype=np.float32)
    
    if temperature == 0:
        # One-hot for best move
        best_idx = np.argmax(visits)
        policy[move_to_index(moves[best_idx])] = 1.0
    else:
        # Proportional to visit counts with temperature
        visits = visits ** (1.0 / temperature)
        visits = visits / visits.sum()
        
        for move, prob in zip(moves, visits):
            policy[move_to_index(move)] = prob
    
    return policy


def decode_policy(policy_probs: torch.Tensor, valid_moves: List[str], 
                   temperature: float = 1.0) -> Tuple[str, float]:
    """
    Decode policy network output to select a move.
    
    Args:
        policy_probs: Probability distribution from network (4096,)
        valid_moves: List of valid moves
        temperature: Temperature for action selection
        
    Returns:
        Tuple of (selected_move, probability)
    """
    if not valid_moves:
        return None, 0.0
    
    # Get probabilities for valid moves only
    move_probs = []
    for move in valid_moves:
        idx = move_to_index(move)
        move_probs.append(policy_probs[idx].item())
    
    move_probs = np.array(move_probs, dtype=np.float32)
    
    # Renormalize
    if move_probs.sum() > 0:
        move_probs = move_probs / move_probs.sum()
    else:
        # Uniform if no probability mass on valid moves
        move_probs = np.ones_like(move_probs) / len(move_probs)
    
    if temperature == 0:
        # Greedy
        best_idx = np.argmax(move_probs)
        return valid_moves[best_idx], move_probs[best_idx]
    else:
        # Sample with temperature
        move_probs = move_probs ** (1.0 / temperature)
        move_probs = move_probs / move_probs.sum()
        
        selected_idx = np.random.choice(len(valid_moves), p=move_probs)
        return valid_moves[selected_idx], move_probs[selected_idx]