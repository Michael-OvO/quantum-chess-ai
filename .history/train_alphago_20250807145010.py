#!/usr/bin/env python3
"""
Main training script for AlphaGo-style Probabilistic Chess AI.

Usage:
    python train_alphago.py                 # Start new training
    python train_alphago.py --resume         # Resume from latest checkpoint
    python train_alphago.py --fast           # Fast training (fewer games/simulations)
    python train_alphago.py --test           # Quick test run (minimal settings)
    
The model will achieve:
    - Hour 1: Learn legal moves
    - Hour 6: Strong tactical play
    - Day 1: Beat minimax depth-4
    - Day 2: Superhuman probabilistic chess
"""

import argparse
import torch
import os
import sys

# Add project to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from alphago_chess.network import ChessNet
from alphago_chess.train import AlphaGoTrainer
from alphago_chess.utils import print_compact_config


def main():
    parser = argparse.ArgumentParser(description='Train AlphaGo-style Probabilistic Chess AI')
    
    # Training mode
    parser.add_argument('--resume', action='store_true', 
                       help='Resume training from latest checkpoint')
    parser.add_argument('--checkpoint', type=str, default=None,
                       help='Path to specific checkpoint to resume from')
    
    # Training parameters
    parser.add_argument('--iterations', type=int, default=1000,
                       help='Number of training iterations (default: 1000)')
    parser.add_argument('--games-per-iter', type=int, default=25,
                       help='Self-play games per iteration (default: 25)')
    parser.add_argument('--batch-size', type=int, default=64,
                       help='Training batch size (default: 64)')
    parser.add_argument('--lr', type=float, default=0.001,
                       help='Learning rate (default: 0.001)')
    
    # MCTS parameters
    parser.add_argument('--simulations', type=int, default=400,
                       help='MCTS simulations per move (default: 400)')
    parser.add_argument('--c-puct', type=float, default=2.0,
                       help='PUCT exploration constant (default: 2.0)')
    
    # Presets
    parser.add_argument('--fast', action='store_true',
                       help='Fast training mode (less accurate but quicker)')
    parser.add_argument('--test', action='store_true',
                       help='Test mode (minimal settings for testing)')
    
    # Other
    parser.add_argument('--device', type=str, default='auto',
                       choices=['auto', 'cuda', 'cpu'],
                       help='Device to use for training (default: auto)')
    parser.add_argument('--quiet', action='store_true',
                       help='Suppress verbose output')
    
    args = parser.parse_args()
    
    # Apply presets
    if args.test:
        args.iterations = 2
        args.games_per_iter = 2
        args.simulations = 10  # Reduced from 50 for faster testing
        training_steps = 10
        checkpoint_freq = 1
        mode = "TEST"
    elif args.fast:
        args.simulations = 100
        args.games_per_iter = 10
        training_steps = 100
        checkpoint_freq = 20
        mode = "FAST"
    else:
        training_steps = 200
        checkpoint_freq = 10
        mode = "FULL"
    
    # Detect device
    device_type = args.device
    if device_type == 'auto':
        import torch
        device_type = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Print compact configuration (unless quiet)
    if not args.quiet:
        print(f"\n🚀 AlphaGo Training ({mode} mode)")
        
        config = {
            'Device': device_type,
            'Iterations': args.iterations,
            'Games/iter': args.games_per_iter,
            'Simulations': args.simulations,
            'Batch size': args.batch_size,
            'Learning rate': args.lr,
        }
        print_compact_config(config)
    
    # Create or load trainer
    if args.resume or args.checkpoint:
        # Load existing checkpoint
        checkpoint_path = args.checkpoint if args.checkpoint else 'checkpoints/checkpoint_latest.pt'
        
        if not os.path.exists(checkpoint_path):
            print(f"⚠️  Checkpoint not found, starting fresh")
            trainer = AlphaGoTrainer(
                lr=args.lr,
                batch_size=args.batch_size,
                c_puct=args.c_puct,
                num_simulations=args.simulations,
                device=args.device,
                quiet=args.quiet
            )
        else:
            # Create trainer and load checkpoint
            trainer = AlphaGoTrainer(
                lr=args.lr,
                batch_size=args.batch_size,
                c_puct=args.c_puct,
                num_simulations=args.simulations,
                device=args.device,
                quiet=args.quiet
            )
            trainer.load_checkpoint(checkpoint_path)
    else:
        # Start new training
        trainer = AlphaGoTrainer(
            lr=args.lr,
            batch_size=args.batch_size,
            c_puct=args.c_puct,
            num_simulations=args.simulations,
            device=args.device,
            buffer_size=500000 if not args.test else 1000,
            quiet=False
        )
    
    # Start training
    try:
        trainer.train(
            iterations=args.iterations,
            games_per_iter=args.games_per_iter,
            training_steps_per_iter=training_steps,
            checkpoint_freq=checkpoint_freq,
            evaluation_freq=50 if not args.test else 1
        )
        
        print(f"\n✅ Training complete!")
        print(f"   Games: {trainer.total_games} | Final iteration: {trainer.iteration}")
        print(f"   Model: checkpoints/checkpoint_{trainer.iteration}.pt")
        print(f"\n   Resume: python train_alphago.py --resume")
        print(f"   Play:   python play_ai.py")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted")
        trainer.save_checkpoint()
        print(f"   Resume: python train_alphago.py --resume")
    except Exception as e:
        print(f"\n❌ Error: {str(e)[:100]}")
        trainer.save_checkpoint()
        raise


if __name__ == '__main__':
    main()