import random
import numpy as np

import qchess

_ZERO_EPS = qchess.chess_utils._ZERO_EPS

def test_int_to_bitarray():
    rng = random.Random()
    for n in [4,8,16,32,64]:
        x = rng.randint(0, 2**n-1)
        y = qchess.utils.int_to_bitarray(x, n)
        assert x== qchess.utils.bitarray_to_int(y)
        y1 = np.array([(x>>a)&1 for a in range(n)], dtype=np.uint8)
        assert np.all(y==y1)


def test_weird_entanglement():
    for ind0 in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
        z0.split_jump('c4', 'c3', 'd4')
        z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
        if ind0==0:
            z0.merge_slide('d5', 'b3', 'b5', [], [])
            ret_ = {'0000000000000000001000000000000000010000000000000000000000000000': -0.5,
                '0000000000000000001000000000000001000000000000000000000000000000': 0.5j,
                '0000000000000000000000000001000001000000000000000000000000000000': 0.5j,
                '0000000000000000000000000001000000010000000000000000000000000000': 0.5}
        else:
            z0.merge_slide('b3', 'd5', 'b5', [], [])
            ret_ = {'0000000000000000010000000001000000000000000000000000000000000000': -0.5,
                '0000000000000000000000000001000001000000000000000000000000000000': 0.5j,
                '0000000000000000001000000000000001000000000000000000000000000000': 0.5j,
                '0000000000000000011000000000000000000000000000000000000000000000': 0.5}
        ret0 = z0.coeff
        assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_merge_is_reverse_split():
    for ind0 in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
        z0.split_jump('c4', 'c3', 'd4')
        z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
        if ind0==0:
            z0.merge_slide('b3', 'd5', 'd3', ['c3'], ['d4'])
        else: #equivalent
            z0.merge_slide('d5', 'b3', 'd3', ['d4'], ['c3']) #equivalent

        ret_ = {'0000000000000000001100000000000000000000000000000000000000000000': 1j/np.sqrt(2),
            '0000000000000000000100000001000000000000000000000000000000000000': 1j/np.sqrt(2)}
        ret0 = z0.coeff
        assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_basic_entanglement():
    for ind0 in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
        z0.split_jump('c4', 'c3', 'd4')
        z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
        if ind0==0:
            z0.measure('b3', fix=0)
            assert abs(z0.coeff['0000000000000000001000000000000000010000000000000000000000000000'] - (-1)) < _ZERO_EPS
        else:
            z0.measure('b3', fix=1)
            assert abs(z0.coeff['0000000000000000010000000001000000000000000000000000000000000000'] - (-1)) < _ZERO_EPS


def test_block_slided():
    for measure_fix in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('c3R c4r c5N')
        z0.split_jump('c3', 'b3', 'd3')
        z0.split_jump('c4', 'b4', 'd4')
        z0.split_jump('c5', 'b5', 'd5')
        z0.blocked_slide('d3', 'd5', ['d4'], measure_fix=measure_fix)
        if measure_fix==0:
            ret_ = {'0000000000000000010000000001000001000000000000000000000000000000': -0.5j,
                '0000000000000000010000000100000001000000000000000000000000000000': -0.5j,
                '0000000000000000000100000001000001000000000000000000000000000000': -0.5j,
                '0000000000000000000000000100000001010000000000000000000000000000': 0.5}
        else:
            ret_ = {'0000000000000000010000000001000000010000000000000000000000000000': -0.5j,
                '0000000000000000000100000100000000010000000000000000000000000000': -0.5j,
                '0000000000000000000100000001000000010000000000000000000000000000': -0.5j,
                '0000000000000000010000000100000000010000000000000000000000000000': -0.5j}
        ret0 = z0.coeff
        assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_misc00():
    hf_pos_str_to_int = lambda x: (int(x[1])-1) * 8 + 'abcdefgh'.index(x[0])
    hf_pos_int_to_str = lambda x: 'abcdefgh'[x%8] + str(x//8+1)
    assert all([hf_pos_str_to_int(hf_pos_int_to_str(x))==x for x in range(64)])


def test_measure():
    for index in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
        z0.split_jump('c4', 'c3', 'd4')
        z0.capture_jump('d3', 'd4')
        z0.capture_jump('c3', 'd4', measure_fix=index)
        ret0 = z0.coeff
        ret_ = {'0000000000000000000000000001000000000000000000000000000000000000': -1j if (index==0) else 1}
        assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())
        assert z0.pos2tag[qchess.utils.hf_convert_pos_to_int('d4')]==('R' if (index==0) else 'r')


