from .chess_utils import QChessGame, QChessSparseSimulator, ChessPosition, run_QChessGame

def _has_pygame():
    try:
        import pygame
        ret = True
    except ImportError:
        ret = False
    return ret

if _has_pygame():
    from .gui import PygameGUI
    from . import gui
from . import utils
from . import chess_utils
from . import gym

def _run_gui():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['pvp', 'pvc', 'cvp'], nargs='?', default='pvp', help='pvp: player vs player; pvc: player vs computer; cvp: computer vs player')
    parser.add_argument('--history', type=str, default='', help='path to history file for replaying game moves')
    parser.add_argument('--ai-delay', type=float, default=0.5, help='delay time for AI move in seconds')
    parser.add_argument('--replay-delay', type=float, default=0.05, help='delay time for replaying game moves in seconds')
    args = parser.parse_args()

    from . import gui
    gui = gui.PygameGUI()
    import os
    if (args.history) and os.path.exists(args.history):
        with open(args.history, 'r') as fid:
            history = [x.strip() for x in fid.readlines()]
    else:
        history = []
    gui.run(mode=args.mode, split_weight=1.0, history=history, replay_delay=args.replay_delay, ai_delay=args.ai_delay)


def _run_terminal():
    z0 = QChessGame()
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['pvp', 'pvc', 'cvp', 'cvc'], nargs='?', default='pvc', help='pvp: player vs player; pvc: player vs computer; cvp: computer vs player')
    parser.add_argument('--history', type=str, default='', help='path to history file for replaying game moves')
    parser.add_argument('--ai-delay', type=float, default=0.5, help='delay time for AI move in seconds')
    parser.add_argument('--replay-delay', type=float, default=0.05, help='delay time for replaying game moves in seconds')
    parser.add_argument('--split-prob', type=float, default=0.2, help='probability weight for splitting moves')
    parser.add_argument('--max-cvc-step', type=int, default=100, help='maximum number of steps for computer vs computer game')
    args = parser.parse_args()
    z0 = QChessGame()
    import os
    import time
    if (args.history) and os.path.exists(args.history):
        with open(args.history, 'r') as fid:
            history = [x.strip() for x in fid.readlines()]
        for x in history:
            print(x)
            z0.run_short_cmd(x, tag_print=True)
            time.sleep(args.replay_delay)

    run_QChessGame(z0, args.mode, args.split_prob, args.ai_delay, args.max_cvc_step)
