import time
import numpy as np
import random

import qchess

# check test_utils.py for more demo
def demo_computational_heavy_case():
    z0 = qchess.QChessSparseSimulator.from_board(' '.join([f'{x}{y}R' for x in 'abcd' for y in range(1,8+1)]))
    for x in range(32):
        assert x<=32
        src = 'abcd'[x//8] + str(x%8+1)
        dst = 'efgh'[x//8] + str(x%8+1)
        z0.apply_sqrtiswap(qchess.ChessPosition(src).pos, qchess.ChessPosition(dst).pos)
        print(z0)

def demo_en_passant():
    z0 = qchess.QChessGame()
    cmd_list = 'a2,a4  h7,h5  a4,a5  b7,b5  a5,b6'.split()
    for cmd in cmd_list:
        time.sleep(1)
        print(cmd)
        z0.run_short_cmd(cmd)


def demo_weired_split_slide():
    z0 = qchess.QChessGame()
    z0.add_piece('c4', 'R', reset=True)
    z0.add_piece('d5', 'r')
    z0.run_short_cmd('c4,b4e4')
    z0.run_short_cmd('d5,d4d6')
    z0.run_short_cmd('b4,f4e4')


def demo_en_passant01():
    z0 = qchess.QChessGame()
    z0.run_short_cmd('a2,a4')
    z0.run_short_cmd('h7,h5')
    z0.run_short_cmd('a4,a5')
    z0.run_short_cmd('b7,b5')
    z0.run_short_cmd('a5,b6')


def demo_qchess_simulator_basic():
    z0 = qchess.QChessSparseSimulator.from_board('c3R c4r')
    z0.normal_jump('c3', 'd3')
    z0.split_jump('c4', 'c3', 'd4')
    z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
    z0.merge_slide('d5', 'b3', 'b5', [], [])
    z0.print_verbose()


def demo_qchess_game_misc00():
    z0 = qchess.QChessGame()
    print(z0.get_all_available_move())
    z0.run_short_cmd('a2,a4')
    z0.run_short_cmd('h7,h5')
    z0.run_short_cmd('a1,a3')
    z0.run_short_cmd('h8,h6')
    z0.run_short_cmd('a3,c3')
    z0.run_short_cmd('h6,d6')
    z0.run_short_cmd('a4,a5') #dummy step
    z0.run_short_cmd('d6,d4')
    z0.run_short_cmd('a5,a6') #dummy step
    z0.run_short_cmd('d4,d3c4')
    z0.run_short_cmd('c3,e3c5')
    z0.run_short_cmd('b7,a6') #dummy step
    z0.run_short_cmd('e3c5,e5')


def test_revert_cmd():
    z0 = qchess.QChessGame.rand_qchess()
    history = list(z0.history)
    prob_ = np.array(z0.sim.get_marginal_probability()[1])

    for step in [1,2,3]:
        z0.revert_cmd(step)
        for cmd in history[(-step):]:
            z0.run_short_cmd(cmd, tag_print=False)
        tmp0 = np.array(z0.sim.get_marginal_probability()[1])
        assert np.abs(tmp0-prob_).max()<1e-10


def demo_debug():
    with open('debug.txt', 'r') as fid:
        z233 = fid.read().strip().split()
    # z233 = ('e2,e3  f7,f6  g1,f3  d7,d6  f3,h4e5  h7,h6  e5,c4f3  c8,g4h3  e1,e2  h3,g2,1  f3,d4  e8,f7  e2,e1d3  '
    #         'e5g4,e6  g1,d1g5  b6,d4a5  e1,d1,0').split()
    z0 = qchess.QChessGame()
    for x in z233[:-1]:
        z0.run_short_cmd(x, tag_print=False)
    print(z0)
    z0.run_short_cmd(z233[-1])
    # z0.is_valid_move_king('e1', None, 'd1', None)
    # z0.set_prefix_measure(1)
    # z0.move_queen('b5', None, 'g5', None)
    # src,src1,dst,dst1 = ('b5', None, 'g5', None)
    # src = 33
    # dst = 38
    # path = [34,36,37]


def demo_random_play_qchess():
    rng = random.Random()
    np_rng = np.random.default_rng()
    z0 = qchess.QChessGame()
    split_probability_weight = 0.2
    history_list = []
    time_list = []
    t0 = time.time()
    for ind_step in range(5000):
        # time.sleep(0.5)
        tmp0 = z0.get_all_available_move()
        # decrease the probability of split move
        prob = np.array([(split_probability_weight if (len(x.split(',',1)[1])==4) else 1) for x in tmp0])
        tmp1 = tmp0[np_rng.choice(len(tmp0), p=prob/prob.sum())]
        tmp2 = 'white' if z0.is_white else 'black'
        t1 = time.time()
        time_list.append(t1 - t0)
        t0 = t1
        tmp3 = time_list[-10:]
        print(f'[step={ind_step}][#qubit={len(z0.sim.pos2tag)}][fps={len(tmp3)/sum(tmp3):.1f}][#coeff={len(z0.sim.coeff)}][#option={len(tmp0)}]({tmp2}) {tmp1}')
        z0.run_short_cmd(tmp1, tag_print=(ind_step%100==0))
        history_list.append(tmp1 + (f',{z0.sim.last_measure}' if z0.sim.last_measure is not None else ''))
        if z0.is_finish_or_not()!='continue':
            break


def demo_castling():
    z0 = qchess.QChessGame()
    cmd_list = 'c2,c4  g7,g6  b1,c3  f8,h6  d1,a4  g8,f6  b2,b3  e8h8,g8f8  c1,a3  a7,a6  e1a1,c1d1'.split()#
    for x in cmd_list:
        print('\nmove:', x)
        z0.run_short_cmd(x)
        time.sleep(0.8)


if __name__=='__main__':
    # demo_qchess_simulator_basic()
    demo_en_passant()

    # demo_qchess_simulator_basic()

    # demo_random_play_qchess()

    # demo_debug()
