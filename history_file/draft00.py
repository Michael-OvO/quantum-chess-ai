import numpy as np

import utils
import chess_utils
from chess_utils import InvalidCommand


# cmd
'''
cmd

:quit
:help
:move R a1 a2
:undo
:redo
'''

class ChessGame:
    def __init__(self):
        self._init()
        self.current_step = 0 #used for en passant
        # self.pos_to_piece = dict()

    def _init(self):
        hf0 = lambda x: np.array(x, dtype=np.int8)
        self.wpawn_pos = hf0([(x,1) for x in range(8)])
        self.bpawn_pos = hf0([(x,6) for x in range(8)])
        self.wrock_pos = hf0([(0,0), (7,0)])
        self.brook_pos = hf0([(0,7), (7,7)])
        self.wknight_pos = hf0([(1,0), (6,0)])
        self.bknight_pos = hf0([(1,7), (6,7)])
        self.wbishop_pos = hf0([(2,0), (5,0)])
        self.bbishop_pos = hf0([(2,7), (5,7)])
        self.wqueen_pos = hf0([(3,0)])
        self.bqueen_pos = hf0([(3,7)])
        self.wking_pos = hf0([(4,0)])
        self.bking_pos = hf0([(4,7)])

        # key (file,rank) a3 -> (0,2)
        # value (piece, index) ('P', 0), white in capital, black in lower, (None,None) for empty
        self.pos_to_piece = {(x,y):(None,None) for x in range(8) for y in range(8)}
        tmp0 = [('wpawn','P'), ('bpawn','p'), ('wrock','R'), ('brook','r'), ('wknight','N'), ('bknight','n'),
            ('wbishop','B'), ('bbishop','b'), ('wqueen','Q'), ('bqueen','q'), ('wking','K'), ('bking','k')]
        for x0,x1 in tmp0:
            for i,(x,y) in enumerate(getattr(self, x0+'_pos')):
                self.pos_to_piece[(int(x),int(y))] = (x1,i)

    def print_board(self):
        chess_utils.print_board(self.pos_to_piece, space=8)

    def read_command(self, cmd:str, is_white:bool):
        if cmd[0].islower(): # pawn move
            self.move_pawn(cmd, is_white)
        else:
            raise InvalidCommand('Not implemented yet')
        # if len(cmd)==3:
        #     assert cmd[0] in 'RNBQK'
        #     kind = cmd[0]
        #     cmd = cmd[1:]

    def run(self, reset=False):
        # TODO https://stackoverflow.com/q/6840420/7290857
        if reset:
            self._init()
        short_message = 'type ":quit" to quit, ":help" for detailed help, "Be3" to move bishop to e3'
        long_message = '''
:quit  quit
:help  help
:reset reset
e3     move pawn to e3
Be3    move bishop to e3
'''
        history_cmd = []
        is_white = True # white first
        while True:
            self.print_board()
            print(short_message)
            cmd = input('cmd({})> '.format('white' if is_white else 'black')).strip()
            if cmd==':quit':
                break
            elif cmd==':help':
                print(long_message)
                continue
            elif cmd==':reset':
                self._init()
                print()
                continue
            try:
                self.read_command(cmd, is_white=is_white)
                print()
                is_white = not is_white
                history_cmd.append(cmd)
            except InvalidCommand as e:
                print(e)
                continue


if __name__ == "__main__":
    chess = ChessGame()
    # chess.print_board()
    chess.run()
