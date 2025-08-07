#!/usr/bin/env python3
"""
Play against the trained AlphaGo-style AI.

Usage:
    python play_ai.py                       # Play as white against AI
    python play_ai.py --color black         # Play as black
    python play_ai.py --ai-vs-ai            # Watch AI play against itself
    python play_ai.py --checkpoint path.pt  # Use specific checkpoint
"""

import argparse
import torch
import os
import sys

# Add project to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from python.qchess.chess_utils import QChessGame
from alphago_chess.network import ChessNet
from alphago_chess.mcts import MCTS
from alphago_chess.encoding import encode_game_state


def load_ai_model(checkpoint_path: str = 'checkpoints/checkpoint_latest.pt'):
    """Load the trained AI model."""
    if not os.path.exists(checkpoint_path):
        print(f"❌ No model found. Train first: python train_alphago.py")
        sys.exit(1)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Create and load network
    network = ChessNet().to(device)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    network.load_state_dict(checkpoint['model_state'])
    network.eval()
    
    print(f"✅ Model loaded (iter {checkpoint.get('iteration', '?')}, {device})")
    
    return network, device


def ai_move(game, network, device, simulations=400, temperature=0.1, verbose=False):
    """Get AI move using MCTS."""
    mcts = MCTS(
        network=network,
        c_puct=2.0,
        num_simulations=simulations,
        temperature=temperature,
        device=device
    )
    
    action, (moves, probs) = mcts.get_action_probabilities(game, temperature=temperature)
    
    if action is None:
        return None
    
    # Show thinking process only if verbose
    if verbose and moves and probs is not None:
        sorted_idx = np.argsort(probs)[::-1][:3]
        print("   Considering:", end=" ")
        for idx in sorted_idx[:2]:
            print(f"{moves[idx]} ({probs[idx]:.0%})", end=" ")
        print()
    
    return action


def human_move(game):
    """Get move from human player."""
    while True:
        moves = game.get_all_available_move()
        
        if not moves:
            return None
        
        # Show moves on request
        choice = input("\nMove (or 'list' for options): ").strip()
        
        if choice.lower() == 'list':
            print(f"\n{len(moves)} moves available:")
            for i, move in enumerate(moves[:20]):
                print(f"  {i+1:2}. {move}")
            if len(moves) > 20:
                print(f"  ... +{len(moves)-20} more")
            continue
        
        # Check if it's a number
        if choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(moves):
                return moves[idx]
        
        # Check if it's a move string
        if choice in moves:
            return choice
        
        print("❌ Invalid move (type 'list' for options)")


def play_game(network, device, human_color='white', ai_simulations=400):
    """Play one game."""
    game = QChessGame()
    move_count = 0
    
    print(f"\n🎮 New Game - You play {human_color}")
    print("─" * 40)
    
    while game.is_finish_or_not() == 'continue':
        # Show board
        print(f"\n[Move {move_count + 1}]")
        print(game)
        
        current_player = 'white' if game.is_white else 'black'
        
        if current_player == human_color:
            # Human move
            move = human_move(game)
            if move is None:
                break
            print(f"→ {move}")
        else:
            # AI move
            print("🤖 AI thinking...", end="")
            move = ai_move(game, network, device, simulations=ai_simulations)
            if move is None:
                print(" no moves!")
                break
            print(f" → {move}")
        
        # Apply move
        try:
            game.run_short_cmd(move, tag_print=False)
            move_count += 1
        except:
            print("❌ Invalid move")
            break
        
        # Check for game end
        if move_count > 200:
            print("\n⏱️ Game limit reached")
            break
    
    # Game over
    print("\n" + "─" * 40)
    outcome = game.is_finish_or_not()
    
    if outcome == 'white':
        result = "🏆 WHITE WINS!"
        if human_color == 'white':
            result += " - You win!"
        else:
            result += " - AI wins"
    elif outcome == 'black':
        result = "🏆 BLACK WINS!"
        if human_color == 'black':
            result += " - You win!"
        else:
            result += " - AI wins"
    else:
        result = "🤝 DRAW!"
    
    print(result)
    print(game)
    
    return outcome


def ai_vs_ai_game(network, device, simulations=400):
    """Watch AI play against itself."""
    game = QChessGame()
    move_count = 0
    
    print(f"\n🤖 AI vs AI")
    print("─" * 40)
    
    while game.is_finish_or_not() == 'continue':
        print(f"\n[Move {move_count + 1}]")
        print(game)
        
        current_player = 'white' if game.is_white else 'black'
        
        # AI move with slightly different temperature for variety
        temperature = 0.2 if current_player == 'white' else 0.3
        
        print(f"🤖 {current_player} thinking...", end="")
        move = ai_move(game, network, device, simulations=simulations, temperature=temperature)
        
        if move is None:
            print(" no moves!")
            break
        
        print(f" → {move}")
        
        # Apply move
        try:
            game.run_short_cmd(move, tag_print=False)
            move_count += 1
        except:
            break
        
        # Brief pause for readability
        input("[Enter for next move]")
        
        # Check for game end
        if move_count > 200:
            print("\n⏱️ Game limit reached")
            break
    
    # Game over
    print("\n" + "─" * 40)
    outcome = game.is_finish_or_not()
    
    if outcome == 'white':
        print("🏆 WHITE AI WINS!")
    elif outcome == 'black':
        print("🏆 BLACK AI WINS!")
    else:
        print("🤝 DRAW!")
    
    print(game)
    return outcome


def main():
    parser = argparse.ArgumentParser(description='Play against AlphaGo-style Chess AI')
    
    parser.add_argument('--color', type=str, default='white',
                       choices=['white', 'black'],
                       help='Color to play as (default: white)')
    parser.add_argument('--checkpoint', type=str, 
                       default='checkpoints/checkpoint_latest.pt',
                       help='Path to model checkpoint')
    parser.add_argument('--simulations', type=int, default=400,
                       help='MCTS simulations for AI (default: 400)')
    parser.add_argument('--ai-vs-ai', action='store_true',
                       help='Watch AI play against itself')
    
    args = parser.parse_args()
    
    # Load model
    network, device = load_ai_model(args.checkpoint)
    
    print("\n📋 Probabilistic Chess Rules:")
    print("  • Pieces can split into superposition")
    print("  • No check/checkmate - capture the king")
    print("  • Pawns cannot split/merge")
    print("─" * 40)
    
    try:
        if args.ai_vs_ai:
            # AI vs AI
            while True:
                ai_vs_ai_game(network, device, simulations=args.simulations)
                
                again = input("\nPlay another AI vs AI game? (y/n): ").strip().lower()
                if again != 'y':
                    break
        else:
            # Human vs AI
            while True:
                play_game(network, device, human_color=args.color, 
                         ai_simulations=args.simulations)
                
                again = input("\nPlay again? (y/n): ").strip().lower()
                if again != 'y':
                    break
        
        print("\n👋 Thanks for playing!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Game interrupted")
    except Exception as e:
        print(f"\n❌ Error: {str(e)[:100]}")


if __name__ == '__main__':
    import numpy as np  # Import here to avoid issues if not needed
    main()