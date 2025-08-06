import random
import numpy as np
import gymnasium as gym

import qchess

def get_basic_env(env):
    while hasattr(env, 'env'):
        env = env.env
    return env

class RandomAgent:
    def __init__(self, env, seed=None):
        self.rng = random.Random(seed)
        self.env = get_basic_env(env)

    def get_action(self):
        self.env.get_valid_action('int')
        valid_action_int = self.env.get_valid_action('int')
        ret = random.choice(valid_action_int)
        return ret

gym.register(id="gymnasium_env/QChessGame-v0", entry_point=qchess.gym.QChessGameEnv)


# game_env = qchess.gym.QChessGameEnv(mode='pvc', computer='greedy')
game_env = gym.make("gymnasium_env/QChessGame-v0", mode='pvc', computer='greedy')
## gym make several layer of wrapper
game = get_basic_env(game_env).game
# game = game_env.env.env.game


## observation
obs, info = game_env.reset()
obs['correlation'] #shape=(8,8,8,8) range=(0,1) float64
obs['tag_white'] #shape=(8,8) {0,1} int64
obs['piece_kind'] #shape=(8,8) {0,1,2,3,4,5,6} int64
info['is_finish_or_not'] #{'continue', 'white', 'black', 'draw'}
info['step'] #int
info['piece_prob'] #shape=(2,6): (white,black) (king,queen,bishop,knight,rook,pawn)
info['valid_action']


## action
valid_action_str = get_basic_env(game_env).get_valid_action('str')
valid_action_int = get_basic_env(game_env).get_valid_action('int')
qchess.gym.command_to_vector(valid_action_str[0])
qchess.gym.vector_to_command(valid_action_int[0])

## random agent
obs, info = game_env.reset() #seed=233
agent = RandomAgent(game_env) #seed=233
print(game)
action_list = []
for _ in range(10):
    action = agent.get_action()
    action_list.append(qchess.gym.vector_to_command(action))
    obs, reward, terminated, truncated, info = game_env.step(action)
    print(f"#### step={info['step']}")
    print(game)


## random seed involved
# game_env = gym.make("gymnasium_env/QChessGame-v0", mode='pvc', computer='greedy')
# computer='greedy' use random seed, but WuJiahui's code does not use random seed
obs, info = game_env.reset(seed=233)
agent = RandomAgent(game_env)
