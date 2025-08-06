blocked_path = "There's a piece in the path."
incorrect_path = "This piece does not move in this pattern."


def check_updown(board, start, to):
    """
    Checks if there are no pieces along the vertical or horizontal path
    from `start` (non-inclusive) to `to` (non-inclusive).

    board : Board
        Representation of the current board

    start : tup
        Start location of diagonal path

    to : tup
        End location of diagonal path
    """
    if start[0] == to[0]:
        smaller_y = start[1] if start[1] < to[1] else to[1]
        bigger_y = start[1] if start[1] > to[1] else to[1]

        for i in range(smaller_y + 1, bigger_y):
            if board.board[start[0]][i] != None:
                print(blocked_path)
                print("At: " + str(start[0], i))
                return False
        return True
    else:
        smaller_x = start[0] if start[0] < to[0] else to[0]
        bigger_x = start[0] if start[0] > to[0] else to[0]

        for i in range(smaller_x + 1, bigger_x):
            if board.board[i][start[1]] != None:
                print(blocked_path)
                return False
        return True



class Piece():
    """
    A class to represent a piece in chess
    
    ...

    Attributes:
    -----------
    name : str
        Represents the name of a piece as following - 
        Pawn -> P
        Rook -> R
        Knight -> N
        Bishop -> B
        Queen -> Q
        King -> K

    color : bool
        True if piece is white

    Methods:
    --------
    is_valid_move(board, start, to) -> bool
        Returns True if moving the piece at `start` to `to` is a legal
        move on board `board`
        Precondition: [start] and [to] are valid coordinates on the board.board
    is_white() -> bool
        Return True if piece is white

    """
    def __init__(self, color):
        self.name = ""
        self.color = color

    def is_valid_move(self, board, start, to):
        return False

    def is_white(self):
        return self.color

    def __str__(self):
        if self.color:
            return self.name
        else:
            return '\033[94m' + self.name + '\033[0m'

class Rook(Piece):
    def __init__(self, color, first_move = True):
        """
        Same as base class Piece, except `first_move` is used to check
        if this rook can castle.
        """
        super().__init__(color)
        self.name = "R"
        self.first_move = first_move 

    def is_valid_move(self, board, start, to):
        if start[0] == to[0] or start[1] == to[1]:
            return check_updown(board, start, to)
        print(incorrect_path)
        return False

class King(Piece):
    def __init__(self, color, first_move = True):
        """
        Same as base class Piece, except `first_move` is used to check
        if this king can castle.
        """
        super().__init__(color)
        self.name = "K"
        self.first_move = first_move

    def is_valid_move(self, board, start, to):
        if self.first_move and abs(start[1] - to[1]) == 2 and start[0] - to[0] == 0:
            return self.can_castle(board, start, to, to[1] - start[1] > 0)

        if abs(start[0] - to[0]) == 1 or start[0] - to[0] == 0:
            if start[1] - to[1] == 0 or abs(start[1] - to[1]) == 1:
                self.first_move = False
                return True

        print(incorrect_path)
        return False
