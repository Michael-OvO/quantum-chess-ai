import random
import numpy as np


class QChessInvalidCommand(Exception):
    pass


def int_to_bitarray(i:int, n:int):
    # (5,4)->[1,0,1,0] uint8
    tmp0 = int(i).to_bytes((n + 7) // 8, 'little')
    tmp1 = np.frombuffer(tmp0, dtype=np.uint8)
    ret = np.unpackbits(tmp1, axis=0, bitorder='little')[:n]
    return ret


hf_int_to_bitstr = lambda i,n: ''.join(('1' if ((i>>x)&1) else '0') for x in range(n))


def bitarray_to_int(b):
    ret = int.from_bytes(np.packbits(b, axis=0, bitorder='little').tobytes(), byteorder='little', signed=False)
    return ret


def get_rng(seed=None, default=None):
    '''if seed is None, and default is random.Random, then return default
    '''
    if isinstance(seed, random.Random):
        ret = seed
    elif (seed is None) and isinstance(default, random.Random):
        ret = default
    else:
        ret = random.Random(seed)
    return ret


# TODO cython
def hf_swap_str_char(x:str, i:int, j:int)->str:
    if i==j:
        ret = x
    else:
        assert (0<=i) and (i<len(x))
        assert (0<=j) and (j<len(x))
        if i>j:
            i,j = j,i
        ret = x[:i] + x[j] + x[i+1:j] + x[i] + x[j+1:]
    return ret


# TODO cython
def hf_replace_str_index(x:str, i:int, y:str)->str:
    assert (0<=i) and (i<len(x))
    ret = x[:i] + y + x[i+1:]
    return ret


# TODO cython
def hf_invert_str01(x:str, i:int)->str:
    assert (0<=i) and (i<len(x)) and (x[i] in '01')
    ret = x[:i] + ('0' if (x[i]=='1') else '1') + x[i+1:]
    return ret


# TODO cython
def hf_drop_str_char(x:str, i:int)->str:
    assert (0<=i) and (i<len(x))
    ret = x[:i] + x[i+1:]
    return ret


def hf_convert_pos_to_int(x):
    if isinstance(x, int):
        if (x<0): #ancilla qubit can be larger than 64
            raise QChessInvalidCommand(f'invalid pos="{x}"')
        return x
    elif isinstance(x, str):
        if len(x)!=2:
            raise QChessInvalidCommand(f'invalid pos="{x}"')
        x0,x1 = x
        if (x0 not in 'abcdefgh') or (x1 not in '12345678'):
            raise QChessInvalidCommand(f'invalid pos="{x}"')
        return (int(x1)-1)*8 + 'abcdefgh'.index(x0)
    else:
        raise QChessInvalidCommand(f'invalid pos="{x}"')


def hf_convert_pos_to_file_rank(x:str)->(int,int):
    assert (len(x)==2) and (x[0] in 'abcdefgh') and (x[1] in '12345678')
    return 'abcdefgh'.index(x[0]), int(x[1])-1


class ChessPosition:
    def __init__(self, *args):
        if (len(args)==1) and isinstance(args[0], str): #a8
            x0,x1 = args[0]
            if (x0 not in 'abcdefgh') or (x1 not in '12345678'):
                raise QChessInvalidCommand(f'invalid pos="{args[0]}"')
            file = 'abcdefgh'.index(x0)
            rank = int(x1)-1
            pos = file + rank*8
            str_ = args[0]
        elif (len(args)==2) and isinstance(args[0], int) and isinstance(args[1], int): #0,0
            file = int(args[0])
            rank = int(args[1])
            pos = file + rank*8
            if (not (0<=file<8)) or (not (0<=rank<8)):
                raise QChessInvalidCommand(f'invalid pos="{args}"')
            str_ = 'abcdefgh'[file] + str(rank+1)
        elif (len(args)==1) and isinstance(args[0], int):
            if args[0]<0:
                raise QChessInvalidCommand(f'invalid pos="{args[0]}"')
            pos = args[0]
            if args[0]<64:
                file = args[0]%8
                rank = args[0]//8
                str_ = 'abcdefgh'[file] + str(rank+1)
            else: #ancilla qubit can be larger than 64
                file = None
                rank = None
                str_ = None
        else:
            raise QChessInvalidCommand(f'invalid pos="{args}"')
        self.pos:int = pos
        self.file:int = file
        self.rank:int = rank
        self.str_:str = str_

    def __eq__(self, other):
        return self.pos==other.pos

    def __str__(self):
        return self.str_

    __repr__ = __str__


def hf_str_none_to_position(*args):
    ret = []
    for x in args:
        if x is None:
            ret.append(None)
        elif isinstance(x, str):
            ret.append(ChessPosition(x))
        else:
            assert isinstance(x, ChessPosition)
            ret.append(x)
    return ret

def get_two_point_path(file0, rank0, file1, rank1):
    assert all(isinstance(x,int) for x in [file0, rank0, file1, rank1])
    if (file0==file1) and (rank0==rank1):
        ret = []
    elif file0==file1:
        ret = [(file0, x) for x in range(min(rank0,rank1)+1, max(rank0,rank1))]
    elif rank0==rank1:
        ret = [(x, rank0) for x in range(min(file0,file1)+1, max(file0,file1))]
    elif abs(file0-file1)==abs(rank0-rank1):
        tmp0 = range(file0+1,file1) if (file0<file1) else range(file0-1,file1,-1)
        tmp1 = range(rank0+1,rank1) if (rank0<rank1) else range(rank0-1,rank1,-1)
        ret = list(zip(tmp0,tmp1))
    else:
        raise QChessInvalidCommand(f'invalid path file0="{file0}", rank0="{rank0}", file1="{file1}", rank1="{rank1}"')
    ret = [ChessPosition(x,y) for x,y in ret]
    return ret
