import numpy as np
import random
from .utils import get_rng

piece_value = {
    'PAWN': 100,
    'ROOK': 500,
    'KNIGHT': 320,
    'BISHOP': 330,
    'QUEEN': 900,
    'KING': 20000
}

pawnEvalWhite = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, -20, -20, 10, 10,  5,
    5, -5, -10,  0,  0, -10, -5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
    0, 0, 0, 0, 0, 0, 0, 0
]
pawnEvalBlack = list(reversed(pawnEvalWhite))

knightEval = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
]

bishopEvalWhite = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
]
bishopEvalBlack = list(reversed(bishopEvalWhite))

rookEvalWhite = [
    0, 0, 0, 5, 5, 0, 0, 0,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
]
rookEvalBlack = list(reversed(rookEvalWhite))

queenEval = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20
]

kingEvalWhite = [
    20, 30, 10, 0, 0, 10, 30, 20,
    20, 20, 0, 0, 0, 0, 20, 20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30
]
kingEvalBlack = list(reversed(kingEvalWhite))

kingEvalEndGameWhite = [
    50, -30, -30, -30, -30, -30, -30, -50,
    -30, -30,  0,  0,  0,  0, -30, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -20, -10,  0,  0, -10, -20, -30,
    -50, -40, -30, -20, -20, -30, -40, -50
]
kingEvalEndGameBlack = list(reversed(kingEvalEndGameWhite))

def chess_square_to_rowcol(square):
    # The column ('a' through 'h') is represented by the first character
    # and the row (1 through 8) by the second character in the string.
    column = square[0]
    row = int(square[1])-1

    # Convert the column from a letter to a number ('a' -> 0, 'b' -> 1, ..., 'h' -> 7)
    column_number = ord(column) - ord('a')
    return column_number, row

def chess_square_to_number(square):
    # The column ('a' through 'h') is represented by the first character
    # and the row (1 through 8) by the second character in the string.
    column = square[0]
    row = int(square[1])

    # Convert the column from a letter to a number ('a' -> 0, 'b' -> 1, ..., 'h' -> 7)
    column_number = ord(column) - ord('a')

    # Calculate the corresponding number
    number = 8 * (row - 1) + column_number
    return number

def evaluate_piece(piece, color, square, prob:float, end_game: bool):
    piece_type = piece
    mapping = []
    if piece_type == 'PAWN':
        mapping = pawnEvalWhite if color else pawnEvalBlack
    if piece_type == 'KNIGHT':
        mapping = knightEval
    if piece_type == 'BISHOP':
        mapping = bishopEvalWhite if color else bishopEvalBlack
    if piece_type == 'ROOK':
        mapping = rookEvalWhite if color else rookEvalBlack
    if piece_type == 'QUEEN':
        mapping = queenEval
    if piece_type == 'KING':
        # use end game piece-square tables if neither side has a queen
        if end_game:
            mapping = (
                kingEvalEndGameWhite
                if color
                else kingEvalEndGameBlack
            )
        else:
            mapping = kingEvalWhite if color else kingEvalBlack

    result = mapping[square]*round(prob,2)

    # print("Evaluating... Piece: "+piece+" | Color: "+str(color)+" | Square: "+str(square)+" | Prob: "+str(prob)+" | End Game: "+str(end_game) + " | Result: "+str(result))
    return result

# print(evaluate_piece('PAWN',True,9,0.25,False))

def evaluate_capture(board, move,is_en) -> float:
    """
    Given a capturing move, weight the trade being made.
    """
    src_, tag_ = move.split(',')
    src_col, src_row = chess_square_to_rowcol(src_)
    src_type = board[src_row][src_col]
    if is_en:
        return piece_value['PAWN']
    else:
        tag_col,tag_row=chess_square_to_rowcol(tag_)
        tag_type=board[tag_row][tag_col]

    if src_type is None or tag_type is None:
        raise Exception(
            f"Pieces were expected at _both_ {src_} and {tag_}"
        )
    return piece_value[tag_type[0]]*round(tag_type[2], 2) - piece_value[src_type[0]]*round(src_type[2], 2)