def test_weird_capture():
    for index in [0,1]:
        z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
        z0.split_jump('c4', 'c3', 'd4')
        z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
        z0.capture_jump('b3', 'c3', measure_fix=index)
        if index==0:
            ret_ = {'0000000000000000001000000000000000010000000000000000000000000000': -1}
        else:
            ret_ = {'0000000000000000001000000001000000000000000000000000000000000000': -1j}
        ret0 = z0.coeff
        assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())

    z0 = qchess.QChessSparseSimulator.from_board('d3R c4r')
    z0.split_jump('c4', 'c3', 'd4')
    z0.split_slide('d3', 'd5', 'b3', ['d4'], ['c3'])
    z0.capture_jump('b3', 'd4', measure_fix=1)
    ret_ = {'0000000000000000000000000001000000000000000000000000000000000000': 1}
    ret0 = z0.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_en_passant():
    z0 = qchess.QChessGame()
    cmd_list = 'a2,a4  h7,h5  a4,a5  b7,b5  a5,b6'.split()
    for cmd in cmd_list:
        z0.run_short_cmd(cmd)
    ret_ = {'1111111101111111000000000000000000000001010000001011111011111111': -1j}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_qchessgame_misc():
    z0 = qchess.QChessGame()
    z0.run_short_cmd('a2,a4', tag_print=False)
    z0.run_short_cmd('h7,h5', tag_print=False)
    z0.run_short_cmd('a1,a3', tag_print=False)
    z0.run_short_cmd('h8,h6', tag_print=False)
    z0.run_short_cmd('a3,c3', tag_print=False)
    z0.run_short_cmd('h6,d6', tag_print=False)
    z0.run_short_cmd('a4,a5', tag_print=False) #dummy step
    z0.run_short_cmd('d6,d4', tag_print=False)
    z0.run_short_cmd('a5,a6', tag_print=False) #dummy step
    z0.run_short_cmd('d4,d3c4', tag_print=False)
    z0.run_short_cmd('c3,e3c5', tag_print=False)
    z0.run_short_cmd('b7,a6', tag_print=False) #dummy step
    z0.run_short_cmd('e3c5,e5', tag_print=False)
    ret_ = {'0111111101111111000100000000000000001001100000001011111011111110': 0.5,
        '0111111101111111000110000000000000000001100000001011111011111110': -0.5j,
        '0111111101111111000010000010000000000001100000001011111011111110': 0.5j,
        '0111111101111111000000000010000000001001100000001011111011111110': 0.5}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())

def test_qchessgame_promotion():
    z0 = qchess.QChessGame()
    z0.run_short_cmd('a2,a4', tag_print=False)
    z0.run_short_cmd('h7,h5', tag_print=False)
    z0.run_short_cmd('a4,a5', tag_print=False)
    z0.run_short_cmd('h5,h4', tag_print=False)
    z0.run_short_cmd('a5,a6', tag_print=False)
    z0.run_short_cmd('h4,h3', tag_print=False)
    z0.run_short_cmd('a6,b7', tag_print=False)
    z0.run_short_cmd('h3,g2', tag_print=False)
    assert z0.is_valid_move_pawn('b7', 'a8', None)=='' #'' means invalid
    assert z0.is_valid_move_pawn('b7', 'a8', promotion='q')!=''
    z0.run_short_cmd('b7,a8q', tag_print=False)
    assert z0.is_valid_move_pawn('g2', 'f1', None)==''
    assert z0.is_valid_move_pawn('g2', 'f1', promotion='r')!=''
    z0.run_short_cmd('g2,f1n', tag_print=False)
    ret_ = {'1111111101111101000000000000000000000000000000001011111011111111': (-1+0j)}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_qchessgame_replay():
    rng = random.Random()
    z0 = qchess.QChessGame(rng)
    history_list = []
    for _ in range(40):
        tmp1 = rng.choice(z0.get_all_available_move())
        z0.run_short_cmd(tmp1, tag_print=False)
        history_list.append(tmp1 + (f',{z0.sim.last_measure}' if z0.sim.last_measure is not None else ''))
    ret0_ = {k:v for k,v in z0.sim.coeff.items()}
    ret1_ = list(z0.sim.pos2tag)

    z0 = qchess.QChessGame()
    for x in history_list:
        z0.run_short_cmd(x, tag_print=False)
    assert all(x==y for x,y in zip(ret1_,z0.sim.pos2tag))
    assert (len(ret0_)==len(z0.sim.coeff)) and all(abs(ret0_[x]-y)<_ZERO_EPS for x,y in z0.sim.coeff.items())

