import torch
import torch.nn as nn
import torch.nn.functional as F


class ResBlock(nn.Module):
    """Residual block - critical for deep network performance"""
    def __init__(self, channels=256):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)
        
    def forward(self, x):
        residual = x
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.bn2(self.conv2(x))
        x += residual
        return F.relu(x)


class ChessNet(nn.Module):
    """
    Neural network for probabilistic chess.
    Uses CNN to process spatial patterns in correlation matrices and board state.
    Outputs both policy (move probabilities) and value (position evaluation).
    """
    def __init__(self, num_channels=256, num_res_blocks=10):
        super().__init__()
        
        # Input channels (total 20):
        # - 8 channels: Correlation matrix features (8x8 chunks from 64x64)
        # - 6 channels: Piece positions by type (king, queen, bishop, knight, rook, pawn)
        # - 2 channels: Color positions (white, black)
        # - 1 channel: Turn indicator
        # - 1 channel: Move count
        # - 2 channels: Valid moves mask (for current player)
        
        self.input_conv = nn.Conv2d(20, num_channels, 3, padding=1)
        self.input_bn = nn.BatchNorm2d(num_channels)
        
        # ResNet backbone - proven architecture for game AI
        self.res_blocks = nn.ModuleList([
            ResBlock(num_channels) for _ in range(num_res_blocks)
        ])
        
        # Policy head - predicts move probabilities
        self.policy_conv = nn.Conv2d(num_channels, 32, 1)
        self.policy_bn = nn.BatchNorm2d(32)
        self.policy_fc = nn.Linear(32 * 8 * 8, 4096)  # Output size for all possible moves
        
        # Value head - predicts win probability
        self.value_conv = nn.Conv2d(num_channels, 4, 1)
        self.value_bn = nn.BatchNorm2d(4)
        self.value_fc1 = nn.Linear(4 * 8 * 8, 256)
        self.value_fc2 = nn.Linear(256, 1)
        
    def forward(self, x):
        """
        Forward pass through the network.
        
        Args:
            x: Input tensor of shape (batch_size, 20, 8, 8)
            
        Returns:
            policy: Logits for all possible moves (batch_size, 4096)
            value: Position evaluation in [-1, 1] (batch_size, 1)
        """
        # Shared computation through ResNet
        x = F.relu(self.input_bn(self.input_conv(x)))
        
        for block in self.res_blocks:
            x = block(x)
        
        # Policy head
        policy = F.relu(self.policy_bn(self.policy_conv(x)))
        policy = policy.view(policy.size(0), -1)
        policy = self.policy_fc(policy)
        
        # Value head
        value = F.relu(self.value_bn(self.value_conv(x)))
        value = value.view(value.size(0), -1)
        value = F.relu(self.value_fc1(value))
        value = torch.tanh(self.value_fc2(value))
        
        return policy, value
    
    def predict(self, state):
        """
        Make a prediction for a single state (no batch dimension).
        
        Args:
            state: Input tensor of shape (20, 8, 8)
            
        Returns:
            policy_probs: Softmax probabilities for moves
            value: Position evaluation
        """
        self.eval()
        with torch.no_grad():
            # Add batch dimension
            if state.dim() == 3:
                state = state.unsqueeze(0)
            
            policy_logits, value = self.forward(state)
            policy_probs = F.softmax(policy_logits, dim=1).squeeze(0)
            value = value.squeeze()
            
        return policy_probs, value