def move_value(board, move, endgame: bool) -> float:
    """
    How good is a move?
    A promotion is great.
    A weaker piece taking a stronger piece is good.
    A stronger piece taking a weaker piece is bad.
    Also consider the position change via piece-square table.
    """
    #TODO promotion
    src_, tag_ = move.split(',')
    capture_value = 0.0
    
    # merge or castling
    if len(src_) == 4:
        src_1,src_2=src_[:2], src_[2:]
        src1_col, src1_row = chess_square_to_rowcol(src_1)
        src2_col, src2_row = chess_square_to_rowcol(src_2)
        tag_col, tag_row = chess_square_to_rowcol(tag_)
        src1_type = board[src1_row][src1_col]
        src2_type = board[src2_row][src2_col]
        tag_type = board[tag_row][tag_col]
        src1_square = chess_square_to_number(src_1)
        src2_square = chess_square_to_number(src_2)
        tag_square = chess_square_to_number(tag_)
        _from_value1 = evaluate_piece(src1_type[0], src1_type[1], src1_square, src1_type[2], endgame)
        _from_value2 = evaluate_piece(src2_type[0], src2_type[1], src2_square, src2_type[2], endgame)
        _to_value1 = evaluate_piece(src1_type[0], src1_type[1], tag_square, src1_type[2], endgame)
        _to_value2 = evaluate_piece(src2_type[0], src2_type[1], tag_square, src2_type[2], endgame)
        position_change = _to_value1 - _from_value1 + _to_value2 - _from_value2
        is_capture=False
        src_turn=src1_type[1]
        
    # split
    elif len(tag_) == 4:
        tag_1, tag_2 = tag_[:2], tag_[2:]
        src_col, src_row = chess_square_to_rowcol(src_)
        tag1_col, tag1_row = chess_square_to_rowcol(tag_1)
        tag2_col, tag2_row = chess_square_to_rowcol(tag_2)
        src_col, src_row = chess_square_to_rowcol(src_)
        tag1_col, tag1_row = chess_square_to_rowcol(tag_1)
        tag2_col, tag2_row = chess_square_to_rowcol(tag_2)
        src_type = board[src_row][src_col]
        tag1_type = board[tag1_row][tag1_col]
        tag2_type = board[tag2_row][tag2_col]
        src_square = chess_square_to_number(src_)
        tag1_square = chess_square_to_number(tag_1)
        tag2_square = chess_square_to_number(tag_2)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)
        _to_value1 = evaluate_piece(src_type[0], src_type[1], tag1_square, src_type[2]/2, endgame)
        _to_value2 = evaluate_piece(src_type[0], src_type[1], tag2_square, src_type[2]/2, endgame)
        position_change = _to_value1 - _from_value + _to_value2 - _from_value
        is_capture=False
        src_turn = src_type[1]

    # promotion
    elif len(tag_) == 3:
        tag_p = tag_[:2]
        src_col,src_row=chess_square_to_rowcol(src_)
        tag_col,tag_row=chess_square_to_rowcol(tag_p)
        src_type=board[src_row][src_col]
        tag_type=board[tag_row][tag_col]
        src_square=chess_square_to_number(src_)
        tag_square=chess_square_to_number(tag_p)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)
        _to_value = evaluate_piece(src_type[0], src_type[1], tag_square, src_type[2], endgame)
        position_change = _to_value - _from_value
        capture_value = 1000*round(src_type[2],2)
        src_turn = src_type[1]
        
    # move, capture, en passan
    else:
        src_col,src_row=chess_square_to_rowcol(src_)
        tag_col,tag_row=chess_square_to_rowcol(tag_)
        src_type=board[src_row][src_col]
        tag_type=board[tag_row][tag_col]
        src_square=chess_square_to_number(src_)
        tag_square=chess_square_to_number(tag_)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)

        _to_value = evaluate_piece(src_type[0], src_type[1], tag_square, src_type[2], endgame)
        position_change = _to_value - _from_value
        src_turn = src_type[1]
        if is_capture_move(board, move) == 'capture' :
            capture_value = evaluate_capture(board, move, False)
        elif is_capture_move(board, move) == 'En passant' :
            capture_value = evaluate_capture(board, move, True)

    current_move_value = capture_value + position_change

    if not src_turn:
        current_move_value = -current_move_value

    return round(current_move_value, 2)

