import sys
import fractions
import collections
import platform

# ANSI color codes
# https://gist.github.com/rene-d/9e584a7dd2935d0f461904b9f2950007
tmp0 = dict(
    BLACK = "\033[0;30m",
    RED = "\033[0;31m",
    GREEN = "\033[0;32m",
    BROWN = "\033[0;33m",
    BLUE = "\033[0;34m",
    PURPLE = "\033[0;35m",
    CYAN = "\033[0;36m",
    LIGHT_GRAY = "\033[0;37m",
    DARK_GRAY = "\033[1;30m",
    LIGHT_RED = "\033[1;31m",
    LIGHT_GREEN = "\033[1;32m",
    YELLOW = "\033[1;33m",
    LIGHT_BLUE = "\033[1;34m",
    LIGHT_PURPLE = "\033[1;35m",
    LIGHT_CYAN = "\033[1;36m",
    LIGHT_WHITE = "\033[1;37m",
    BOLD = "\033[1m",
    FAINT = "\033[2m",
    ITALIC = "\033[3m",
    UNDERLINE = "\033[4m",
    BLINK = "\033[5m",
    NEGATIVE = "\033[7m",
    CROSSED = "\033[9m",
    END = "\033[0m",
)
_ANSIColor = collections.namedtuple("ANSIColor", tmp0.keys())
if sys.stdout.isatty():
    ANSIColor = _ANSIColor(**tmp0)
else:
    tmp0 = {x:'' for x in tmp0.keys()}
    ANSIColor = _ANSIColor(**tmp0)
del tmp0

if platform.system() == "Windows":
    kernel32 = __import__("ctypes").windll.kernel32
    kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    del kernel32


def demo_ANSIColor():
    for key in ANSIColor._fields:
        print("{:>16} {}".format(key, getattr(ANSIColor, key) + key + ANSIColor.END))


# upper case letters: black
# lower case letters: white
# https://en.wikipedia.org/wiki/Chess_symbols_in_Unicode
CHESS_UNICODE = dict(
    k='\u2654',
    q='\u2655',
    r='\u2656',
    b='\u2657',
    n='\u2658',
    p='\u2659',
    K='\u265A',
    Q='\u265B',
    R='\u265C',
    B='\u265D',
    N='\u265E',
    P='\u265F',
)
CHESS_UNICODE[' '] = ' '

def demo_chess_unicode():
    for key in CHESS_UNICODE.keys():
        print("{:>16} {}".format(key, CHESS_UNICODE[key]))


def demo_chess_board():
    # https://stackoverflow.com/a/33206814/7290857
    BG1 = "\033[90;100m"
    BG2 = "\033[34;44m"
    END = "\033[0m"
    table = ['rnbqkbnr', 'pppppppp', '        ', '        ', '        ', '        ', 'PPPPPPPP', 'RNBQKBNR']
    for x in range(8):
        # table[x] = ''.join('{}{}{}'.format(BG1 if ((x+y)%2) else BG2, CHESS_UNICODE[z], END) for y,z in enumerate(table[x]))
        table[x] = f'{x+1} ' + ''.join('{}{}{}'.format('', CHESS_UNICODE[z], '') for y,z in enumerate(table[x]))
    print('\n'.join(table[::-1]))
    print('  abcdefgh')


if __name__ == "__main__":
    demo_ANSIColor()
    # demo_chess_unicode()
    # demo_chess_board()