def test_weird_split_but_only_one_path():
    z0 = qchess.QChessGame()
    z0.add_piece('c6', 'R', reset=True)
    z0.add_piece('d5', 'r')
    z0.run_short_cmd('c6,c5d6', tag_print=False)
    z0.run_short_cmd('d5,b5d7', tag_print=False)
    z0.run_short_cmd('c5,c4', tag_print=False) #dummy step
    z0.run_short_cmd('b5,b6', tag_print=False)
    z0.run_short_cmd('c4,c5', tag_print=False) #dummy step
    z0.run_short_cmd('b6,e6b4', tag_print=False)
    ret0_ = {'0000000000000000000000000000000000100000000000000001000000000000': (0.7071067811865475-0j),
            '0000000000000000000000000100000000000000000100000000000000000000': (0.7071067811865475-0j)}
    ret1_ = {25: 'r', 34: 'R', 43: 'R', 51: 'r'}
    assert sum((y is not None) for y in z0.sim.pos2tag)==len(ret1_)
    assert all(v==z0.sim.pos2tag[k] for k,v in ret1_.items())
    assert all(abs(ret0_[x]-y)<_ZERO_EPS for x,y in z0.sim.coeff.items())


def test_qchessgame_pawn_valid_move():
    z0 = qchess.QChessGame()
    # z0.add_piece('a2', 'P', reset=True)
    assert z0.is_valid_move_pawn('a2', 'a4', None)!=''
    assert z0.is_valid_move_pawn('a2', 'a4', 'Q')==''


def test_qchess_pawn_slide():
    z0 = qchess.QChessGame()
    z0.run_short_cmd('a2,a4', tag_print=False)
    z0.run_short_cmd('h7,h5', tag_print=False)
    z0.run_short_cmd('a1,a3', tag_print=False)
    z0.run_short_cmd('h8,h6', tag_print=False)
    z0.run_short_cmd('a3,b3c3', tag_print=False)
    z0.run_short_cmd('h6,c6', tag_print=False)
    z0.run_short_cmd('b2,b4', tag_print=False) #slide (controlled-jump)
    z0.run_short_cmd('c6,c4b6', tag_print=False)
    z0.is_valid_move_pawn('b2', 'b4', None)
    z0.run_short_cmd('b4,b5', tag_print=False)
    z0.run_short_cmd('g7,g6', tag_print=False) #dummy step
    assert z0.is_valid_move_pawn('b2', 'b4', None)!=''
    z0.run_short_cmd('b2,b4', tag_print=False) #valid but empty move
    assert z0['b4'] is None
    z0.run_short_cmd('h5,h4', tag_print=False)
    assert z0.is_valid_move_pawn('c2', 'c4', None)!=''
    z0.set_prefix_measure(0)
    z0.run_short_cmd('c2,c4', tag_print=False)
    assert z0.pawn_last_twostep['c2'] is None


def test_qchess_pawn_capture():
    z0 = qchess.QChessGame()
    z0.run_short_cmd('a2,a4', tag_print=False)
    z0.run_short_cmd('h7,h5', tag_print=False)
    z0.run_short_cmd('a1,a3', tag_print=False)
    z0.run_short_cmd('h5,h4', tag_print=False)
    z0.run_short_cmd('a3,b3g3', tag_print=False)
    z0.run_short_cmd('h4,g3', tag_print=False)
    s12 = 1/np.sqrt(2)
    ret_ = {'01111111011111110000001010000000000000000000000011111110111111111': -s12*1j,
        '01111111011111110100000010000001000000000000000011111110111111110': s12*1j}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


# z0 = qchess.QChessGame()
# z0.run_short_cmd('b1,a3c3', tag_print=False)
# z0.run_short_cmd('g8,f6h6', tag_print=False)
# z0.run_short_cmd('c2,c4', tag_print=False)
# z0.run_short_cmd('f6,d5e4', tag_print=False)
# z0.set_prefix_measure(1)
# z0.run_short_cmd('c4,d5')