def move_value_v2(board, move, endgame: bool) -> float:
    """
    How good is a move?
    A promotion is great.
    A weaker piece taking a stronger piece is good.
    A stronger piece taking a weaker piece is bad.
    Also consider the position change via piece-square table.
    """
    src_, tag_ = move.split(',')
    
    # merge
    if len(src_) == 4 and len(tag_) == 2:
        src_1, src_2 = src_[:2], src_[2:]
        src1_col, src1_row = chess_square_to_rowcol(src_1)
        src2_col, src2_row = chess_square_to_rowcol(src_2)
        tag_col, tag_row = chess_square_to_rowcol(tag_)
        src1_type = board[src1_row][src1_col]
        src2_type = board[src2_row][src2_col]
        tag_type = board[tag_row][tag_col]
        src1_square = chess_square_to_number(src_1)
        src2_square = chess_square_to_number(src_2)
        tag_square = chess_square_to_number(tag_)
        _from_value1 = evaluate_piece(src1_type[0], src1_type[1], src1_square, src1_type[2], endgame)
        _from_value2 = evaluate_piece(src2_type[0], src2_type[1], src2_square, src2_type[2], endgame)
        _to_value1 = evaluate_piece(src1_type[0], src1_type[1], tag_square, src1_type[2], endgame)
        _to_value2 = evaluate_piece(src2_type[0], src2_type[1], tag_square, src2_type[2], endgame)
        position_change = _to_value1 - _from_value1 + _to_value2 - _from_value2
        capture_value = 0.0
     
    # split
    elif len(src_) ==2 and len(tag_) == 4:
        tag_1, tag_2 = tag_[:2], tag_[2:]
        src_col, src_row = chess_square_to_rowcol(src_)
        tag1_col, tag1_row = chess_square_to_rowcol(tag_1)
        tag2_col, tag2_row = chess_square_to_rowcol(tag_2)
        src_col, src_row = chess_square_to_rowcol(src_)
        tag1_col, tag1_row = chess_square_to_rowcol(tag_1)
        tag2_col, tag2_row = chess_square_to_rowcol(tag_2)
        src_type = board[src_row][src_col]
        tag1_type = board[tag1_row][tag1_col]
        tag2_type = board[tag2_row][tag2_col]
        src_square = chess_square_to_number(src_)
        tag1_square = chess_square_to_number(tag_1)
        tag2_square = chess_square_to_number(tag_2)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)
        _to_value1 = evaluate_piece(src_type[0], src_type[1], tag1_square, src_type[2]/2, endgame)
        _to_value2 = evaluate_piece(src_type[0], src_type[1], tag2_square, src_type[2]/2, endgame)
        position_change = _to_value1 - _from_value + _to_value2 - _from_value
        capture_value = 0.0
  
    # castling
    elif len(src_) == 4 and len(tag_) == 4:
        src_1, src_2 = src_[:2], src_[2:]
        tag_1, tag_2 = tag_[:2], tag_[2:]
        src1_col, src1_row = chess_square_to_rowcol(src_1)
        src2_col, src2_row = chess_square_to_rowcol(src_2)
        tag1_col, tag1_row = chess_square_to_rowcol(tag_1)
        tag2_col, tag2_row = chess_square_to_rowcol(tag_2)
        src1_type = board[src1_row][src1_col]
        src2_type = board[src2_row][src2_col]
        src1_square = chess_square_to_number(src_1)
        src2_square = chess_square_to_number(src_2)
        tag1_square = chess_square_to_number(tag_1)
        tag2_square = chess_square_to_number(tag_2)
        _from_value1 = evaluate_piece(src1_type[0], src1_type[1], src1_square, src1_type[2], endgame)
        _from_value2 = evaluate_piece(src2_type[0], src2_type[1], src2_square, src2_type[2], endgame)
        if ((src1_col < src2_col) == (tag1_col < tag2_col)):
            # src1 to tag2, src2 to tag1
            _to_value1 = evaluate_piece(src1_type[0], src1_type[1], tag2_square, src1_type[2], endgame)
            _to_value2 = evaluate_piece(src2_type[0], src2_type[1], tag1_square, src2_type[2], endgame)
        else:
            # src1 to tag1, src2 to tag2
            _to_value1 = evaluate_piece(src1_type[0], src1_type[1], tag1_square, src1_type[2], endgame)
            _to_value2 = evaluate_piece(src2_type[0], src2_type[1], tag2_square, src2_type[2], endgame)
        position_change = _to_value1 - _from_value1 + _to_value2 - _from_value2
        capture_value = 0.0

    # promotion
    elif len(src_) == 2 and len(tag_) == 3:
        tag_p = tag_[:2]
        src_col,src_row=chess_square_to_rowcol(src_)
        tag_col,tag_row=chess_square_to_rowcol(tag_p)
        src_type = board[src_row][src_col]
        tag_type = board[tag_row][tag_col]
        char2name = {'r':'ROOK', 'n':'KNIGHT', 'b':'BISHOP', 'q':'QUEEN'}
        src_square = chess_square_to_number(src_)
        tag_square = chess_square_to_number(tag_p)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)
        _to_value = evaluate_piece(char2name[tag_[2]], src_type[1], tag_square, src_type[2], endgame)
        position_change = _to_value - _from_value
        if tag_type is None:
            capture_value = 0.0
        elif is_capture_move(board, move) == 'capture':
            capture_value = evaluate_capture(board, move, False)
        elif is_capture_move(board, move) == 'En passant':
            capture_value = evaluate_capture(board, move, True)
        capture_value += 1000*round(src_type[2],2)
        # print("Promotion: "+move+" | From Value : "+str(_from_value)+" | To Value: "+str(_to_value) + " | Capture Value: "+str(capture_value))
        # print("Src Piece: "+str(src_type[0])+" | Tag Piece: "+str(char2name[tag_[2]])+ " | Src Prob: "+str(src_type[2])+ " | Src Turn: "+str(src_type[1]))

    # move, capture, en passan
    else: # len(src_) == 2 and len(tag_) == 2
        src_col,src_row=chess_square_to_rowcol(src_)
        tag_col,tag_row=chess_square_to_rowcol(tag_)
        src_type=board[src_row][src_col]
        tag_type=board[tag_row][tag_col]
        src_square=chess_square_to_number(src_)
        tag_square=chess_square_to_number(tag_)
        _from_value = evaluate_piece(src_type[0], src_type[1], src_square, src_type[2], endgame)
        _to_value = evaluate_piece(src_type[0], src_type[1], tag_square, src_type[2], endgame)
        position_change = _to_value - _from_value
        if is_capture_move(board, move) == 'capture' :
            capture_value = evaluate_capture(board, move, False)
        elif is_capture_move(board, move) == 'En passant' :
            capture_value = evaluate_capture(board, move, True)
        else:
            capture_value = 0.0

    current_move_value = capture_value + position_change
    
    return round(current_move_value, 2)

