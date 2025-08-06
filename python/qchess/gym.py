import random
import numpy as np
import gymnasium as gym
import collections.abc

from .chess_utils import QChessGame
from .ai import get_greedy_move

_tuple9int = tuple[int,int,int,int,int,int,int,int,int]

def command_to_vector(cmd:str)->_tuple9int:
    args = cmd.split(',')
    assert len(args)==2
    s0:str = args[0]
    s1:str = args[1]
    _map = {'a':1, 'b':2, 'c':3, 'd':4, 'e':5, 'f':6, 'g':7, 'h':8}
    if (len(s0)==2) and (len(s1)==2): #move
        ret = _map[s0[0]], int(s0[1]), 0, 0, _map[s1[0]], int(s1[1]), 0, 0, 0
    elif (len(s0)==4) and (len(s1)==2): #merge
        ret = _map[s0[0]], int(s0[1]), _map[s0[2]], int(s0[3]), _map[s1[0]], int(s1[1]), 0, 0, 0
    elif (len(s0)==2) and (len(s1)==4): #split
        ret = _map[s0[0]], int(s0[1]), 0, 0, _map[s1[0]], int(s1[1]), _map[s1[2]], int(s1[3]), 0
    elif (len(s0)==4) and (len(s1)==4): #castling
        ret = _map[s0[0]], int(s0[1]), _map[s0[2]], int(s0[3]), _map[s1[0]], int(s1[1]), _map[s1[2]], int(s1[3]), 0
    elif (len(s0)==2) and (len(s1)==3): #promotion
        tmp0 = {'r':1, 'n':2, 'b':3, 'q':4}
        ret = _map[s0[0]], int(s0[1]), 0, 0, _map[s1[0]], int(s1[1]), 0, 0, tmp0[s1[2]]
    else:
        raise ValueError('Invalid command')
    return ret

def vector_to_command(vec:_tuple9int)->str:
    assert len(vec)==9
    assert (vec[0]!=0) and (vec[1]!=0) and (vec[4]!=0) and (vec[5]!=0)
    _map = '?abcdefgh'
    ret = _map[vec[0]]+str(vec[1])
    if vec[2]==0:
        assert vec[3]==0
        ret = ret + ','
    else:
        ret = ret + _map[vec[2]] + str(vec[3]) + ','
    ret = ret + _map[vec[4]] + str(vec[5])
    if vec[6]==0:
        assert vec[7]==0
    else:
        ret = ret + _map[vec[6]] + str(vec[7])
    if vec[8]>0:
        assert (vec[2]==0) and (vec[3]==0) and (vec[6]==0) and (vec[7]==0)
        ret = ret + ('?rnbq')[vec[8]]
    return ret


def game_to_observable(game:QChessGame):
    correlation = np.zeros((64,64), dtype=np.float64)
    for k,v in game.sim.coeff.items():
        tmp0 = np.array([x=='1' for x in k[:64]], dtype=np.bool_)
        correlation += (abs(v)**2)*(tmp0.reshape(-1,1)*tmp0)
    correlation = correlation.reshape(8,8,8,8) #(123) (abc) (123) (abc)
    # 0: empty or white, 1: black
    tmp0 = [0 if ((x is None) or x.isupper()) else 1 for x in game.sim.pos2tag[:64]]
    tag_white = np.array(tmp0, dtype=np.int64).reshape(8,8)
    tmp0 = {None:0, 'k':1, 'K':1, 'q':2, 'Q':2, 'b':3, 'B':3, 'N':4, 'n':4, 'r':5, 'R':5, 'p':6, 'P':6}
    piece_kind = np.array([tmp0[x] for x in game.sim.pos2tag[:64]], dtype=np.int64).reshape(8,8)
    return correlation, tag_white, piece_kind


class QChessGameEnv(gym.Env):
    def __init__(self, mode:str='pvc', computer:str|collections.abc.Callable='greedy'):
        assert mode in ['pvc','pvp','cvp'] #white vs black
        self.mode = mode
        if isinstance(computer, str):
            assert computer=='greedy'
            self.computer = get_greedy_move
        else:
            self.computer = computer #input game, output command (str)
        self.game = QChessGame()

        tmp0 = gym.spaces.Box(float(0), float(1), shape=(8,8,8,8), dtype=float)
        tmp1 = gym.spaces.Box(0, 1, shape=(8,8), dtype=int)
        tmp2 = gym.spaces.Box(0, 6, shape=(8,8), dtype=int)
        self.observation_space = gym.spaces.Dict({"correlation":tmp0, "tag_white":tmp1, "piece_kind":tmp2})
        self.action_space = gym.spaces.Box(np.zeros(9, dtype=np.int64), np.array([8]*8+[4], dtype=np.int64), shape=(9,), dtype=int)
        self._valid_action_str = None

    def _get_obs(self):
        tmp0 = game_to_observable(self.game)
        ret = {"correlation":tmp0[0], "tag_white":tmp0[1], "piece_kind":tmp0[2]}
        return ret

    def get_valid_action(self, kind:str='str'):
        if self._valid_action_str is None:
            self._valid_action_str = self.game.get_all_available_move()
        assert kind in {'str','int'}
        if kind=='str':
            ret = self._valid_action_str
        else:
            ret = [command_to_vector(x) for x in self._valid_action_str]
        return ret

    def _get_info(self, obs):
        prob = obs["correlation"].reshape(64,64).diagonal()
        tag_white = obs["tag_white"]
        piece_kind = obs["piece_kind"]
        piece_prob = np.zeros((2,6), dtype=np.float64) #(white,black) (kqbnrp)
        for x,y,z in zip(tag_white.reshape(-1), piece_kind.reshape(-1), prob):
            if y>0:
                piece_prob[x,y-1] += z
        ret = {
            "piece_prob":piece_prob,
            "is_finish_or_not": self.game.is_finish_or_not(), #continue/white/black/draw
            "step": self.game.current_step,
            'valid_action': self.get_valid_action('int'),
        }
        return ret

    def _chess_step(self, cmd:str|_tuple9int): #internal use
        if isinstance(cmd, tuple):
            assert len(cmd)==9
            cmd = vector_to_command(cmd)
        assert cmd in self.get_valid_action('str')
        self.game.run_short_cmd(cmd, tag_print=False)
        self._valid_action_str = None

    def reset(self, seed:(int|None)=None, options:(dict|None)=None):
        super().reset(seed=seed)
        self.game.rng = random.Random(seed)
        self.game._reset()
        self._valid_action_str = None
        if self.mode=='cvp':
            cmd = self.computer(self.game)
            self._chess_step(cmd)
        observation = self._get_obs()
        info = self._get_info(observation)
        return observation, info

    def step(self, action):
        action = tuple(int(x) for x in action)
        cmd = vector_to_command(action)
        self._chess_step(cmd)
        if (self.game.is_finish_or_not()=='continue') and (self.mode in ['pvc','cvp']):
            cmd = self.computer(self.game)
            self._chess_step(cmd)
        observation = self._get_obs()
        info = self._get_info(observation)
        terminated = info["is_finish_or_not"]!='continue'
        tmp0 = info['is_finish_or_not']
        if (self.mode=='pvc') or (self.mode=='pvp' and self.game.is_white):
            reward = 1 if (tmp0=='white') else (-1 if (tmp0=='black') else 0)
        if (self.mode=='cvp') or (self.mode=='pvp' and (not self.game.is_white)):
            reward = 1 if (tmp0=='black') else (-1 if (tmp0=='white') else 0)
        truncated = False
        return observation, reward, terminated, truncated, info
