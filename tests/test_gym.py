import numpy as np

import qchess

def test_command_to_vector():
    case_list = [
        ('a2,b2', (1,2,0,0,2,2,0,0,0)),
        ('a2b2,c3', (1,2,2,2,3,3,0,0,0)),
        ('c3,a2b2', (3,3,0,0,1,2,2,2,0)),
        ('e1h1,g1f1', (5,1,8,1,7,1,6,1,0)),
        ('a7,a8q', (1,7,0,0,1,8,0,0,4)),
    ]
    for cmd,vec in case_list:
        assert qchess.gym.command_to_vector(cmd)==vec
        assert qchess.gym.vector_to_command(vec)==cmd


def test_game_to_observable():
    game = qchess.QChessGame.rand_qchess(step=10)
    correlation, tag_white, piece_kind = qchess.gym.game_to_observable(game)
    # ?kqbkrp -> 0123456
    tag,prob = game.sim.get_marginal_probability()
    assert np.abs(np.diag(correlation.reshape(64,64)) - np.array(prob)).max() < 1e-12
