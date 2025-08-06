import os
import time
import pygame
import numpy as np
import random

from .chess_utils import QChessGame
from .ai import get_greedy_move_v0, get_greedy_move_v2, get_random_move, evaluate_board, move_value_v2

class Button:
    def __init__(self, on_color, off_color, x, y, width=50, height=20, text='A Bottum'):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.on_color = on_color
        self.off_color = off_color
        self.text = text
        self.is_on = False

    def draw(self, win, font_M, EDGE, BLACK):
        DARK = (220, 170, 120)
        color = tuple((np.array(DARK)/2).astype(int))
        pygame.draw.rect(win, color, (self.x-EDGE, self.y-EDGE, self.width+EDGE*2, self.height+EDGE*2))

        color = self.on_color if self.is_on else self.off_color
        pygame.draw.rect(win, color, (self.x, self.y, self.width, self.height))

        text_surface = font_M.render(self.text, True, BLACK)
        text_rect = text_surface.get_rect(center=(self.x+self.width/2, self.y+self.height/2))
        win.blit(text_surface, text_rect)

    def check_click_in_range(self, x, y):
        is_x_in_range = (x >= self.x) and (x <= self.x + self.width)
        is_y_in_range = (y >= self.y) and (y <= self.y + self.height)
        return is_x_in_range and is_y_in_range