# print(move_value(pieces,'g1,c3',False))

def iterate_chessboard(chessboard):
    piece_info = []
    count = 0
    for row in chessboard:
        for cell in row:
            if cell is not None:
                piece_type, color, prob = cell
                color_str = color

                # Append the piece information to the list along with the current count
                piece_info.append({
                    'Square': count,
                    'Type': piece_type,
                    'Color': color_str,
                    'Probability': prob,
                })

            # Increment count regardless of whether the square is None or contains a piece
            count += 1

    return piece_info

def evaluate_board(board) -> float:
    """
    Evaluates the full board and determines which player is in a most favorable position.
    The sign indicates the side:
        (+) for white
        (-) for black
    The magnitude, how big of an advantage that player has
    """
    total = 0
    end_game=check_end_game(board)
    pieces_info=iterate_chessboard(board)
    for piece in pieces_info:
        piece_type =  piece['Type']
        square = piece['Square']
        color= piece['Color']
        prob = piece['Probability']
        value = (piece_value[piece_type]*prob
                 + evaluate_piece(piece_type, color, square,prob,end_game))
        total += value if color else -value

    return round(total,2)

def check_end_game(board) -> bool:
    """
    Are we in the end game?
    Per Michniewski:
    - Both sides have no queens or
    - Every side which has a queen has additionally no other pieces or one minorpiece maximum.
    """
    queens = 0
    minors = 0
    pieces_info = iterate_chessboard(board)

    for piece in pieces_info:
        piece_type = piece['Type']
        if piece_type == 'QUEEN':
            queens += 1
        if piece_type == 'BISHOP' or piece_type == 'KNIGHT':
            minors += 1

    if queens == 0 or (queens == 2 and minors <= 1):
        return True

    return False