def test_castling():
    z0 = qchess.QChessGame()
    cmd_list = 'c2,c4  g7,g6  b1,c3  f8,h6  d1,a4  g8,f6  b2,b3  e8h8,g8f8  c1,a3  a7,a6  e1a1,c1d1'.split()#
    for x in cmd_list:
        z0.run_short_cmd(x, tag_print=False)
    ret_ = {'0011011110011111111000001010000000000000100001110111110111110110': 1j}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_pawn_last_twostep():
    cmd_list = ['g1,f3h3', 'b8,a6c6', 'b1,c3a3', 'a6,b8b4', 'b2,b4,1', 'b4,a2,1', 'a1,a2,1', 'g8,h6', 'f3,h4d4', 'h6,g8g4', 'g2,g4,0', 'c7,c5', 'b2,b3',
            'c5,d4,1', 'd2,d4,0', 'c5,d4,1']#, 'd4,c3,1'], 'd1,d3', 'd8,c7b6', 'd3,c3,1', 'd4,c3,1', 'c7,h2,1', 'h1,h2,1', 'g8,h6f6', 'c1,d2e3', 'c3,d2,1']
    z0 = qchess.QChessGame()
    for x in cmd_list:
        z0.run_short_cmd(x, tag_print=False)

    ret_ = {'0011110110101101110000000001001100000000000000001101111110111111': 1j/np.sqrt(6),
        '0011110110101101011000010001001000000000000000001101111110111111': 1/np.sqrt(3),
        '0011110110101101011000000001001100000000000000001101111110111111': 1j/np.sqrt(6),
        '0011110110101101110000010001001000000000000000001101111110111111': 1/np.sqrt(3)}
    ret0 = z0.sim.coeff
    assert (len(ret0)==len(ret_)) and all(abs(ret0[x]-y)<_ZERO_EPS for x,y in ret_.items())


def test_black_king_castling():
    z0 = qchess.QChessGame()
    # Negative Test Cases（Invalid report）
    # black short castling after short side rook move
    # cmd_list = ['g2,g3','b7,b6','g1,f3','c7,c6','f1,h3','g7,g6','b2,b3','g8,f6','c2,c3','c8,a6','c1,b2','f8,h6','b1,a3','d8,c7','c3,c4','c6,c5','b3,b4','b8,c6','d2,d3','h8,g8','e2,e3','g8,h8','e1h1,g1f1','e8h8,f8g8']

    # black long castling after long side rook move
    # cmd_list = ['g2,g3','b7,b6','g1,f3','c7,c6','f1,h3','g7,g6','b2,b3','g8,f6','c2,c3','c8,a6','c1,b2','f8,h6','b1,a3','d8,c7','c3,c4','c6,c5','b3,b4','b8,c6','d2,d3','a8,b8','e2,e3','b8,a8','d1,d2','e8a8,c8d8','e1a1,c1d1']

    # Positive Test Cases（Valid report）
    # black short castling
    cmd_list = ['g2,g3','b7,b6','g1,f3','c7,c6','f1,h3','g7,g6','b2,b3','g8,f6','c2,c3','c8,a6','c1,b2','f8,h6','b1,a3','d8,c7','c3,c4','c6,c5','b3,b4','b8,c6','d2,d3','a8,b8','e2,e3','e8h8,g8f8']
    # black long castling
    # cmd_list = ['g2,g3','b7,b6','g1,f3','c7,c6','f1,h3','g7,g6','b2,b3','g8,f6','c2,c3','c8,a6','c1,b2','f8,h6','b1,a3','d8,c7','c3,c4','c6,c5','b3,b4','b8,c6','d2,d3','h8,g8f8','e2,e3','e8a8,c8d8']

    for x in cmd_list:
        z0.run_short_cmd(x, tag_print=True)



def test_last_measure1_prob():
    z0 = qchess.QChessGame()
    cmd_list = 'd2,d3 h7,h6 e2,e3 h6,h5 e1,d2e2 h5,h4'.split(' ')
    for x in cmd_list:
        z0.run_short_cmd(x, tag_print=False)
    z0.run_short_cmd('d1,e2')
    assert abs(z0.sim.last_measure1_prob-0.5) < _ZERO_EPS
