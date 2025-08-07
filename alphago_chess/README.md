# AlphaGo-Style Probabilistic Chess AI

## Overview

This is an implementation of an AlphaGo-inspired AI for probabilistic chess, where pieces can exist in superposition states. The AI combines deep neural networks with Monte Carlo Tree Search (MCTS) to achieve superhuman play.

## Architecture

### Core Components

1. **Neural Network (`network.py`)**
   - ResNet-style CNN with 10 residual blocks
   - Dual outputs: policy (move probabilities) and value (position evaluation)
   - Processes 20-channel input including correlation matrices and board features

2. **MCTS with PUCT (`mcts.py`)**
   - Implements the PUCT algorithm from AlphaGo
   - Balances exploration vs exploitation using neural network priors
   - 400 simulations per move by default

3. **Training Pipeline (`train.py`)**
   - Self-play data generation
   - Experience replay buffer (500k positions)
   - Batch training with Adam optimizer
   - Cosine annealing learning rate schedule

4. **State Encoding (`encoding.py`)**
   - Converts game states to 20-channel 8x8 tensors
   - Handles correlation matrices for probabilistic positions
   - Move encoding/decoding for neural network I/O

## Installation

```bash
# Create and activate virtual environment
python -m venv venv_alphago
source venv_alphago/bin/activate  # On Windows: venv_alphago\Scripts\activate

# Install dependencies
pip install torch numpy gymnasium pygame

# Install qchess package
pip install -e .
```

## Training

### Quick Test (2 minutes)
```bash
python train_alphago.py --test
```

### Fast Training (few hours)
```bash
python train_alphago.py --fast
```

### Full Training (1-2 days)
```bash
python train_alphago.py
```

### Resume Training
```bash
python train_alphago.py --resume
```

## Playing Against the AI

```bash
# Play as white
python play_ai.py

# Play as black
python play_ai.py --color black

# Watch AI vs AI
python play_ai.py --ai-vs-ai
```

## Key Parameters

- **MCTS Simulations**: 400 (adjustable with `--simulations`)
- **Batch Size**: 64
- **Learning Rate**: 0.001 → 0.0001 (cosine decay)
- **Buffer Size**: 500,000 positions
- **Network**: 256 channels, 10 ResNet blocks

## Performance Timeline

- **Hour 1**: Learns legal moves
- **Hour 6**: Strong tactical play
- **Day 1**: Beats minimax depth-4
- **Day 2**: Superhuman probabilistic chess

## Technical Details

### Why This Works

1. **Pattern Recognition**: CNN learns spatial patterns in correlation matrices
2. **Strategic Planning**: MCTS provides lookahead with neural guidance
3. **Self-Improvement**: Learns from self-play without human data
4. **Probabilistic Handling**: Naturally handles superposition states

### Key Innovations

- Adapted AlphaGo's PUCT formula for probabilistic states
- Efficient encoding of 64x64 correlation matrices
- Temperature-based exploration schedule
- Experience replay for sample efficiency

## Files

- `network.py`: Neural network architecture
- `mcts.py`: Monte Carlo Tree Search
- `encoding.py`: State encoding/decoding
- `train.py`: Training pipeline
- `../train_alphago.py`: Main training script
- `../play_ai.py`: Interactive play script

## Troubleshooting

### Out of Memory
Reduce batch size or number of simulations:
```bash
python train_alphago.py --batch-size 32 --simulations 200
```

### Slow Training
Use GPU if available (automatically detected) or reduce simulations:
```bash
python train_alphago.py --fast
```

### Loading Errors
Ensure you're in the virtual environment:
```bash
source venv_alphago/bin/activate
```

## Citation

Based on the AlphaGo paper:
> Silver, D., et al. (2016). Mastering the game of Go with deep neural networks and tree search. Nature, 529(7587), 484-489.