def is_capture_move(board, move):

    def is_opponents_piece(source, target):
        """Check if the target piece belongs to the opponent."""
        return target is not None and source[1] != target[1]

        last_source_pos, last_target_pos = last_move.split(',')
        last_source_col,_ = chess_square_to_rowcol(last_source_pos)
        last_target_col, last_target_row = chess_square_to_rowcol(last_target_pos)

        # Check if the last move was a pawn moving two squares forward next to the current pawn
        if abs(last_source_col - target_col) == 1 and abs(last_target_col - target_col) == 0:
            if (source[1] and last_target_row == 3) or (
                    not source[1] and last_target_row == 4):  # Correct row for en passant
                return True
        return False

    source_pos, target_pos = move.split(',')
    source_col, source_row = chess_square_to_rowcol(source_pos)
    target_col, target_row = chess_square_to_rowcol(target_pos)

    source_piece = board[source_row][source_col]
    target_piece = board[target_row][target_col]

    if source_piece is None:
        return "Invalid move, no piece at source position."

    if source_piece[0] == 'PAWN':
        if abs(source_col - target_col) == 1 and abs(source_row - target_row) == 1:
            # Pawn capture or en passant
            if is_opponents_piece(source_piece, target_piece):
                return "capture"
            else:
                return "En passant"
        else:
            return "move"
    else:
        if is_opponents_piece(source_piece, target_piece):
            return 'capture'
        else:
            return 'move'

# game = QChessGame()
# game.run_short_cmd('a2,a4',tag_print=True, tag_step=True)
# game.run_short_cmd('c7,c5',tag_print=True, tag_step=True)
# game.run_short_cmd('b2,b4',tag_print=True, tag_step=True)
# game.run_short_cmd('d7,d5',tag_print=True, tag_step=True)
# game.run_short_cmd('c2,c4')
# game.run_short_cmd('d5,d4')
# game.run_short_cmd('h2,h3')
# game.run_short_cmd('d4,d3')
# game.run_short_cmd('g2,g3')
# game.run_short_cmd('d3,e2')
# game.run_short_cmd('h3,h4')
# game.run_short_cmd('e2,f1q')
# pieces = game.sim.get_print_board()
# print(evaluate_board(pieces))

# use game.random_move() for random move

def get_greedy_move_v0(game, split_weight = 1.0, noise = 0.5, last_moves=[]):
    to_importance = {'P':1.0, 'R':5.0, 'N':3.0, 'B':3.0, 'Q':9.0, 'K':20.0}

    moves_temp = game.get_all_available_move()
    moves = []
    moves_queen_promotion = []

    for move in moves_temp:
        if move in last_moves and len(last_moves) == 2 and last_moves[0] == last_moves[1]:
            continue
        elif move[-1] in 'RBNrbn':
            continue
        elif move[-1] in 'Qq':
            moves_queen_promotion.append(move)
        else:
            moves.append(move)

    if len(moves_queen_promotion) > 0:
        moves = moves_queen_promotion
    size = len(moves)

    ws0 = np.array([(split_weight if (len(x.split(',',1)[1])==4) else 1.0) for x in moves])

    # capture first
    ws1 = np.zeros_like(ws0)
    for idx, move in enumerate(moves):
        src_, tag_ = move.split(',')
        if len(src_) == 2 and len(tag_) == 2:
            src = game[src_]
            tag = game[tag_]
            # capture case
            if src and tag and (src[0].isupper() != tag[0].isupper()):
                importance = to_importance[tag[0].upper()]
                src_prob, tag_prob = src[1], tag[1]
                ws1[idx] = src_prob * tag_prob * importance
    # noise
    ws2 = np.random.random(size) * noise
    ws = ws0 * (ws1 + ws2 + 0.5)
    moves_ws = list(zip(moves, ws))
    moves_ws.sort(key = lambda t: t[1], reverse=True)
    picked_move = moves_ws[0][0]
    return picked_move

