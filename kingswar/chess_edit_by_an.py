import numpy as np
from qiskit import QuantumCircuit, QuantumRegister,ClassicalRegister,execute
from qiskit.quantum_info.operators import Operator
import board
import piece
from qiskit import Aer, transpile
# from qiskit_aer import AerSimulator


class Chess():
    """
    A class to represent the game of chess.
    
    ...

    Attributes:
    -----------
    board : Board
        represents the chess board of the game

    turn : bool
        True if white's turn

    white_ghost_piece : tup
        The coordinates of a white ghost piece representing a takeable pawn for en passant

    black_ghost_piece : tup
        The coordinates of a black ghost piece representing a takeable pawn for en passant

    Methods:
    --------
    promote(pos:stup) -> None
        Promotes a pawn that has reached the other side to another, or the same, piece

    move(start:tup, to:tup) -> None
        Moves the piece at `start` to `to` if possible. Otherwise, does nothing.
    """

    def __init__(self):
        self.board = board.Board()

        self.turn = True

        self.white_ghost_piece = None
        self.black_ghost_piece = None
        self.white_split=False
        self.black_split = False
        self.done=False

    def promotion(self, pos):
        pawn = None
        while pawn == None:
            promote = input("Promote pawn to [Q, R, N, B, P(or nothing)]: ")
            if promote not in ['Q', 'R', 'N', 'B', 'P', '']:
                print("Not a valid promotion piece")
            else:
                if promote == 'R':
                        pawn = piece.Rook(True)
        #         if promote == 'Q':
        #             pawn = piece.Queen(True)
        #         elif promote == 'R':
        #             pawn = piece.Rook(True)
        #         elif promote == 'N':
        #             pawn = piece.Knight(True)
        #         elif promote == 'B':
        #             pawn = piece.Bishop(True)
        #         elif promote == 'P' or promote == '':
        #             pawn = piece.Pawn(True)
        self.board.board[pos[0]][pos[1]] = pawn

    def move(self, start, to,startq,toq,engine,sp,to2,toq2):
        """
        Moves a piece at `start` to `to`. Does nothing if there is no piece at the starting point.
        Does nothing if the piece at `start` belongs to the wrong color for the current turn.
        Does nothing if moving the piece from `start` to `to` is not a valid move.

        start : tup
            Position of a piece to be moved

        to : tup
            Position of where the piece is to be moved

        precondition: `start` and `to` are valid positions on the board
        """

        if self.board.board[start[0]][start[1]] == None:
            print("There is no piece to move at the start place")
            return

        target_piece = self.board.board[start[0]][start[1]]
        if self.turn != target_piece.color:
            print("That's not your piece to move")
            return

        end_piece = self.board.board[to[0]][to[1]]
        is_end_piece = end_piece != None
        print(is_end_piece)

        # Checks if a player's own piece is at the `to` coordinate
        if is_end_piece and self.board.board[start[0]][start[1]].color == end_piece.color:
            print("There's a piece in the path.")
            return
        # Checks split path
        if to==to2:
            print("There's a piece in the split path.")
            return
        # Checks if a player want to split rook
        if target_piece.name == 'R' and sp:
            print("Can not split rook.")
            return
        # Checks if a player split twice
        if self.white_split and to2!=0:
            print(to2)
            print("You already splited a piece.")
            return

        if self.black_split and to2!=0:
            print(to2)
            print("You already splited a piece.")
            return
        if target_piece.is_valid_move(self.board, start, to):
            # Special check for if the move is castling
            # Board reconfiguration is handled in Piece
            measu=False
            if target_piece.name == 'K' and abs(start[1] - to[1]) == 2:
                print("castled")

                if self.turn and self.black_ghost_piece:
                    self.board.board[self.black_ghost_piece[0]][self.black_ghost_piece[1]] = None
                elif not self.turn and self.white_ghost_piece:
                    self.board.board[self.white_ghost_piece[0]][self.white_ghost_piece[1]] = None
                self.turn = not self.turn
                return



            if self.board.board[to[0]][to[1]]:

                print(str(self.board.board[to[0]][to[1]]) + " taken.")
                # Special logic for ghost piece, deletes the actual pawn that is not in the `to`
                # coordinate from en passant
                if self.board.board[to[0]][to[1]].name == "GP":
                    if self.turn:
                        self.board.board[
                            self.black_ghost_piece[0] + 1
                            ][
                            self.black_ghost_piece[1]
                        ] = None
                        self.black_ghost_piece = None
                    else:
                        self.board.board[self.white_ghost_piece[0] - 1][self.black_ghost_piece[1]] = None
                        self.white_ghost_piece = None
                # split piece capture with quantum measurement
                if target_piece.color and self.white_split:
                    if target_piece.name == 'K':
                        backend = Aer.get_backend('aer_simulator')
                        circ.iswap(startq, anc[0])
                        circ.measure(anc[0], cr)
                        # simulator = Aer.get_backend('aer_simulator')
                        result = execute(circ, backend=backend, shots=1).result()
                        cbit_value = int(list(result.get_counts().keys())[0].split(' ')[0])
                        if cbit_value == 1:
                            print(str(self.board.board[to[0]][to[1]]) + " taken.")
                            self.board.board[to[0]][to[1]] = target_piece
                        else:
                            print(str(self.board.board[start[0]][start[1]]) + " collapsed.")
                            self.board.board[start[0]][start[1]] = None
                            self.white_split = False
                            target_piece = end_piece

                elif not target_piece.color and self.black_split:
                    if target_piece.name == 'K':
                        backend = Aer.get_backend('aer_simulator')
                        circ.iswap(startq, anc[0])
                        circ.measure(anc[0], cr)
                        # simulator = Aer.get_backend('aer_simulator')
                        result = execute(circ, backend=backend, shots=1).result()
                        cbit_value = int(list(result.get_counts().keys())[0].split(' ')[0])
                        if cbit_value == 1:
                            print(str(self.board.board[to[0]][to[1]]) + " taken.")
                            self.board.board[to[0]][to[1]] = target_piece
                        else:
                            print(str(self.board.board[start[0]][start[1]]) + " collapsed.")
                            self.board.board[start[0]][start[1]] = None
                            self.black_split = False
                            target_piece = end_piece

            self.board.board[to[0]][to[1]] = target_piece


            if sp:
                if target_piece.color:
                    self.white_split=True
                else:
                    self.black_split=True
                self.board.board[to2[0]][to2[1]] = target_piece
                sqrt2 = np.sqrt(2)
                Matrix = Operator([
                    [1, 0, 0, 0],
                    [0, 1 / sqrt2, 1j / sqrt2, 0],
                    [0, 1j / sqrt2, 1 / sqrt2, 0],
                    [0, 0, 0, 1]])
                circ.unitary(Matrix, [startq,toq])
                circ.iswap(startq,toq2)


            else:
                circ.iswap(startq,toq)
            self.board.board[start[0]][start[1]] = None
            print(str(target_piece) + " moved.")

            if self.turn and self.black_ghost_piece:
                self.board.board[self.black_ghost_piece[0]][self.black_ghost_piece[1]] = None
            elif not self.turn and self.white_ghost_piece:
                self.board.board[self.white_ghost_piece[0]][self.white_ghost_piece[1]] = None

            self.turn = not self.turn
        if is_end_piece != False:
            if end_piece.name == 'K' and self.board.board[to[0]][to[1]] == target_piece:
                print('Win')
                self.done=True
    def end_game(self):
        if self.done:
            return True
        else:
            return False

