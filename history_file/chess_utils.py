import fractions

class InvalidCommand(Exception):
    pass

def print_board(pos_to_piece:dict, space:int=0):
    # https://stackoverflow.com/a/33206814/7290857
    dash = '\u2500'
    # https://symbl.cc/en/unicode/blocks/box-drawing/
    hf0 = lambda x: (' ' if x is None else (x if x.isupper() else f'\033[94m{x.upper()}\033[0m'))
    table = []
    for x in range(8):
        tmp0 = ' | '.join(hf0(pos_to_piece[(y,x)][0]) for y in range(8))
        table.append(' '*space + f'{x+1} | ' + tmp0 + ' |')
    print(' '*(space+3) + dash*31)
    print('\n'.join(table[::-1]))
    print(' '*(space+3) + dash*31)
    print(' '*space + '  | a | b | c | d | e | f | g | h |')


class ChessPiece:
    def __init__(self, parent, color:str, file:int, rank:int):
        assert (0<=file) and (file<8) #a-h -> 0-7
        assert (0<=rank) and (rank<8)
        self.file = file
        self.rank = rank
        assert (len(color)==1) and (color in 'wb')
        self.parent = parent
        self.probability = fractions.Fraction(1,1)

    def is_valid_move(self, file:int, rank:int, capture:bool):
        raise NotImplementedError

    def move(self, file:int, rank:int, check_valid:bool=True):
        pos_to_piece = self.parent.pos_to_piece
        # normal move
        # split move
        # entangled move
        if pos_to_piece[(file,rank)] is None:
            pass #move
        if check_valid and (not self.is_valid_move(file, rank, capture=False)[0]):
            raise InvalidCommand('invalid move')
        self.parent.pos_to_piece[(self.file,self.rank)] = None
        self.parent.pos_to_piece[(file,rank)] = self
        self.file = file
        self.rank = rank
        if self.first_move_step is not None:
            self.first_move_step = self.parent.current_step


class ChessPiece2:
    def __init__(self, parent, color:str, file:int, rank:int):
        assert (0<=file) and (file<8) #a-h -> 0-7
        assert (0<=rank) and (rank<8)
        self.pos = [(file,rank)]
        self.parent = parent
        self.probability = [fractions.Fraction(1,1)]

    def is_valid_move(self, index:int, file:int, rank:int, capture:bool):
        # TODO
        raise NotImplementedError

    def _raw_move(self, index:int, file:int, rank:int):
        self.parent.pos_to_piece[self.pos[index]] = (None,None)
        self.parent.pos_to_piece[(file,rank)] = (self,index)
        self.pos[index] = file,rank

# naive_move
# split
# capture

class ChessRock(ChessPiece2):
    def __init__(self, parent, color:str, file:int, rank:int):
        super().__init__(parent, color, file, rank)

    def is_valid_move(self, index:int, file:int, rank:int, capture:bool):
        pass


class ChessPawn(ChessPiece):
    def __init__(self, parent, color:str, file:int, rank:int):
        super().__init__(parent, color, file, rank)
        self.first_move_step = None #TODO for en passant

    def is_valid_move(self, file:int, rank:int, capture:bool):
        assert not capture, "TODO capture"
        assert (0<=file) and (file<8)
        assert (0<=rank) and (rank<8)
        if self.color=='w':
            if self.file==file:
                if (self.rank+1)==rank:
                    # TODO promotion
                    return True, ''
                elif (self.first_move_step is None) and ((self.rank+2)==rank):
                    return True, 'en passant'
                else:
                    return False, ''
            else:
                return False, ''
        else: #black
            if self.file==file:
                if (self.rank-1)==rank:
                    # TODO promotion
                    return True, ''
                elif (self.first_move_step is None) and ((self.rank-2)==rank):
                    return True, 'en passant'
                else:
                    return False, ''
            else:
                return False, ''

class ChessBishop(ChessPiece):
    def __init__(self, parent, color:str, file:int, rank:int):
        super().__init__(parent, color, file, rank)

    def is_valid_move(self, file: int, rank: int, capture:bool):
        assert not capture, "TODO capture"
        assert (0<=file) and (file<8)
        assert (0<=rank) and (rank<8)