def softmax(x, temperature=1.0):
    """Compute the softmax of vector x with a temperature parameter."""
    e_x = np.exp((x - np.max(x)) / temperature)  # subtract max for numerical stability
    return e_x / e_x.sum(axis=0)

def get_greedy_move_v1(game, low_prob=1e-4, last_moves=[]):
    moves_temp = game.get_all_available_move()
    moves = []
    moves_low_src_prob = []

    for move in moves_temp:
        src_, tag_ = move.split(',')
        if (game[tag_[:2]] and game[tag_[:2]][0].isupper() != game[src_[:2]][0].isupper()):
            src_prob = game[src_[:2]][1] if len(src_) == 2 else game[src_[:2]][1] + game[src_[2:]][1]
            if src_prob < low_prob:
                moves_low_src_prob.append(move)

    for move in moves_temp:
        if move in moves_low_src_prob:
            continue
        elif move in last_moves and len(last_moves) == 2 and last_moves[0] == last_moves[1]:
            continue
        elif move[-1] in 'RBNrbn':
            continue
        else:
            moves.append(move)

    if len(moves) == 0:
        if len(moves_low_src_prob) == 0:
            moves = moves_temp
        else:
            moves = moves_low_src_prob

    is_white = float(game.is_white)
    board = game.sim.get_print_board()
    check_end = check_end_game(board)
    ws = np.array([(move_value(board, move, check_end)) for move in moves])
    ws = (ws)  * (is_white * 2 - 1)
    moves_ws = list(zip(moves, ws))
    moves_ws.sort(key = lambda t: t[1], reverse=True)
    picked_move = moves_ws[0][0]
    return picked_move

def get_greedy_move_v2(game, low_prob=1e-4, last_moves=[]):
    moves_temp = game.get_all_available_move()
    moves = []
    moves_low_src_prob = []

    for move in moves_temp:
        src_, tag_ = move.split(',')
        src_prob = game[src_[:2]][1] if len(src_) == 2 else game[src_[:2]][1] + game[src_[2:]][1]
        if src_prob < low_prob:
            moves_low_src_prob.append(move)
        else:
            moves.append(move)

    if len(moves) == 0:
        moves = moves_low_src_prob

    board = game.sim.get_print_board()
    check_end = check_end_game(board)
    ws = np.array([(move_value_v2(board, move, check_end)) for move in moves])
    moves_ws = list(zip(moves, ws))
    moves_ws.sort(key = lambda t: t[1], reverse=True)
    picked_move = moves_ws[0][0]
    return picked_move


def get_random_move(game, seed=None, all_move=None, split_probability_weight=1.0):
    #rng = game.rng if (seed is None) else get_rng(seed)
    if all_move is None:
        all_move = game.get_all_available_move()
    assert len(all_move) > 0, 'something must be wrong, no move available'
    prob = np.array([(split_probability_weight if (len(x.split(',',1)[1])==4) else 1) for x in all_move])
    picked_move = random.choices(all_move, prob/prob.sum())[0]
    return picked_move

def get_greedy_move(game, ver='v1', last_moves=[]):
    if ver == 'v0':
        return get_greedy_move_v0(game, last_moves=last_moves)
    elif ver == 'v1':
        return get_greedy_move_v1(game, last_moves=last_moves)
    else:
        raise ValueError("Invalid version of greedy move.")
