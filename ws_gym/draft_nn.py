import numpy as np
import gymnasium as gym
import torch

import qchess

def get_basic_env(env):
    while hasattr(env, 'env'):
        env = env.env
    return env

class DummyNN(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.fc0 = torch.nn.Linear(64*64, 128, dtype=torch.float32)
        self.embed0 = torch.nn.Embedding(2, 16, dtype=torch.float32)
        self.fc1 = torch.nn.Linear(64*16, 64, dtype=torch.float32)
        self.embed1 = torch.nn.Embedding(7, 16, dtype=torch.float32)
        self.fc2 = torch.nn.Linear(64*16, 64, dtype=torch.float32)
        self.fc3 = torch.nn.Linear(128+64+64, 8*9+5, dtype=torch.float32)

    def forward(self, correlation, tag_white, piece_kind):
        assert correlation.shape[-4:]==(8,8,8,8)
        assert tag_white.shape[-2:]==(8,8)
        assert piece_kind.shape[-2:]==(8,8)
        is_one = correlation.ndim==4
        if is_one:
            correlation = correlation.unsqueeze(0)
            tag_white = tag_white.unsqueeze(0)
            piece_kind = piece_kind.unsqueeze(0)
        batch_size = correlation.shape[0]
        correlation = correlation.reshape(batch_size, 64*64) #torch.float32
        tag_white = tag_white.reshape(batch_size, 64) #torch.int64
        piece_kind = piece_kind.reshape(batch_size, 64) #torch.int64
        x0 = torch.nn.functional.relu(self.fc0(correlation))
        x1 = torch.nn.functional.relu(self.fc1(self.embed0(tag_white).reshape(batch_size,-1)))
        x2 = torch.nn.functional.relu(self.fc2(self.embed1(piece_kind).reshape(batch_size,-1)))
        x = torch.cat([x0, x1, x2], dim=1)
        x = self.fc3(x)
        y0 = torch.nn.functional.softmax(x[:,:(8*9)].reshape(batch_size, 8, 9), dim=2)
        y1 = torch.nn.functional.softmax(x[:,(8*9):], dim=1)
        ret = (y0[0],y1[0]) if is_one else (y0,y1)
        return ret

gym.register(id="gymnasium_env/QChessGame-v0", entry_point=qchess.gym.QChessGameEnv)

game_env = gym.make("gymnasium_env/QChessGame-v0", mode='pvc', computer='greedy')
basic_env = get_basic_env(game_env)
game = basic_env.game


model = DummyNN()
model.eval()
action_list = []
obs, info = game_env.reset()
for _ in range(10):
    # neural network prediction
    correlation = torch.tensor(obs['correlation'], dtype=torch.float32)
    tag_white = torch.tensor(obs['tag_white'], dtype=torch.int64)
    piece_kind = torch.tensor(obs['piece_kind'], dtype=torch.int64)
    valid_action = get_basic_env(game_env).get_valid_action('int')
    y0,y1 = model(correlation, tag_white, piece_kind) #(y0,y1) are probabilities
    logy0 = torch.log(y0.detach()).numpy() #logits
    logy1 = torch.log(y1.detach()).numpy() #logits
    ind0 = np.array(valid_action, dtype=np.int64)
    logits = sum([logy0[x,ind0[:,x]] for x in range(8)]) + logy1[ind0[:,-1]]
    action = valid_action[np.argmax(logits)]

    action_list.append(qchess.gym.vector_to_command(action))
    obs, reward, terminated, truncated, info = game_env.step(action)
    print(f"#### step={info['step']}")
    print(game)