def translate(s):
    """
    Translates traditional board coordinates of chess into list indices
    """
    try:
        row = int(s[0])
        col = s[1]
        if row < 1 or row > 5:
            print(s[0] + "is not in the range from 1 - 5")
            return None
        if col < 'a' or col > 'd':
            print(s[1] + "is not in the range from a - d")
            return None
        dict = {'a': 0, 'b': 1, 'c': 2, 'd': 3}
        return (row-1, dict[col])
    except:
        print(s + "is not in the format '[number][letter]'")
        return None

def transq(s):
    a = np.arange(0, 20).reshape(5,4)
    qn=a[s[0]][s[1]]
    return int(qn)
def checklen(s):
    if len(s)==4:
        return True
    else:
        return False

if __name__ == "__main__":
    chess = Chess()
    chess.board.print_board()
    qr = QuantumRegister(20, 'q')
    anc = QuantumRegister(1, 'ancilla')
    cr = ClassicalRegister(1, 'c')
    circ = QuantumCircuit(qr,anc,cr)

    circ.x(0)
    circ.x(5)
    circ.x(14)
    circ.x(19)
    to2=0
    toq2=0
    e=False
    while True:
        split = False
        start = input("From: ")
        to = input("To: ")
        start = translate(start)
        if checklen(to):
            to1 = translate(to[:2])
            to2 = translate(to[2:4])
            startq=transq(start)
            toq1=transq(to1)
            toq2 = transq(to2)

            if start == None or to == None:
                continue
            split=True
            chess.move(start, to1,startq,toq1,circ,split,to2,toq2)
            to2 = 0
        else:
            to = translate(to)

            startq = transq(start)
            toq = transq(to)

            if start == None or to == None:
                continue
            chess.move(start, to, startq, toq, circ,split,to2,toq2)
        e=chess.end_game()

        print(circ)
        chess.board.print_board()
        if e:
            break