class PygameGUI:
    def __init__(self, MARGIN=40, EDGE=4, SQUARE_SIZE=75, CIRCLE_WIDTH=4,
                 FONT_SIZE=16, BOTTUM_HEIGHT=20, BOTTUM_SPACE=40):
        pygame.init()
        self.seed = None
        
        self.MARGIN = MARGIN
        self.EDGE = EDGE
        self.SQUARE_SIZE = SQUARE_SIZE
        self.CIRCLE_WIDTH = CIRCLE_WIDTH
        self.FONT_SIZE = FONT_SIZE

        self.BOARD_SIZE = self.SQUARE_SIZE*8
        self.CANDIDATE_WIDTH = self.SQUARE_SIZE*6
        self.CANDIDATE_HEIGHT = self.SQUARE_SIZE*2
        self.MESSAGE_WIDTH = self.CANDIDATE_WIDTH
        self.MESSAGE_HIGHTH = self.BOARD_SIZE-self.CANDIDATE_HEIGHT-self.MARGIN
        self.HIGHTH = self.BOARD_SIZE+self.MARGIN*3
        self.WIDTH = self.BOARD_SIZE + self.CANDIDATE_WIDTH+self.MARGIN*3
        self.PIECE_SIZE = self.SQUARE_SIZE*0.50
        self.CIRCLE_SIZE = self.SQUARE_SIZE*0.72
        self.LINE_SPACING = self.FONT_SIZE + 2

        self.color = {'LIGHT': (255,250,230), 'DARK': (220,170,120), 'BLACK': (0,0,0),
                'WHITE':(255,255,255), 'MID': (237,210,175), 'DARKGRAY': (55,55,55),
                'RED': (255,0,0), 'BLUE': (100,100,250), 'LIGHTRED': (240,128,128),}

        # Set up the display
        self.win = pygame.display.set_mode((self.WIDTH, self.HIGHTH))
        self.font_L = pygame.font.SysFont('consolas', int(self.FONT_SIZE*1.3))
        self.font_M = pygame.font.SysFont('consolas', self.FONT_SIZE)

        self.game = QChessGame()
        self.piece_names = ['PAWN', 'ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING']
        self.pieces = self.game.sim.get_print_board()
        self.candidates = [[(name, is_white, 1.0) for name in self.piece_names] for is_white in [True, False]]
        self.selected = {'src': [], 'tag': []}
        self.text_messages = []
        self.top_line = 0

        # mode

        self.name_color_to_img = {}
        hf0 = lambda *x: os.path.join(os.path.dirname(__file__), 'pictures', *x)
        for idx, name in enumerate(self.piece_names):
            self.name_color_to_img[(name,True)] = pygame.transform.scale(pygame.
                    image. load(hf0(name+'_WHITE.png')), (self.PIECE_SIZE, self.PIECE_SIZE))
            self.name_color_to_img[(name,False)] = pygame.transform.scale(pygame.
                    image. load(hf0(name+'_BLACK.png')), (self.PIECE_SIZE, self.PIECE_SIZE))

        self.button = {}
        self.button_names = ['Restart', 'Move m?', 'Move m1', 'Move m0', 'Undo', 'Empty', 'Add', 'Remove']
        BOTTUM_WIDTH = (self.WIDTH - (len(self.button_names) - 1)*BOTTUM_SPACE - self.MARGIN*2) / len(self.button_names)
        for idx, name in enumerate(self.button_names):
            self.button[name] = Button(on_color=self.color['LIGHT'], off_color=self.color['DARK'],
                                       x=self.MARGIN+idx*(BOTTUM_WIDTH+BOTTUM_SPACE),
                                       y=self.MARGIN-BOTTUM_HEIGHT/2,
                                       width=BOTTUM_WIDTH, height=BOTTUM_HEIGHT, text=name)

        self.click_pos = None
        self.white_is_ai, self.black_is_ai = False, False
        self.is_end = False
        self.history = []

    def transfer_row_col(self, row, col):
        r = (7-row)*self.SQUARE_SIZE + self.MARGIN*2
        c = col * self.SQUARE_SIZE + self.MARGIN
        return r, c

    def draw_buttons(self,):
        for name in self.button_names:
            self.button[name].draw(self.win, self.font_M, self.EDGE, self.color['BLACK'])

    def draw_board(self,):
        alpha = 0.5
        color = tuple((alpha*np.array(self.color['LIGHT'])
                       + (1-alpha)*np.array(self.color['WHITE'])).astype(int))
        self.win.fill(color)

        alpha = 0.5
        color = tuple((alpha*np.array(self.color['DARK']) + (1-alpha)*np.array(self.color['BLACK'])).astype(int))
        pygame.draw.rect(self.win, color, (self.MARGIN-self.EDGE, self.MARGIN*2-self.EDGE,
                          self.BOARD_SIZE+self.EDGE*2, self.BOARD_SIZE+self.EDGE*2))

        for row in range(8):
            for col in range(8):
                r, c = self.transfer_row_col(row, col)
                if (row % 2 == 0 and col % 2 == 0) or (row % 2 == 1 and col % 2 == 1):
                    pygame.draw.rect(self.win, self.color['DARK'], (c, r, self.SQUARE_SIZE, self.SQUARE_SIZE))
                else:
                    pygame.draw.rect(self.win, self.color['LIGHT'], (c, r, self.SQUARE_SIZE, self.SQUARE_SIZE))

        for row in range(8):
            r, _ = self.transfer_row_col(row, 0)
            text_surface = self.font_L.render(str(row+1), True, self.color['BLACK'])
            text_rect = text_surface.get_rect(center=(self.MARGIN/2-self.EDGE/2, r+self.SQUARE_SIZE/2))
            self.win.blit(text_surface, text_rect)

        for col in range(8):
            _, c = self.transfer_row_col(0, col)
            text_surface = self.font_L.render(chr(col+97), True, self.color['BLACK'])
            text_rect = text_surface.get_rect(center=(c+self.SQUARE_SIZE/2, self.HIGHTH-self.MARGIN/2+self.EDGE/2))
            self.win.blit(text_surface, text_rect)

    def draw_pieces(self,):
        for row in range(8):
            for col in range(8):
                piece = self.pieces[row][col]
                r, c = self.transfer_row_col(row, col)
                if piece:
                    name, is_white, p = piece
                    img = self.name_color_to_img[(name, is_white)]
                    pygame.draw.circle(self.win, self.color['MID'], (c+self.SQUARE_SIZE/2, r+self.SQUARE_SIZE/2), self.CIRCLE_SIZE*0.55)
                    start_angle = np.pi / 2
                    end_angle = start_angle+p * 2 * np.pi
                    rect = pygame.Rect(c+(self.SQUARE_SIZE - self.CIRCLE_SIZE)*0.5, r+(self.SQUARE_SIZE - self.CIRCLE_SIZE)*0.5, self.CIRCLE_SIZE, self.CIRCLE_SIZE)
                    pygame.draw.arc(self.win, self.color['DARKGRAY'], rect, start_angle, end_angle, self.CIRCLE_WIDTH)
                    self.win.blit(img, (c+(self.SQUARE_SIZE - self.PIECE_SIZE)*0.5, r+(self.SQUARE_SIZE - self.PIECE_SIZE)*0.5))

    def draw_candidates(self,):
        alpha = 0.5
        color = tuple((alpha*np.array(self.color['DARK']) + (1-alpha)*np.array(self.color['BLACK'])).astype(int))
        pygame.draw.rect(self.win, color,
                         (self.MARGIN*2+self.BOARD_SIZE-self.EDGE,
                          self.MARGIN*3+self.MESSAGE_HIGHTH-self.EDGE,
                          self.CANDIDATE_WIDTH+self.EDGE*2,
                          self.CANDIDATE_HEIGHT+self.EDGE*2))

        for row in range(2):
            for col in range(6):
                r, c = self.transfer_row_col(row, col)
                c += self.BOARD_SIZE + self.MARGIN
                if (row % 2 == 0 and col % 2 == 0) or (row % 2 == 1 and col % 2 == 1):
                    pygame.draw.rect(self.win, self.color['DARK'], (c, r, self.SQUARE_SIZE, self.SQUARE_SIZE))
                else:
                    pygame.draw.rect(self.win, self.color['LIGHT'], (c, r, self.SQUARE_SIZE, self.SQUARE_SIZE))

        for row in range(2):
            for col in range(6):
                piece = self.candidates[row][col]
                r, c = self.transfer_row_col(row, col)
                c += self.BOARD_SIZE + self.MARGIN
                if piece:
                    name, is_white, p = piece
                    img = self.name_color_to_img[(name, is_white)]
                    pygame.draw.circle(self.win, self.color['MID'], (c + self.SQUARE_SIZE * 0.5, r + self.SQUARE_SIZE * 0.5), self.CIRCLE_SIZE * 0.55)
                    start_angle = np.pi / 2
                    end_angle = start_angle + p * 2 * np.pi
                    rect = pygame.Rect(c + (self.SQUARE_SIZE - self.CIRCLE_SIZE)*0.5, r + (self.SQUARE_SIZE - self.CIRCLE_SIZE)*0.5, self.CIRCLE_SIZE, self.CIRCLE_SIZE)
                    pygame.draw.arc(self.win, self.color['DARKGRAY'], rect, start_angle, end_angle, self.CIRCLE_WIDTH)
                    self.win.blit(img, (c + (self.SQUARE_SIZE - self.PIECE_SIZE)*0.5, r + (self.SQUARE_SIZE - self.PIECE_SIZE)*0.5))

    def draw_rectangles(self, postions, color):
        for (row, col) in postions:
            r, c = self.transfer_row_col(row, col)
            if col >= 8:
                c = c + self.MARGIN
            pygame.draw.rect(self.win, color, (c, r, self.SQUARE_SIZE, self.SQUARE_SIZE), 4)

    def draw_messages(self,):
        alpha, w = 0.5, 4
        x, y = self.MARGIN*2+self.BOARD_SIZE, self.MARGIN*2
        color = tuple((alpha*np.array(self.color['DARK']) + (1-alpha)*np.array(self.color['BLACK'])).astype(int))
        pygame.draw.rect(self.win, color, (x-w, y-w, self.MESSAGE_WIDTH+2*w, self.MESSAGE_HIGHTH+2*w))
        pygame.draw.rect(self.win, self.color['BLACK'], (x, y, self.MESSAGE_WIDTH, self.MESSAGE_HIGHTH))

        for i, line in enumerate(self.text_messages[self.top_line : self.top_line + self.MESSAGE_HIGHTH // self.LINE_SPACING]):
            for j, (chara, color) in enumerate(line):
                surface = self.font_M.render(chara, True, color)
                self.win.blit(surface, (x+j*self.FONT_SIZE*0.5, y+i*self.LINE_SPACING))

    def state_to_text(self, state):
        if state == 'continue':
            player = "White" if self.game.is_white else "Black"
            text = "Current Player: "+player
        elif state == 'black':
            text = 'Game Ends: Black Wins'
        elif state == 'white':
            text = 'Game Ends: White Wins'
        else:
            text = 'Game Ends: Draw'
        return text

    def insert_and(self, sss):
        if len(sss) == 4:
            return sss[:2] + ' & ' + sss[2:4]
        elif len(sss) == 2:
            return sss
        else:
            return '??'

    def get_piece_name(self, xxx):
        if len(xxx) == 2:
            col, row = ord(xxx[0]) - 97, int(xxx[1]) - 1
            if not (col <= 7 and row <= 7 and row >= 0 and col >= 0):
                return '??'
            return '  ' if self.pieces[row][col] is None else self.pieces[row][col][0]
        elif len(xxx) == 4:
            col, row = ord(xxx[0]) - 97, int(xxx[1]) - 1
            if not (col <= 7 and row <= 7 and row >= 0 and col >= 0):
                return '??'
            name1 = '  ' if self.pieces[row][col] is None else self.pieces[row][col][0]
            col, row = ord(xxx[2]) - 97, int(xxx[3]) - 1
            if not (col <= 7 and row <= 7 and row >= 0 and col >= 0):
                return '??'
            name2 = '  ' if self.pieces[row][col] is None else self.pieces[row][col][0]
            if name1 == name2:
                return name1
            elif (name1 == 'ROOK' and name2 == 'KING') or (name2 == 'ROOK' and name1 == 'KING'):
                return 'CASTLING'
            else:
                return '??'
        else:
            return '??'

    def message_to_bottum(self,):
        self.top_line = len(self.text_messages) - (self.MESSAGE_HIGHTH // self.LINE_SPACING)

    def append_unicolor_line(self, text, color=None, to_bottum=True, need_print=True):
        if need_print:
            print(text)
        if color is None:
            color = self.color['WHITE']
        line = [(t, color) for t in text]
        self.text_messages.append(line)
        if to_bottum:
            self.message_to_bottum()

    def append_next_step_num(self, color=None):
        if color is None:
            color = self.color['WHITE']
        self.append_unicolor_line(' ', to_bottum=False)
        text = '-'*15 + (' '+str(self.game.current_step+1)+' ').rjust(7,'-') + '-'*15
        self.append_unicolor_line(text, to_bottum=False)

    def append_move_info(self, mov):
        alist = mov.split(',')
        src, tag = alist[0], alist[1]
        if len(tag) == 3 and len(src) == 2:
            to_name = {'P':'PAWN', 'R':'ROOK', 'N':'KNIGHT', 'B':'BISHOP', 'Q':'QUEEN', 'K':'KING'}
            promote = to_name[tag[2].upper()]
            tag = tag[:2]
            src_name, tag_name = self.get_piece_name(src), self.get_piece_name(tag)
            self.append_unicolor_line('Move: ['+src_name+'] '+src+' -> ['+tag_name+'] ' +tag + ' (Promote to '+promote+')')
        else:
            src_name, tag_name = self.get_piece_name(src), self.get_piece_name(tag)
            src, tag = self.insert_and(src), self.insert_and(tag)
            self.append_unicolor_line('Move: ['+src_name+'] '+src+' -> ['+tag_name+'] ' +tag)

    def append_move_valid_n_measure(self, mov, need_append=True):
        self.append_unicolor_line('The move is valid.')
        lm = self.game.sim.last_measure
        if lm is None:
            self.history.append(mov)
            lm = 'No measurement required'
        else:
            lm = str(lm)
            if need_append:
                self.history.append(mov+','+lm)
        self.append_unicolor_line('Measure: '+lm)
    

    def append_whole_board(self, to_bottum=True):
        to_char = {'PAWN':'P', 'ROOK':'R', 'KNIGHT':'N', 'BISHOP':'B', 'QUEEN':'Q', 'KING':'K'}
        self.append_unicolor_line('Board: ', to_bottum=to_bottum, need_print=False)
        self.append_unicolor_line(' '*3+'-'*(6*8), to_bottum=to_bottum, need_print=False)
        W, B = self.color['WHITE'], self.color['BLUE']

        for row in range(7,-1,-1):
            pieces_row = self.pieces[row]
            line = [(' ', W), (str(row+1), W), ('|', W)]
            for col, piece in enumerate(pieces_row):
                if piece:
                    (name, is_white, p) = piece
                    p = np.round(p, 3)
                    color = W if is_white else B
                    line.append((to_char[name], color))
                    if np.isclose(p, 1.0, atol=1e-4):
                        for _ in range(4):
                            line.append((' ', color))
                    else:
                        dig = str(p).split('.')[1]
                        line.append(('.', color))
                        for d in dig:
                            line.append((d, color))
                        if len(dig) < 3:
                            for _ in range(3-len(dig)):
                                line.append((' ', color))
                else:
                    line = line + [(' ', W) for _ in range(5)]
                line.append(('|', W))
            self.text_messages.append(line)

        self.append_unicolor_line(' '*3+'-'*(6*8), to_bottum=to_bottum, need_print=False)
        line = ([(' ', W) for _ in range(2)] + [('|', W)])
        for col in range(8):
            line.append((chr(col+97), W))
            line = line + [(' ', W) for _ in range(4)]
            line.append((('|', W)))
        self.text_messages.append(line)
        self.append_unicolor_line('Qubit Number: %d' % len(self.game.sim.pos2tag), to_bottum=to_bottum)
        self.append_unicolor_line('Coeff Number: %d' % len(self.game.sim.coeff), to_bottum=to_bottum)

        value = evaluate_board(self.game.sim.get_print_board())
        self.append_unicolor_line('Value for White: %.2f' % value, to_bottum=to_bottum)

    def is_click_inside_board(self, x, y):
        is_x_in_range = (x >= self.MARGIN) and (x <= self.MARGIN + self.BOARD_SIZE)
        is_y_in_range = (y >= self.MARGIN*2) and (y <= self.MARGIN*2 + self.BOARD_SIZE)
        return is_x_in_range and is_y_in_range

    def is_click_inside_candidate(self, x, y):
        is_x_in_range = ((x >= 2*self.MARGIN+self.BOARD_SIZE)
                         and (x <= 2*self.MARGIN+self.BOARD_SIZE+self.CANDIDATE_WIDTH))
        is_y_in_range = ((y >= self.MARGIN*3+self.MESSAGE_HIGHTH)
                         and (y <= self.MARGIN*3+self.MESSAGE_HIGHTH+self.CANDIDATE_HEIGHT))
        return is_x_in_range and is_y_in_range

    def from_selected_get_mov(self,):
        promote = ''
        src = ''
        for (row, col) in self.selected['src']:
            if col < 8:
                src += chr(col+97) + str(row+1)
            else:
                col_to_piece = {8:'P', 9:'R', 10:'N', 11:'B', 12:'Q', 13:'K'}
                piece_name = col_to_piece[col]
                piece_name = piece_name.lower()
                promote = piece_name
        tag = ''
        for (row, col) in self.selected['tag']:
            tag += chr(col+97) + str(row+1)

        mov = src+','+tag+promote
        return mov

    def from_mov_update_selected(self, mov):
        alist = mov.split(',')
        print('alist: '+str(alist))
        for idx, name in enumerate(['src', 'tag']):
            xxx = alist[idx]
            if len(xxx) == 2:
                col, row = ord(xxx[0]) - 97, int(xxx[1]) - 1
                self.selected[name] = [(row, col)]
            elif len(xxx) == 4:
                col1, row1 = ord(xxx[0]) - 97, int(xxx[1]) - 1
                col2, row2 = ord(xxx[2]) - 97, int(xxx[3]) - 1
                self.selected[name] = [(row1, col1), (row2, col2)]
            elif len(xxx) == 3 and name == 'tag':
                (row0, col0) = self.selected['src'][0]
                t = self.pieces[row0][col0]
                if t is not None:
                    piece_name, is_white, _ = t
                    if piece_name == 'PAWN':
                        col1, row1 = ord(xxx[0]) - 97, int(xxx[1]) - 1
                        piece_to_col = {'P':8, 'R':9, 'N':10, 'B':11, 'Q':12, 'K':13}
                        col2 = piece_to_col[xxx[2].upper()]
                        row2 = 0 if is_white else 1
                        self.selected['tag'] = [(row1, col1)]
                        self.selected['src'].append((row2, col2))
    
    def update_selected(self, x, y, name):
        # chcek whether is selected
        col = int((x - self.MARGIN) // self.SQUARE_SIZE)
        row = 7 - int((y - self.MARGIN*2) // self.SQUARE_SIZE)

        if name == 'src' and (row, col) in self.selected['tag']:
            self.selected['tag'].remove((row, col))
        elif name == 'tag' and (row, col) in self.selected['src']:
            self.selected['src'].remove((row, col))

        if (row, col) in self.selected[name]:
            self.selected[name].remove((row, col))
        else:
            self.selected[name].append((row, col))

    def move(self, mov, note):
        self.append_next_step_num()
        is_end = False

        state = self.game.is_finish_or_not()
        text = self.state_to_text(state)
        if state == 'continue':
            self.append_unicolor_line(text + ' ('+note+')')
            self.append_move_info(mov)

        valids = self.game.get_all_available_move()
        alist = mov.split(',')
        mov_not_measured = alist[0]+','+alist[1]
        if mov_not_measured in valids and state == 'continue':
            print('mov: '+mov)
            print('mov_not_measured: '+mov_not_measured)
            move_value = move_value_v2(self.pieces, mov_not_measured, False)
            try:
                self.game.run_short_cmd(mov)
            except:
                print("Error!")
                print(self.history)
            self.append_move_valid_n_measure(mov_not_measured)
            self.append_unicolor_line('Move Value: %.2f' % move_value)            
            self.pieces = self.game.sim.get_print_board()
            self.append_whole_board()
            print('History: '+str(self.history))
        else:
            self.append_unicolor_line('The move is invalid.')
            self.append_unicolor_line('Please try again!')
            print('mov: '+mov)
            print('mov_not_measured: '+mov_not_measured)
            print('seed: '+str(self.seed))
            #raise ValueError('Invalid Move!')

        self.selected['src'], self.selected['tag'] = [], []

        state = self.game.is_finish_or_not()
        text = self.state_to_text(state)
        if state != 'continue':
            is_end = True
            self.append_unicolor_line(text+', please restart')
        return is_end

    def restart(self,):
        self.game = QChessGame()
        self.history = []
        self.pieces = self.game.sim.get_print_board()
        self.selected['src'], self.selected['tag'] = [], []
        self.append_unicolor_line(' '*37, to_bottum=False)
        self.append_unicolor_line(' '*37, to_bottum=False)
        self.append_unicolor_line(' '*37, to_bottum=False)
        self.append_unicolor_line('-'*37, to_bottum=False)
        self.append_unicolor_line('Game restarts...', to_bottum=False)
        self.append_unicolor_line('Click left mouse button to select scource', to_bottum=False)
        self.append_unicolor_line('Click right mouse button to select target', to_bottum=False)
        self.append_unicolor_line('Click middle mouse button to comfirm move', to_bottum=False)
        self.append_unicolor_line(' ',to_bottum=False)
        self.append_whole_board(to_bottum=True)
        return False

    def check_type(self, mov):
        if 'empty' in mov:
            return 'empty'
        elif 'add' in mov:
            return 'add'
        elif 'remove' in mov:
            return 'remove'
        else:
            return 'move'

    def undo(self,):
        if len(self.history) > 0:
            self.game = QChessGame()
            self.selected['src'], self.selected['tag'] = [], []

            if (int(self.black_is_ai) + int(self.white_is_ai)) % 2 == 0:
                history_len =  len(self.history) - 1
            elif len(self.history) > 1:
                history_len =  len(self.history) - 2
            else:
                history_len =  len(self.history) - 1

            self.append_unicolor_line(' '*37, to_bottum=False)
            text = '-'*8 + (' Undo - Back to Last Step').rjust(7,'-') + '-'*8
            self.append_unicolor_line(text, to_bottum=False)
            new_history = []

            for idx in range(history_len):
                mov = self.history[idx]
                new_history.append(mov)

                if 'empty' in mov:
                    if idx == (history_len - 1):
                        self.pieces = self.game.sim.get_print_board()
                        self.append_unicolor_line('Empty the board', to_bottum=False)
                    self.game.add_piece('a1','R',reset=True)
                    self.game.sim.remove_piece(0)
                elif 'remove' in mov:
                    pos_str = mov.split(',')[1]
                    col = ord(pos_str[0]) - 97
                    row = int(pos_str[1]) - 1
                    pos = (col) + 8*(row)
                    if idx == (history_len - 1):
                        self.pieces = self.game.sim.get_print_board()
                        self.append_unicolor_line('Remove a piece from '+pos_str, to_bottum=False)
                    self.game.sim.remove_piece(pos)
                elif 'add' in mov:
                    alist = mov.split(',')
                    piece = alist[1]
                    pos_str = alist[2]
                    if idx == (history_len - 1):
                        self.pieces = self.game.sim.get_print_board()
                        self.append_unicolor_line('Add a piece '+piece+' to '+pos_str, to_bottum=False)
                    self.game.add_piece(pos_str, piece)
                else:
                    if idx == (history_len - 1):
                        self.pieces = self.game.sim.get_print_board()
                        self.append_move_info(mov)
                    self.game.run_short_cmd(mov, tag_print=(idx == (history_len - 1)))
                    if idx == (history_len - 1):
                        self.append_move_valid_n_measure(mov, need_append=False)

            self.pieces = self.game.sim.get_print_board()
            self.append_whole_board()
            self.history = new_history
        return False

    def remove(self,):
        if len(self.selected['tag']) > 0:
            print("Tag should be empty!")
            self.selected['tag'] = []
        elif len(self.selected['src']) > 0:
            self.append_unicolor_line(' '*37, to_bottum=False)
            self.append_next_step_num()
            for (row, col) in self.selected['src']:
                pos = (col) + 8*(row)
                self.game.sim.remove_piece(pos)
                pos_str = chr(col+97) + str(row+1)
                print("Remove "+pos_str)
                self.history.append('remove,'+pos_str)
                self.append_unicolor_line('Remove a piece from '+pos_str, to_bottum=False)
            self.selected['src'] = []
            self.pieces = self.game.sim.get_print_board()
            self.append_whole_board()
        else:
            print("No piece is selected!")
        return False

    def empty(self,):
        self.game = QChessGame()
        self.game.add_piece('a1','R',reset=True)
        self.game.sim.remove_piece(0)
        self.history.append('empty')
        self.append_unicolor_line(' '*37, to_bottum=False)
        self.append_next_step_num()
        self.append_unicolor_line('Empty the board', to_bottum=False)
        self.pieces = self.game.sim.get_print_board()
        self.append_whole_board()
        return False

    def add(self,):
        col_to_piece = {8:'P', 9:'R', 10:'N', 11:'B', 12:'Q', 13:'K'}
        if len(self.selected['src']) == 1 and len(self.selected['tag']) == 1:
            (row, col) = self.selected['tag'][0]
            pos_str = chr(col+97) + str(row+1)
            (row, col) = self.selected['src'][0]
            if row <= 1 and col >= 8:
                piece = col_to_piece[col]
                if row == 1:
                    piece = piece.lower()
                self.game.add_piece(pos_str, piece)
                self.history.append('add,'+piece+','+pos_str)
                self.append_unicolor_line(' '*37, to_bottum=False)
                self.append_next_step_num()
                self.append_unicolor_line('Add a piece '+piece+' to '+pos_str, to_bottum=False)
                self.pieces = self.game.sim.get_print_board()
                self.append_whole_board()
                self.selected['src'], self.selected['tag'] = [], []
        else:
            print("Please select one piece and one target position!")
        return False


    def run(self, **kwargs):
        default_args = dict(split_weight=1.0, history=None, replay_delay=1.0, ai_delay=1.0, seed=None)            
        assert 'mode' in kwargs
        for key in default_args:
            if key not in kwargs:
                kwargs[key] = default_args[key]
        # kwargs
        tmp0 = {'pvp':(False, False), 'pvc':(False, True), 'cvp':(True, False), 'cvc':(True, True)}
        self.white_is_ai, self.black_is_ai = tmp0[kwargs['mode']]

        # click left mouse button to select; click right mouse button to comfirm
        clock = pygame.time.Clock()
        self.append_unicolor_line('Game starts ...',to_bottum=False)
        self.append_unicolor_line('Click left mouse button to select scource',to_bottum=False)
        self.append_unicolor_line('Click right mouse button to select target',to_bottum=False)
        self.append_unicolor_line('Click middle mouse button to comfirm move',to_bottum=False)
        self.append_unicolor_line(' ',to_bottum=False)
        self.append_whole_board(to_bottum=False)
        run, self.is_end = True, False
        history_replayed = len(self.history) == len(kwargs['history'])
        self.seed = kwargs['seed']
        if self.seed is not None:
            random.seed(self.seed)
            np.random.seed(self.seed)
        else:
            self.seed = random.randint(0, 100000)
            random.seed(self.seed)
            np.random.seed(self.seed)

        while run:

            clock.tick(30)
            current_player_is_ai = ((self.game.is_white and self.white_is_ai)
                                    or ((not self.game.is_white) and self.black_is_ai))

            # replay first
            if not history_replayed and not self.is_end:
                if kwargs['replay_delay'] and len(kwargs['history'])> 0:
                    time.sleep(kwargs['replay_delay'])
                    current_len = len(self.history)
                    mov = kwargs['history'][current_len]
                    if len(self.selected['src']) == 0:
                        self.from_mov_update_selected(mov)
                    else:
                        print(str(current_len)+' -- '+mov)
                        self.is_end = self.move(note='replay',
                                                mov=mov)
                else:
                    while len(self.history) < len(kwargs['history']):
                        mov = kwargs['history'][len(self.history)]
                        self.is_end = self.move(note='replay', mov=mov)
                history_replayed = len(self.history) == len(kwargs['history'])

            # ai move
            elif current_player_is_ai and not self.is_end:
                time.sleep(kwargs['ai_delay'])
                if len(self.selected['src']) == 0:
                    rn = random.random()
                    if rn < 0.0:
                        mov = get_greedy_move_v0(self.game)
                    elif rn < 0.33:
                        mov = get_greedy_move_v2(self.game)
                    else:
                        mov = get_random_move(self.game, split_probability_weight=1.0)
                    print('\nAI move: '+mov)
                    self.from_mov_update_selected(mov)
                else:
                    self.is_end = self.move(note='by computer', mov=self.from_selected_get_mov())

            # human move
            else:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        run = False

                    # click down
                    elif event.type == pygame.MOUSEBUTTONDOWN:
                        pos = pygame.mouse.get_pos()
                        x, y = pos[0], pos[1]

                        # right click
                        if event.button == pygame.BUTTON_RIGHT:
                            if self.is_click_inside_board(x, y):
                                self.update_selected(x, y, 'tag')
                        # left click
                        elif event.button == pygame.BUTTON_LEFT:
                            self.click_pos = (x, y)
                            # check click button
                            for name in self.button_names:
                                is_click_button = self.button[name].check_click_in_range(x,y)
                                if is_click_button:
                                    self.button[name].is_on = True
                                    break

                            if not is_click_button:
                                if self.is_click_inside_board(x, y):
                                    self.update_selected(x, y, 'src')
                                elif self.is_click_inside_candidate(x, y):
                                    self.update_selected(x-self.MARGIN, y, 'src')
                        # mid click
                        elif event.button == pygame.BUTTON_MIDDLE:
                            self.is_end = self.move(note='by human', mov=self.from_selected_get_mov())
                        # scrol
                        elif event.button == 4:  # Mouse wheel up
                            self.top_line = max(self.top_line - 1, 0)
                        elif event.button == 5:  # Mouse wheel down
                            self.top_line = min(self.top_line + 1,
                                                len(self.text_messages) - (self.MESSAGE_HIGHTH // self.LINE_SPACING))

                    # release
                    elif event.type == pygame.MOUSEBUTTONUP:
                        if event.button == pygame.BUTTON_LEFT:
                            if self.click_pos:
                                x, y = self.click_pos
                                for name in self.button_names:
                                    is_click_button = self.button[name].check_click_in_range(x,y)
                                    if is_click_button:
                                        if name == 'Move m?':
                                            self.is_end = self.move(note='by human',
                                            mov=self.from_selected_get_mov())
                                        elif name == 'Move m1':
                                            self.is_end = self.move(note='by human',
                                            mov=self.from_selected_get_mov()+',1')
                                        elif name == 'Move m0':
                                            self.is_end = self.move(note='by human',
                                            mov=self.from_selected_get_mov()+',0')
                                        elif name == 'Restart':
                                            self.is_end = self.restart()
                                        elif name == 'Undo':
                                            self.is_end = self.undo()
                                        elif name == 'Remove':
                                            self.is_end = self.remove()
                                        elif name == 'Empty':
                                            self.is_end = self.empty()
                                        elif name == 'Add':
                                            self.is_end = self.add()

                                        self.button[name].is_on = False
                                        break
                                self.click_pos = None

            self.draw_board()
            self.draw_pieces()
            self.draw_messages()
            self.draw_candidates()
            self.draw_buttons()
            self.draw_rectangles(self.selected['src'], self.color['RED'])
            self.draw_rectangles(self.selected['tag'], self.color['LIGHTRED'])
            pygame.display.update()
    
        pygame.quit()
