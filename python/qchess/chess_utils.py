import time
import numpy as np

from .utils import (bitarray_to_int, hf_int_to_bitstr, get_rng, hf_swap_str_char, hf_invert_str01, hf_drop_str_char,
            QChessInvalidCommand, hf_convert_pos_to_int, ChessPosition, hf_str_none_to_position)

_ZERO_EPS = 1e-12
_DISCLAIMER = '''# Heads up!

Hey there! Thanks for using this software. Just a friendly reminder that this is a free tool and it's provided 'as-is'. We've done our best to make it great, but it's not perfect. There might be a few bugs here and there.

So, please don't rely on it for mission-critical tasks or anything where a software glitch could cause problems. And if you do find any bugs or issues, we'd love to hear about them so we can make the tool even better.

Thanks and happy coding!'''
_GLOBAL_CONFIG = {'print_disclaimer':False}

class QChessSparseSimulator:
    def __init__(self, state0:int=0xFFFF00000000FFFF, tag_list='RNBQKBNRPPPPPPPPpppppppprnbqkbnr', seed=None):
        assert (0<=state0) and (state0<2**64)
        basis0 = hf_int_to_bitstr(state0, 64)
        assert len(tag_list)==sum(x=='1' for x in basis0)
        tmp0 = [x for x,y in enumerate(basis0) if y=='1']
        self.pos2tag = [None]*64
        for x0,x1 in zip(tmp0, tag_list):
            self.pos2tag[x0] = x1
        self.coeff = {basis0:1} #1101 -> 1+0j
        # coeff dict[str, complex]
        self.rng = get_rng(seed)

        tag_to_print_tag = {None:'\u00B7'} #https://www.compart.com/en/unicode/U+00B7 middle dot
        hf0 = lambda x: (x if x.isupper() else f'\033[94m{x.upper()}\033[0m')
        for x in tag_list:
            tag_to_print_tag[x] = hf0(x[0])
        self.tag_to_print_tag = tag_to_print_tag
        self.last_measure = None
        self.last_measure1_prob = None
        self._cache_probability = dict()

    def _clone_from_sim(self, sim1):
        self.pos2tag = list(sim1.pos2tag)
        self.rng.setstate(sim1.rng.getstate())
        self.coeff = dict(sim1.coeff)
        self.last_measure = sim1.last_measure
        self.last_measure1_prob = sim1.last_measure1_prob
        self._cache_probability = dict(sim1._cache_probability)

    @staticmethod
    def from_board(pos_list):
        # [(a1,K), (b1,Q), (c3,k), ...)]
        if isinstance(pos_list, str):
            pos_list = pos_list.split(' ')
            assert all(len(x)==3 for x in pos_list)
            pos_list = [(x[:2], x[2]) for x in pos_list]
        assert (len(pos_list)>=1) and all(len(x)==2 for x in pos_list)
        assert all((len(x)==2) and (x[0] in 'abcdefgh') and x[1] in '12345678' for x,_ in pos_list)
        assert len(pos_list)==len({x for x,_ in pos_list})
        assert {x for _,x in pos_list} <= set('RNBQKPrnbqkp')
        tag_list = [x[1] for x in pos_list]
        tmp0 = [0]*64
        for x,_ in pos_list:
            tmp0[hf_convert_pos_to_int(x)] = 1
        state0 = bitarray_to_int(tmp0)
        ret = QChessSparseSimulator(state0, tag_list)
        return ret

    def _get_probability_i(self, index:int):
        if index in self._cache_probability:
            ret = self._cache_probability[index]
        else:
            assert (0<=index) and (index<len(self.pos2tag))
            if self.pos2tag[index] is None:
                ret = 0
            else:
                ret = sum(v.real*v.real+v.imag*v.imag for k,v in self.coeff.items() if k[index]=='1')
            self._cache_probability[index] = ret
        return ret

    def get_marginal_probability(self, index=None):
        if index is not None:
            return self._get_probability_i(index)
        else:
            tag_list = [self.pos2tag[x] for x in range(64)]
            prob_list = [self._get_probability_i(x) for x in range(64)]
            return tag_list,prob_list

    def apply_sqrtiswap(self, src:int, dst:int, control=None, negate_control=None, tag_inverse=False):
        assert src!=dst
        if control is not None:
            if not hasattr(control, '__len__'):
                control = [int(control)]
            tmp0 = set(int(x) for x in control)
            assert (len(control)==len(tmp0)) and (src not in tmp0) and (dst not in tmp0)
            control = tmp0
        if negate_control is not None:
            if not hasattr(negate_control, '__len__'):
                negate_control = [int(negate_control)]
            tmp0 = {int(x) for x in negate_control}
            assert (len(tmp0)==len(negate_control)) and (src not in tmp0) and (dst not in tmp0)
            negate_control = tmp0
            # if control is not None:
            #     assert len(control & negate_control)==0
        x0 = self.pos2tag[src]
        x2 = self.pos2tag[dst]
        assert ((x0 is None) and (x2 is not None)) or ((x0 is not None) and (x2 is None)) or ((x0==x2) and (x0 is not None))
        tag = x0 if (x0 is not None) else x2
        index_list = {k for k in self.coeff.keys() if (k[src]+k[dst] in ('10','01','11'))}
        self._cache_probability.clear()
        coeff_old = dict()
        for x in index_list:
            coeff_old[x] = self.coeff.pop(x)
        src_index_list = set()
        dst_index_list = set()
        for k0,v0 in coeff_old.items():
            k1 = k0[src]+k0[dst]
            if ((k1=='11') or ((control is not None) and any(k0[x]!='0' for x in control))
                    or ((negate_control is not None) and all(k0[x]=='0' for x in negate_control))):
                # nothing change
                self.coeff[k0] = v0
                if k1[0]=='1':
                    src_index_list.add(k0)
                if k1[1]=='1':
                    dst_index_list.add(k0)
                continue
            # k1 in ['01','10']
            if k0 in self.coeff:
                tmp0 = self.coeff[k0] + v0/np.sqrt(2)
                if tmp0.real**2 + tmp0.imag**2 < _ZERO_EPS:
                    # for x2 in other_pos_list:
                    #     x2.discard(k0)
                    src_index_list.discard(k0)
                    dst_index_list.discard(k0)
                    self.coeff.pop(k0)
                else:
                    self.coeff[k0] = tmp0
            else:
                if k1[0]=='1':
                    src_index_list.add(k0)
                else:
                    dst_index_list.add(k0)
                self.coeff[k0] = v0/np.sqrt(2)

            k2 = hf_swap_str_char(k0, src, dst)
            if k2 in self.coeff:
                tmp0 = self.coeff[k2] + ((-v0*1j) if tag_inverse else (v0*1j))/np.sqrt(2)
                if tmp0.real**2 + tmp0.imag**2 < _ZERO_EPS:
                    src_index_list.discard(k2)
                    dst_index_list.discard(k2)
                    self.coeff.pop(k2)
                else:
                    self.coeff[k2] = tmp0
            else:
                if k1[0]=='1':
                    dst_index_list.add(k2)
                else:
                    src_index_list.add(k2)
                self.coeff[k2] = (-v0*1j/np.sqrt(2)) if tag_inverse else (v0*1j/np.sqrt(2))
        self.pos2tag[src] = tag if len(src_index_list) else None
        self.pos2tag[dst] = tag if len(dst_index_list) else None

    def apply_iswap(self, src:int, dst:int, control=None, negate_control=None, tag_inverse=False):
        # when control all zero, apply iswap
        assert src!=dst
        if control is not None:
            if not hasattr(control, '__len__'):
                control = [int(control)]
            tmp0 = {int(x) for x in control}
            assert (len(tmp0)==len(control)) and (src not in tmp0) and (dst not in tmp0)
            control = tmp0
        if negate_control is not None:
            if not hasattr(negate_control, '__len__'):
                negate_control = [int(negate_control)]
            tmp0 = {int(x) for x in negate_control}
            assert (len(tmp0)==len(negate_control)) and (src not in tmp0) and (dst not in tmp0)
            negate_control = tmp0
            # if control is not None:
            #     assert len(control & negate_control)==0
        x0 = self.pos2tag[src]
        x2 = self.pos2tag[dst]
        assert ((x0 is None) and (x2 is not None)) or ((x0 is not None) and (x2 is None)) or ((x0==x2) and (x0 is not None)), f'src={src}, dst={dst}, x0={x0}, x2={x2}'
        tag = x0 if (x0 is not None) else x2
        index_list = {k for k in self.coeff.keys() if (k[src]+k[dst] in ('10','01','11'))}
        self._cache_probability.clear()
        coeff_old = dict()
        for x in index_list:
            coeff_old[x] = self.coeff.pop(x)
        src_index_list = []
        dst_index_list = []
        for k0,v0 in coeff_old.items():
            k1 = k0[src]+k0[dst]
            if ((k1=='11') or ((control is not None) and any(k0[x]!='0' for x in control))
                    or ((negate_control is not None) and all(k0[x]=='0' for x in negate_control))):
                # nothing change
                self.coeff[k0] = v0
                if k1[0]=='1':
                    src_index_list.append(k0)
                if k1[1]=='1':
                    dst_index_list.append(k0)
                continue
            # k1 in ['01','10']
            k2 = hf_swap_str_char(k0, src, dst)
            if k1[0]=='1':
                dst_index_list.append(k2)
            else:
                src_index_list.append(k2)
            self.coeff[k2] = (-v0*1j) if tag_inverse else (v0*1j)
        self.pos2tag[src] = tag if len(src_index_list) else None
        self.pos2tag[dst] = tag if len(dst_index_list) else None

    def change_tag(self, index:int, label:str):
        assert (0<=index) and (index<len(self.pos2tag)) and isinstance(label,str)
        assert self.pos2tag[index] is not None
        self.pos2tag[index] = label
        self._cache_probability.pop(index, None)

    def drop_coeff(self, key_list):
        if isinstance(key_list, str):
            key_list = [key_list]
        if len(key_list):
            self._cache_probability.clear()
            for x0 in key_list:
                self.coeff.pop(x0)
            tmp0 = set(self.coeff.keys()) - set(key_list)
            tmp1 = (self.coeff[x] for x in tmp0)
            tmp1 = np.sqrt(sum(x.real*x.real+x.imag*x.imag for x in tmp1))
            assert tmp1 > _ZERO_EPS, 'zero probability'
            tmp1 = 1/tmp1
            self.coeff = {k:self.coeff[k]*tmp1 for k in tmp0}
            self.pos2tag = [(x1 if any(y[x0]=='1' for y in tmp0) else None) for x0,x1 in enumerate(self.pos2tag)]

    def measure(self, index, fix=None, seed=None):
        if fix is not None:
            fix = int(fix)
            assert fix in {0,1}
        index = hf_convert_pos_to_int(index)
        prob = self._get_probability_i(index)
        if (prob<_ZERO_EPS):
            if fix==1:
                raise QChessInvalidCommand('zero probability but required fix=1')
            result = 0
        elif (prob>(1-_ZERO_EPS)):
            if fix==0:
                raise QChessInvalidCommand('100% probability to be 1 but required fix=0')
            result = 1
        else:
            if fix is not None:
                result = fix
            else:
                result = int(get_rng(seed, self.rng).uniform(0,1)<prob)
        self.drop_coeff([x for x in self.coeff.keys() if x[index]==str(1-result)])
        # drop ancilla if not needed
        hf0 = lambda x: (x<_ZERO_EPS) or (x>(1-_ZERO_EPS))
        drop_ancilla_list = [x for x in range(64, len(self.pos2tag)) if hf0(self._get_probability_i(x))]
        self.drop_ancilla(drop_ancilla_list)
        self.last_measure = result
        self.last_measure1_prob = prob

    def drop_ancilla(self, index:int|list):
        if not hasattr(index,'__len__'):
            index = [index]
        index = sorted({int(x) for x in index})
        assert all(x>=64 for x in index)
        tmp0 = (self._get_probability_i(x) for x in index)
        assert all((x<_ZERO_EPS) or (x>1-_ZERO_EPS) for x in tmp0)
        self._cache_probability.clear()
        for x in index[::-1]:
            self.coeff = {hf_drop_str_char(k,x):v for k,v in self.coeff.items()}
            self.pos2tag.pop(x)

    def add_ancilla(self):
        self.coeff = {(k+'0'):v for k,v in self.coeff.items()}
        self.pos2tag.append(None)

    def print_verbose(self, space:int=4):
        dash = '\u2500'
        tag_list = [self.tag_to_print_tag[self.pos2tag[x]] for x in range(64)]
        for key,value in self.coeff.items():
            tmp0 = [' | '.join(tag_list[8*x+y] if (key[8*x+y]=='1') else ' ' for y in range(8)) for x in range(8)]
            table = [(' '*space + f'{x+1} | ' + y + ' |') for x,y in enumerate(tmp0)]
            print(f'coeff: {value}')
            print(' '*(space+3) + dash*31)
            print('\n'.join(table[::-1]))
            print(' '*(space+3) + dash*31)
            print(' '*space + f' | a | b | c | d | e | f | g | h  |')

    def get_print_str(self, space:int=0):
        dash = '\u2500' # https://symbl.cc/en/unicode/blocks/box-drawing/
        tag_list,prob_list = self.get_marginal_probability()
        assert (min(prob_list)>=0) and (max(prob_list)<(1+_ZERO_EPS))
        prob_str_list = [('   ' if ((x>0.995) or (x<_ZERO_EPS)) else str(round(x,2))[1:].ljust(3)) for x in prob_list]
        tmp0 = [self.tag_to_print_tag[x]+y for x,y in zip(tag_list,prob_str_list)]
        tmp1 = (' | '.join(tmp0[(x*8):(x*8+8)]) for x in range(8))
        table = [(' '*space + f'{x+1} | ' + y + ' |') for x,y in enumerate(tmp1)]
        ret = ' '*(space+3) + dash*55 + '\n'
        ret += '\n'.join(table[::-1]) + '\n'
        ret += ' '*(space+3) + dash*55 + '\n'
        tmp0 = '    | '.join('abcdefgh')
        ret += ' '*space + f'  | {tmp0}    |'
        return ret

    # to display the current state of the chess board in UI
    def get_print_board(self):
        tag_list, prob_list = self.get_marginal_probability()
        to_name = {'P':'PAWN', 'R':'ROOK', 'N':'KNIGHT', 'B':'BISHOP', 'Q':'QUEEN', 'K':'KING'}
        tuple_list = []
        for x, p in zip(tag_list, prob_list):
            if x is None:
                tuple_list.append(None)
            else:
                tuple_list.append((to_name[x.upper()], x.isupper(), p))
        tuple_grid = [tuple_list[(x*8):(x*8+8)] for x in range(8)]
        return tuple_grid

    def __str__(self):
        return self.get_print_str(space=4)

    __repr__ = __str__

    def normal_jump(self, src, dst):
        self.normal_slide(src, dst, [])

    def split_jump(self, src, dst1, dst2):
        self.split_slide(src, dst1, dst2, [], [])

    def normal_slide(self, src, dst, path):
        src:int = hf_convert_pos_to_int(src)
        dst:int = hf_convert_pos_to_int(dst)
        path = [hf_convert_pos_to_int(x) for x in path]
        tmp0 = set(path)
        if ((src==dst) or (not (0<=src<64)) or (not (0<=dst<64)) or (len(tmp0)<len(path))
                or (src in tmp0) or (dst in tmp0) or any(not (0<=x<64) for x in path)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}", path="{path}"')
        tag_src = self.pos2tag[src]
        tag_dst = self.pos2tag[dst]
        if (tag_src is None) or ((tag_dst is not None) and (tag_src!=tag_dst)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        if any(self.get_marginal_probability(x)>1-_ZERO_EPS for x in path):
            raise QChessInvalidCommand(f'invalid path="{path}"')
        self.apply_iswap(src, dst, path)

    def split_slide(self, src, dst1, dst2, path1, path2):
        src:int = hf_convert_pos_to_int(src)
        dst1:int = hf_convert_pos_to_int(dst1)
        dst2:int = hf_convert_pos_to_int(dst2)
        path1 = [hf_convert_pos_to_int(x) for x in path1]
        path2 = [hf_convert_pos_to_int(x) for x in path2]
        tmp0 = set(path1)
        tmp1 = set(path2)
        if ((src==dst1) or (src==dst2) or (dst1==dst2) or (not (0<=src<64)) or (not (0<=dst1<64)) or (not (0<=dst2<64))
                or (len(tmp0)<len(path1)) or (src in tmp0) or (dst1 in tmp0) or (dst2 in tmp0) or any(not (0<=x<64) for x in tmp0)
                or (len(tmp1)<len(path2)) or (src in tmp1) or (dst1 in tmp1) or (dst2 in tmp1) or any(not (0<=x<64) for x in tmp1)):
            # or len(tmp0 & tmp1)>0 #weird
            raise QChessInvalidCommand(f'invalid src="{src}", dst1="{dst1}", dst2="{dst2}", path1="{path1}", path2="{path2}"')
        tag_src = self.pos2tag[src]
        tag_dst1 = self.pos2tag[dst1]
        tag_dst2 = self.pos2tag[dst2]
        if (tag_src is None) or ((tag_dst1 is not None) and (tag_src!=tag_dst1)) or ((tag_dst2 is not None) and (tag_src!=tag_dst2)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst1="{dst1}", dst2="{dst2}"')
        if any(self.get_marginal_probability(x)>1-_ZERO_EPS for x in path1) and any(self.get_marginal_probability(x)>1-_ZERO_EPS for x in path2):
            raise QChessInvalidCommand(f'invalid path1="{path1}", path2="{path2}"')
        # controlled split
        self.apply_sqrtiswap(src, dst1, set(path1)|set(path2))
        if (self.pos2tag[src] is not None) or (self.pos2tag[dst2] is not None):
            self.apply_iswap(src, dst2, set(path1)|set(path2))
        # controlled slide dst1
        if (self.pos2tag[src] is not None) or (self.pos2tag[dst1] is not None):
            self.apply_iswap(src, dst1, control=path1, negate_control=path2)
        # controlled slide dst2
        if (self.pos2tag[src] is not None) or (self.pos2tag[dst2] is not None):
            self.apply_iswap(src, dst2, control=path2, negate_control=path1)

    def merge_slide(self, src1, src2, dst, path1, path2):
        src1:int = hf_convert_pos_to_int(src1)
        src2:int = hf_convert_pos_to_int(src2)
        dst:int = hf_convert_pos_to_int(dst)
        path1 = [hf_convert_pos_to_int(x) for x in path1]
        path2 = [hf_convert_pos_to_int(x) for x in path2]
        tmp0 = set(path1)
        tmp1 = set(path2)
        if ((src1==src2) or (src1==dst) or (src2==dst) or (not (0<=src1<64)) or (not (0<=src2<64)) or (not (0<=dst<64))
                or (len(tmp0)<len(path1)) or (src1 in tmp0) or (src2 in tmp0) or (dst in tmp0) or any(not (0<=x<64) for x in tmp0)
                or (len(tmp1)<len(path2)) or (src1 in tmp1) or (src2 in tmp1) or (dst in tmp1) or any(not (0<=x<64) for x in tmp1)):
            # or len(tmp0 & tmp1)>0 #weird
            raise QChessInvalidCommand(f'invalid src1="{src1}", src2="{src2}", dst="{dst}", path1="{path1}", path2="{path2}"')
        tag_src1 = self.pos2tag[src1]
        tag_src2 = self.pos2tag[src2]
        tag_dst = self.pos2tag[dst]
        if (tag_src1 is None) or (tag_src2 is None) or (tag_src1!=tag_src2) or ((tag_dst is not None) and (tag_src1!=tag_dst)):
            raise QChessInvalidCommand(f'invalid src1="{src1}", src2="{src2}", dst="{dst}"')
        if any(self.get_marginal_probability(x)>1-_ZERO_EPS for x in path1) and any(self.get_marginal_probability(x)>1-_ZERO_EPS for x in path2):
            raise QChessInvalidCommand(f'invalid path1="{path1}", path2="{path2}"')
        # controlled slide src2
        self.apply_iswap(dst, src2, control=path2, negate_control=path1, tag_inverse=True)
        # controlled slide src1
        if (self.pos2tag[dst] is not None) or (self.pos2tag[src1] is not None):
            self.apply_iswap(dst, src1, control=path1, negate_control=path2, tag_inverse=True)
        # controlled split
        if (self.pos2tag[dst] is not None) or (self.pos2tag[src2] is not None):
            self.apply_iswap(dst, src2, set(path1)|set(path2), tag_inverse=True)

        # [debug] dst=dst; src=src1; control=None; negate_control=None; tag_inverse=True
        if (self.pos2tag[dst] is not None) or (self.pos2tag[src1] is not None):
            self.apply_sqrtiswap(dst, src1, set(path1)|set(path2), tag_inverse=True)

    def merge_jump(self, src1, src2, dst):
        self.merge_slide(src1, src2, dst, [], [])

    def blocked_slide(self, src, dst, path, measure_fix=None, seed=None):
        src:int = hf_convert_pos_to_int(src)
        dst:int = hf_convert_pos_to_int(dst)
        path = [hf_convert_pos_to_int(x) for x in path]
        tmp0 = set(path)
        if ((src==dst) or (not (0<=src<64)) or (not (0<=dst<64)) or (len(tmp0)<len(path))
                or (src in tmp0) or (dst in tmp0) or any(not (0<=x<64) for x in path)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}", path="{path}"')
        tag_src = self.pos2tag[src]
        tag_dst = self.pos2tag[dst]
        # pawn can be blocked by the opponent piece
        if (tag_src is None) or (tag_dst is None) or (tag_src==tag_dst): #(tag_src.isupper()!=tag_dst.isupper())
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        prob_src = self.get_marginal_probability(src)
        prob_dst = self.get_marginal_probability(dst)
        if (prob_src<_ZERO_EPS) or (prob_dst>1-_ZERO_EPS):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        if any((not (_ZERO_EPS<self.get_marginal_probability(x)<1-_ZERO_EPS)) for x in path):
            raise QChessInvalidCommand(f'invalid path="{path}"')
        self.measure(dst, measure_fix, seed=seed)
        if (self.last_measure==0) and (self.pos2tag[src] is not None):
            self.apply_iswap(src, dst, path)

    def blocked_jump(self, src, dst, measure_fix=None, seed=None):
        self.blocked_slide(src, dst, [], measure_fix, seed)

    def _get_capture_slide_measure_M0_m1_key(self, src, dst, path):
        src:int = hf_convert_pos_to_int(src)
        dst:int = hf_convert_pos_to_int(dst)
        path = [hf_convert_pos_to_int(x) for x in path]
        tmp0 = set(path)
        if ((src==dst) or (not (0<=src<64)) or (not (0<=dst<64)) or (len(tmp0)<len(path)) or (len(path)==0)
                or (src in tmp0) or (dst in tmp0) or any(not (0<=x<64) for x in path)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}", path="{path}"')
        M0_list = []
        M1_list = []
        tmp0 = {(False,False,False),(True,True,True),(True,True,False),(False,True,False)}
        for key in self.coeff.keys():
            bs = key[src]=='1'
            bt = key[dst]=='1'
            bp = any(key[x]=='1' for x in path)
            if (bp,bt,bs) in tmp0:
                M0_list.append(key)
            else:
                M1_list.append(key)
        return M0_list,M1_list

    def get_capture_slide_measure_prob(self, src, dst, path):
        _,M1_list = self._get_capture_slide_measure_M0_m1_key(src, dst, path)
        tmp0 = (self.coeff[x] for x in M1_list)
        prob1 = sum(x.real*x.real+x.imag*x.imag for x in tmp0)
        return prob1

    def _capture_slide_measure(self, src, dst, path, measure_fix=None, seed=None):
        # checked in self.capture_slide()
        M0_list,M1_list = self._get_capture_slide_measure_M0_m1_key(src, dst, path)
        tmp0 = (self.coeff[x] for x in M1_list)
        prob1 = sum(x.real*x.real+x.imag*x.imag for x in tmp0)
        if prob1<_ZERO_EPS: #move with zero probability, so forbidden
            # raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}", path="{path}"')
            # cannot check this in advance, so we allow this
            return 'meaningless move'
        if measure_fix is not None:
            assert measure_fix in {0,1}
            result = measure_fix
        else:
            rng = get_rng(seed, self.rng)
            result = int(rng.uniform(0,1)<prob1)
        self.last_measure = result
        self.last_measure1_prob = prob1
        self.drop_coeff(M1_list if result==0 else M0_list)

    def capture_slide(self, src, dst, path, measure_fix=None, seed=None, is_pawn=False):
        if len(path)==0:
            self.capture_jump(src, dst, measure_fix, seed)
            return
        src:int = hf_convert_pos_to_int(src)
        dst:int = hf_convert_pos_to_int(dst)
        path = [hf_convert_pos_to_int(x) for x in path]
        tag_src = self.pos2tag[src]
        tag_dst = self.pos2tag[dst]
        if ((tag_src is None) or (tag_dst is None) or (tag_src.isupper()==tag_dst.isupper())
                or (tag_src==tag_dst) or (is_pawn and tag_src[0] not in 'pP')):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        tmp0 = set(path)
        if ((src==dst) or (not (0<=src<64)) or (not (0<=dst<64)) or (len(tmp0)<len(path)) or (len(path)==0)
                or (src in tmp0) or (dst in tmp0) or any(not (0<=x<64) for x in path)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}", path="{path}"')
        tmp0 = self._capture_slide_measure(src, dst, path, measure_fix, seed)
        if (tmp0 is None) and (self.last_measure==1):
            ancilla = None
            if self.pos2tag[dst] is not None:
                ancilla = len(self.pos2tag)
                self.add_ancilla()
                self.apply_iswap(dst, ancilla, path)
            if is_pawn:
                if ancilla is not None:
                    self.apply_iswap(src, dst, path, negate_control=[ancilla])
            else:
                self.apply_iswap(src, dst, path)
            if ancilla is not None:
                tmp0 = self.get_marginal_probability(ancilla)
                if (tmp0<_ZERO_EPS) or (tmp0>1-_ZERO_EPS):
                    self.drop_ancilla(ancilla)

    def capture_jump(self, src, dst, measure_fix=None, seed=None, is_pawn=False):
        src:int = hf_convert_pos_to_int(src)
        dst:int = hf_convert_pos_to_int(dst)
        if (src==dst) or (not (0<=src<64)) or (not (0<=dst<64)):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        tag_src = self.pos2tag[src]
        tag_dst = self.pos2tag[dst]
        if ((tag_src is None) or (tag_dst is None) or (tag_src.isupper()==tag_dst.isupper())
                or (tag_src==tag_dst) or (is_pawn and (tag_src[0] not in 'pP'))):
            raise QChessInvalidCommand(f'invalid src="{src}", dst="{dst}"')
        if self.get_marginal_probability(src) < _ZERO_EPS:
            raise QChessInvalidCommand(f'invalid src="{src}"')
        self.measure(src, measure_fix, seed=seed)
        if self.last_measure==1:
            ancilla = None
            if self.pos2tag[dst] is not None:
                ancilla = len(self.pos2tag)
                self.add_ancilla()
                self.apply_iswap(dst, ancilla)
            if is_pawn:
                if ancilla is not None:
                    self.apply_iswap(src, dst, negate_control=[ancilla])
            else:
                self.apply_iswap(src, dst)
            if ancilla is not None:
                tmp0 = self.get_marginal_probability(ancilla)
                if (tmp0<_ZERO_EPS) or (tmp0>1-_ZERO_EPS):
                    self.drop_ancilla(ancilla)

    def add_piece(self, pos:int, tag:str):
        assert (0<=pos<len(self.pos2tag)) and (self.pos2tag[pos] is None)
        if tag not in self.tag_to_print_tag:
            hf0 = lambda x: (x if x.isupper() else f'\033[94m{x.upper()}\033[0m')
            self.tag_to_print_tag[tag] = hf0(tag)
        self._cache_probability.clear()
        self.pos2tag[pos] = tag
        self.coeff = {hf_invert_str01(k,pos):v for k,v in self.coeff.items()}

    def remove_piece(self, pos:int):
        assert (0<=pos<len(self.pos2tag)) and (self._get_probability_i(pos)>1-_ZERO_EPS)
        self._cache_probability.clear()
        self.pos2tag[pos] = None
        self.coeff = {hf_invert_str01(k,pos):v for k,v in self.coeff.items()}

    def remove_all_piece(self):
        self.coeff.clear()
        self.coeff['0000000000000000000000000000000000000000000000000000000000000000'] = 1
        self.pos2tag = [None]*64
        self._cache_probability.clear()

## command list
# add a3 P


def is_measured_wrapper(hf0):
    def hf1(self, *args, **kwargs):
        self.sim.last_measure = None
        self.sim.last_measure1_prob = None
        ret = hf0(self, *args, **kwargs)
        return ret
    return hf1



class QChessGame:
    # user interface
    def __init__(self, seed=None):
        if not _GLOBAL_CONFIG['print_disclaimer']:
            print(_DISCLAIMER)
            _GLOBAL_CONFIG['print_disclaimer'] = True
        self.rng = get_rng(seed)
        self._reset()

    def __str__(self):
        ret = self.sim.get_print_str(space=4)
        return ret

    __repr__ = __str__

    def copy(self):
        ret = QChessGame()
        ret.sim._clone_from_sim(self.sim)
        ret.rng = ret.sim.rng

    @property
    def is_white(self):
        # white first
        return self.current_step % 2 == 0

    def __getitem__(self, key):
        if isinstance(key, int):
            pass
        elif isinstance(key, str):
            key = hf_convert_pos_to_int(key)
        elif isinstance(key, tuple) and (len(key)==2) and isinstance(key[0],int) and isinstance(key[1],int):
            key = key[0] + 8*key[1]
        elif isinstance(key, ChessPosition):
            key = key.pos
        else:
            raise KeyError(f'invalid key="{key}"')
        if self.sim.pos2tag[key] is None:
            ret = None
        else:
            tag = self.sim.pos2tag[key]
            prob = self.sim.get_marginal_probability(key)
            ret = (tag, prob)
        return ret

    def set_prefix_measure(self, prefix_measure:int|None):
        assert (prefix_measure in {0,1}) or (prefix_measure is None)
        self.prefix_measure = prefix_measure

    def get_prefix_measure(self, reset_to_none=True):
        ret = self.prefix_measure
        if reset_to_none:
            self.prefix_measure = None #reset to None
        return ret

    def _reset(self, state0=0xFFFF00000000FFFF, tag_list='RNBQKBNRPPPPPPPPpppppppprnbqkbnr'):
        # white: upper case
        # black: lower case
        self.sim = QChessSparseSimulator(state0, tag_list, self.rng)
        self.current_step = 0
        self.wpawn_last_twostep = [None]*8
        self.bpawn_last_twostep = [None]*8
        self.prefix_measure = None
        self.pawn_last_twostep = {(x+y):None for x in 'abcdefgh' for y in '27'} #some entry might be invalid (e.g. captured)
        self.tag_wcastling = [True, True]
        self.tag_bcastling = [True, True]
        self.history = []

    def get_two_point_path(self, src:ChessPosition, dst:ChessPosition):
        file0 = src.file
        rank0 = src.rank
        file1 = dst.file
        rank1 = dst.rank
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
            raise QChessInvalidCommand(f'invalid path src="{src.str_}", dst="{dst.str_}"')
        ret = (ChessPosition(x,y) for x,y in ret)
        ret = [x for x in ret if self[x] is not None]
        return ret

    def _is_valid_move_preprocess(self, src, src1, dst, dst1, tag):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        tag = tag.upper()
        tag_src = self[src]
        tag_dst = self[dst]
        if (tag_src is None) or (tag_src[0]!=(tag if self.is_white else tag.lower())) or (src==dst):
            return ''
        tag_src1 = None
        if src1 is not None:
            tag_src1 = self[src1]
            if (tag_src1 is None) or (tag_src1[0]!=(tag if self.is_white else tag.lower())) or (dst1 is not None) or (src1==src) or (src1==dst):
                return ''
        tag_dst1 = None
        if dst1 is not None:
            tag_dst1 = self[dst1]
            if (src1 is not None) or (src==dst1) or (dst==dst1):
                return ''
        return src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1

    def is_valid_move_pawn(self, src:str|ChessPosition, dst:str|ChessPosition, promotion:str|None)->str:
        is_white = self.is_white
        src, dst = hf_str_none_to_position(src, dst)
        assert (src is not None) and (dst is not None)
        tag_src = self[src]
        tag_dst = self[dst]
        tag_path = self[(src.file,src.rank+(1 if is_white else -1))]
        if (tag_src is None) or (tag_src[0]!=('P' if is_white else 'p')) or (src==dst):
            return ''
        if (promotion is not None) and (dst.rank != (7 if is_white else 0)):
            return ''
        if (dst.rank==src.rank+(1 if is_white else -1)) and (dst.file==src.file) and (tag_dst is None):
            ret = 'one-step-move'
        elif ((dst.rank==src.rank + (1 if is_white else -1)) and (dst.file==src.file) and (tag_dst is not None)
                and (tag_dst[1]<=(1-_ZERO_EPS))):
            ret = 'one-step-blocked-move'
        elif ((dst.rank==src.rank+(2 if is_white else -2)) and (dst.file==src.file) and (src.rank==(1 if is_white else 6))
                and ((tag_path is None) or (tag_path[1]<=(1-_ZERO_EPS)))
                and ((tag_dst is None) or ((tag_dst[0]==tag_src[0]) and (tag_dst[1]<=(1-_ZERO_EPS))))):
            ret = 'two-step-move'
        elif ((dst.rank==src.rank+(2 if is_white else -2)) and (dst.file==src.file) and (src.rank==(1 if is_white else 6))
                and ((tag_path is None) or (tag_path[1]<=(1-_ZERO_EPS)))
                and (tag_dst is not None) and (tag_dst[1]<=(1-_ZERO_EPS))):
            ret = 'two-step-blocked-move'
        elif ((dst.rank==src.rank + (1 if is_white else -1)) and (dst.file in {src.file-1,src.file+1})
              and (tag_dst is not None) and (tag_dst[0].islower()!=tag_src[0].islower())):
            ret = 'capture'
        elif ((dst.rank==src.rank+(1 if is_white else -1)) and (dst.file in {src.file-1,src.file+1})
              and (tag_dst is None) and (self[(dst.file,src.rank)] is not None)
              and (self[(dst.file,src.rank)][0]==('p' if is_white else 'P'))
              and (self.pawn_last_twostep[ChessPosition(dst.file, src.rank).str_]==(self.current_step-1))):
            ret = 'en-passant'
        else:
            ret = ''
        if (dst.rank == (7 if is_white else 0)) and ((promotion is None) or (promotion not in 'rnbq')):
            ret = ''
        return ret

    @is_measured_wrapper
    def move_pawn(self, src: str, dst: str, promotion:str|None=None):
        src, dst = hf_str_none_to_position(src, dst)
        assert (src is not None) and (dst is not None)
        kind = self.is_valid_move_pawn(src, dst, promotion)
        if kind == 'one-step-move':
            self.sim.normal_jump(src.pos, dst.pos)
            self.pawn_last_twostep[dst.str_] = self.pawn_last_twostep.pop(src.str_)
        elif kind == 'one-step-blocked-move':
            self.sim.blocked_jump(src.pos, dst.pos, self.get_prefix_measure())
            if self.sim.last_measure == 0:
                self.pawn_last_twostep[dst.str_] = self.pawn_last_twostep.pop(src.str_)
        elif kind == 'two-step-move':
            assert self.pawn_last_twostep[src.str_] is None, 'something must be wrong'
            tmp0 = ChessPosition(src.file, src.rank+(1 if self.is_white else -1))
            if self[tmp0] is not None:
                assert self[tmp0][1]<=1-_ZERO_EPS
                path = [tmp0.pos]
            else:
                path = []
            self.sim.normal_slide(src.pos, dst.pos, path)
            self.pawn_last_twostep[dst.str_] = self.current_step
            if len(path)==0:
                self.pawn_last_twostep.pop(src.str_)
        elif kind == 'two-step-blocked-move':
            assert self.pawn_last_twostep[src.str_] is None, 'something must be wrong'
            tmp0 = ChessPosition(src.file, src.rank+(1 if self.is_white else -1))
            if self[tmp0] is not None:
                assert self[tmp0][1]<=1-_ZERO_EPS
                path = [tmp0.pos]
            else:
                path = []
            self.sim.blocked_slide(src.pos, dst.pos, path, self.get_prefix_measure())
            if self.sim.last_measure == 0:
                self.pawn_last_twostep[dst.str_] = self.current_step
                if len(path)==0:
                    self.pawn_last_twostep.pop(src.str_)
        elif kind == 'capture':
            self.sim.capture_jump(src.pos, dst.pos, self.get_prefix_measure(), is_pawn=True)
            self.pawn_last_twostep[dst.str_] = self.pawn_last_twostep.pop(src.str_)
            if self[src] is not None: #partially captured
                self.pawn_last_twostep[src.str_] = self.pawn_last_twostep[dst.str_]
        elif kind == 'en-passant':
            tmp0 = ChessPosition(dst.file, src.rank)
            self.sim.capture_jump(src.pos, tmp0.pos, self.get_prefix_measure(), is_pawn=True)
            self.sim.normal_jump(tmp0.pos, dst.pos)
            self.pawn_last_twostep[dst.str_] = self.pawn_last_twostep.pop(src.str_)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", dst="{dst.str_}"')
        if promotion is not None:
            self.sim.change_tag(dst.pos, promotion.upper() if self.is_white else promotion.lower())

    def is_valid_castling(self, srcK, srcR, dstK, dstR):
        srcK,srcR,dstK,dstR = hf_str_none_to_position(srcK, srcR, dstK, dstR)
        assert (srcK is not None) and (srcR is not None) and (dstK is not None) and (dstR is not None)
        is_white = self.is_white
        tag_srcK = self[srcK]
        tag_srcR = self[srcR]
        if ((srcK==srcR) or (tag_srcK is None) or (tag_srcK[0]!=('K' if is_white else 'k')) or (tag_srcK[1]<=(1-_ZERO_EPS))
                or ((srcK.file,srcK.rank)!=((4,0) if is_white else (4,7)))
                or (tag_srcR is None) or (tag_srcR[0]!=('R' if is_white else 'r')) or (tag_srcR[1]<=(1-_ZERO_EPS))
                or ((srcR.file,srcR.rank) not in (((0,0),(7,0)) if is_white else ((0,7),(7,7)))) #rook must be in the corner
                or (not (self.tag_wcastling if is_white else self.tag_bcastling)[0 if srcR.file==0 else 1])):
            return ''
        tmp0 = ChessPosition(srcK.file+(2 if dstK.file>srcK.file else -2), srcK.rank)
        tmp1 = ChessPosition(srcK.file+(1 if dstK.file>srcK.file else -1), srcK.rank)
        if (dstK==tmp0) and (dstR==tmp1) and all(self[x] is None for x in self.get_two_point_path(srcK, srcR)):
            ret = 'castling'
        else:
            ret = ''
        return ret

    def move_castling(self, srcK:str, srcR:str, dstK:str, dstR:str):
        srcK,srcR,dstK,dstR = hf_str_none_to_position(srcK, srcR, dstK, dstR)
        assert (srcK is not None) and (srcR is not None) and (dstK is not None) and (dstR is not None)
        kind = self.is_valid_castling(srcK, srcR, dstK, dstR)
        if kind=='castling':
            self.sim.normal_jump(srcK.pos, dstK.pos)
            self.sim.normal_jump(srcR.pos, dstR.pos)
            if self.is_white:
                self.tag_wcastling[0] = False
                self.tag_wcastling[1] = False
            else:
                self.tag_bcastling[0] = False
                self.tag_bcastling[1] = False
        else:
            raise QChessInvalidCommand(f'invalid srcK="{srcK.str_}", srcR="{srcR.str_}", dstK="{dstK.str_}", dstR="{dstR.str_}"')

    def is_valid_move_rook(self, src, src1, dst, dst1):
        tmp0 = self._is_valid_move_preprocess(src, src1, dst, dst1, 'R')
        if tmp0=='':
            return ''
        src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1 = tmp0
        hf0 = lambda x,y: (x.file==y.file) or (x.rank==y.rank)
        if (not hf0(src, dst)) or ((src1 is not None) and (not hf0(src1, dst))) or ((dst1 is not None) and (not hf0(src, dst1))):
            return ''
        path0 = self.get_two_point_path(src, dst)
        path1 = None
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        if any(self[x][1]>1-_ZERO_EPS for x in path0) or ((path1 is not None) and any(self[x][1]>1-_ZERO_EPS for x in path1)):
            return ''
        if (src1 is None) and (dst1 is None):
            if (tag_dst is None) or (tag_dst[0]==tag_src[0]):
                ret = 'normal-slide'
            elif (tag_dst[0].islower()==tag_src[0].islower()) and (tag_dst[1]<1-_ZERO_EPS):
                ret = 'blocked-slide'
            elif (tag_dst[0].islower()!=tag_src[0].islower()):
                ret = 'capture'
            else:
                ret = ''
        elif ((src1 is None) and (dst1 is not None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0])) and ((tag_dst1 is None) or (tag_dst1[0]==tag_src[0]))): #split
            ret = 'split'
        elif ((src1 is not None) and (dst1 is None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0]))): #merge
            ret = 'merge'
        else:
            ret = ''
        return ret

    @is_measured_wrapper
    def move_rook(self, src:str, src1:(str|None), dst:str, dst1:(str|None)):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        path0 = self.get_two_point_path(src, dst)
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        kind = self.is_valid_move_rook(src, src1, dst, dst1)
        if kind=='normal-slide':
            self.sim.normal_slide(src.pos, dst.pos, [x.pos for x in path0])
        elif kind=='blocked-slide':
            self.sim.blocked_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='capture':
            self.sim.capture_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='split':
            tmp0,tmp1 = hf_weird_split_slide(dst.pos, dst1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.split_slide(src.pos, dst.pos, dst1.pos, tmp0, tmp1)
        elif kind=='merge':
            tmp0,tmp1 = hf_weird_merge_slide(src.pos, src1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.merge_slide(src.pos, src1.pos, dst.pos, tmp0, tmp1)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", src1="{src1}", dst="{dst.str_}", dst1="{dst1}"')
        tmp0 = self[src]
        if ((src.file,src.rank) in {(0,0),(7,0)}) and ((tmp0 is None) or (tmp0[1]<=1-_ZERO_EPS)):
            self.tag_wcastling[0 if (src.file) else 1] = False
        if ((src.file,src.rank) in {(0,7),(7,7)}) and ((tmp0 is None) or (tmp0[1]<=1-_ZERO_EPS)):
            self.tag_bcastling[1 if (src.file) else 0] = False

    def is_valid_move_bishop(self, src, src1, dst, dst1):
        tmp0 = self._is_valid_move_preprocess(src, src1, dst, dst1, 'B')
        if tmp0=='':
            return ''
        src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1 = tmp0
        hf0 = lambda x,y: abs(x.file-y.file)==abs(x.rank-y.rank)
        if (not hf0(src, dst)) or ((src1 is not None) and (not hf0(src1, dst))) or ((dst1 is not None) and (not hf0(src, dst1))):
            return ''
        path0 = self.get_two_point_path(src, dst)
        path1 = None
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        if any(self[x][1]>1-_ZERO_EPS for x in path0) or ((path1 is not None) and any(self[x][1]>1-_ZERO_EPS for x in path1)):
            return ''
        if (src1 is None) and (dst1 is None):
            if (tag_dst is None) or (tag_dst[0]==tag_src[0]):
                ret = 'normal-slide'
            elif (tag_dst[0].islower()==tag_src[0].islower()) and (tag_dst[1]<1-_ZERO_EPS):
                ret = 'blocked-slide'
            elif (tag_dst[0].islower()!=tag_src[0].islower()):
                ret = 'capture'
            else:
                ret = ''
        elif ((src1 is None) and (dst1 is not None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0])) and ((tag_dst1 is None) or (tag_dst1[0]==tag_src[0]))): #split
            ret = 'split'
        elif ((src1 is not None) and (dst1 is None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0]))): #merge
            ret = 'merge'
        else:
            ret = ''
        return ret

    @is_measured_wrapper
    def move_bishop(self, src:str, src1:(str|None), dst:str, dst1:(str|None)):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        path0 = self.get_two_point_path(src, dst)
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        kind = self.is_valid_move_bishop(src, src1, dst, dst1)
        if kind=='normal-slide':
            self.sim.normal_slide(src.pos, dst.pos, [x.pos for x in path0])
        elif kind=='blocked-slide':
            self.sim.blocked_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='capture':
            self.sim.capture_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='split':
            tmp0,tmp1 = hf_weird_split_slide(dst.pos, dst1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.split_slide(src.pos, dst.pos, dst1.pos, tmp0, tmp1)
        elif kind=='merge':
            tmp0,tmp1 = hf_weird_merge_slide(src.pos, src1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.merge_slide(src.pos, src1.pos, dst.pos, tmp0, tmp1)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", src1="{src1}", dst="{dst.str_}", dst1="{dst1}"')

    def is_valid_move_queen(self, src, src1, dst, dst1):
        tmp0 = self._is_valid_move_preprocess(src, src1, dst, dst1, 'Q')
        if tmp0=='':
            return ''
        src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1 = tmp0
        hf0 = lambda x,y: abs(x.file-y.file)==abs(x.rank-y.rank) or (x.file==y.file) or (x.rank==y.rank)
        if (not hf0(src, dst)) or ((src1 is not None) and (not hf0(src1, dst))) or ((dst1 is not None) and (not hf0(src, dst1))):
            return ''
        path0 = self.get_two_point_path(src, dst)
        path1 = None
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        if any(self[x][1]>1-_ZERO_EPS for x in path0) or ((path1 is not None) and any(self[x][1]>1-_ZERO_EPS for x in path1)):
            return ''
        if (src1 is None) and (dst1 is None):
            if (tag_dst is None) or (tag_dst[0]==tag_src[0]):
                ret = 'normal-slide'
            elif (tag_dst[0].islower()==tag_src[0].islower()) and (tag_dst[1]<1-_ZERO_EPS):
                ret = 'blocked-slide'
            elif (tag_dst[0].islower()!=tag_src[0].islower()):
                ret = 'capture'
            else:
                ret = ''
        elif ((src1 is None) and (dst1 is not None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0])) and ((tag_dst1 is None) or (tag_dst1[0]==tag_src[0]))): #split
            ret = 'split'
        elif ((src1 is not None) and (dst1 is None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0]))): #merge
            ret = 'merge'
        else:
            ret = ''
        return ret

    @is_measured_wrapper
    def move_queen(self, src:str, src1:(str|None), dst:str, dst1:(str|None)):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        path0 = self.get_two_point_path(src, dst)
        if src1 is not None:
            path1 = self.get_two_point_path(src1, dst)
        if dst1 is not None:
            path1 = self.get_two_point_path(src, dst1)
        kind = self.is_valid_move_queen(src, src1, dst, dst1)
        if kind=='normal-slide':
            self.sim.normal_slide(src.pos, dst.pos, [x.pos for x in path0])
        elif kind=='blocked-slide':
            self.sim.blocked_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='capture':
            self.sim.capture_slide(src.pos, dst.pos, [x.pos for x in path0], self.get_prefix_measure())
        elif kind=='split':
            tmp0,tmp1 = hf_weird_split_slide(dst.pos, dst1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.split_slide(src.pos, dst.pos, dst1.pos, tmp0, tmp1)
        elif kind=='merge':
            tmp0,tmp1 = hf_weird_merge_slide(src.pos, src1.pos, [x.pos for x in path0], [x.pos for x in path1])
            self.sim.merge_slide(src.pos, src1.pos, dst.pos, tmp0, tmp1)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", src1="{src1}", dst="{dst.str_}", dst1="{dst1}"')

    def is_valid_move_king(self, src, src1, dst, dst1):
        tmp0 = self._is_valid_move_preprocess(src, src1, dst, dst1, 'K')
        if tmp0=='':
            return ''
        src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1 = tmp0
        hf0 = lambda x,y: ((x.file-y.file) in (1,0,-1)) and ((x.rank-y.rank) in (1,0,-1))
        if (not hf0(src, dst)) or ((src1 is not None) and (not hf0(src1, dst))) or ((dst1 is not None) and (not hf0(src, dst1))):
            return ''
        if (src1 is None) and (dst1 is None):
            if (tag_dst is None) or (tag_dst[0]==tag_src[0]):
                ret = 'normal-jump'
            elif (tag_dst[0].islower()==tag_src[0].islower()) and (tag_dst[1]<1-_ZERO_EPS):
                ret = 'blocked-jump'
            elif (tag_dst[0].islower()!=tag_src[0].islower()):
                ret = 'capture'
            else:
                ret = ''
        elif ((src1 is None) and (dst1 is not None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0])) and ((tag_dst1 is None) or (tag_dst1[0]==tag_src[0]))): #split
            ret = 'split'
        elif ((src1 is not None) and (dst1 is None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0]))): #merge
            ret = 'merge'
        else:
            ret = ''
        return ret

    @is_measured_wrapper
    def move_king(self, src:str, src1:(str|None), dst:str, dst1:(str|None)):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        kind = self.is_valid_move_king(src, src1, dst, dst1)
        if kind=='normal-jump':
            self.sim.normal_jump(src.pos, dst.pos)
        elif kind=='blocked-jump':
            self.sim.blocked_jump(src.pos, dst.pos, self.get_prefix_measure())
        elif kind=='capture':
            self.sim.capture_jump(src.pos, dst.pos, self.get_prefix_measure())
        elif kind=='split':
            self.sim.split_jump(src.pos, dst.pos, dst1.pos)
        elif kind=='merge':
            self.sim.merge_jump(src.pos, src1.pos, dst.pos)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", src1="{src1}", dst="{dst.str_}", dst1="{dst1}"')
        tmp0 = self[src]
        if ((src.file,src.rank) in {(4,0),(4,7)}) and ((tmp0 is None) or (tmp0[1]<=1-_ZERO_EPS)):
            if self.is_white:
                self.tag_wcastling[0] = False
                self.tag_wcastling[1] = False
            else:
                self.tag_bcastling[0] = False
                self.tag_bcastling[1] = False

    def is_valid_move_knight(self, src, src1, dst, dst1):
        tmp0 = self._is_valid_move_preprocess(src, src1, dst, dst1, 'N')
        if tmp0=='':
            return ''
        src,src1,dst,dst1,tag_src,tag_src1,tag_dst,tag_dst1 = tmp0
        hf0 = lambda x,y: (x.file-y.file, x.rank-y.rank) in {(1,2),(2,1),(-1,2),(-2,1),(1,-2),(2,-1),(-1,-2),(-2,-1)}
        if (not hf0(src, dst)) or ((src1 is not None) and (not hf0(src1, dst))) or ((dst1 is not None) and (not hf0(src, dst1))):
            return ''
        if (src1 is None) and (dst1 is None):
            if (tag_dst is None) or (tag_dst[0]==tag_src[0]):
                ret = 'normal-jump'
            elif (tag_dst[0].islower()==tag_src[0].islower()) and (tag_dst[1]<1-_ZERO_EPS):
                ret = 'blocked-jump'
            elif (tag_dst[0].islower()!=tag_src[0].islower()):
                ret = 'capture'
            else:
                ret = ''
        elif ((src1 is None) and (dst1 is not None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0])) and ((tag_dst1 is None) or (tag_dst1[0]==tag_src[0]))): #split
            ret = 'split'
        elif ((src1 is not None) and (dst1 is None) and ((tag_dst is None) or (tag_dst[0]==tag_src[0]))): #merge
            ret = 'merge'
        else:
            ret = ''
        return ret

    @is_measured_wrapper
    def move_knight(self, src:str, src1:(str|None), dst:str, dst1:(str|None)):
        src,src1,dst,dst1 = hf_str_none_to_position(src,src1,dst,dst1)
        assert (src is not None) and (dst is not None)
        kind = self.is_valid_move_knight(src, src1, dst, dst1)
        if kind=='normal-jump':
            self.sim.normal_jump(src.pos, dst.pos)
        elif kind=='blocked-jump':
            self.sim.blocked_jump(src.pos, dst.pos, self.get_prefix_measure())
        elif kind=='capture':
            self.sim.capture_jump(src.pos, dst.pos, self.get_prefix_measure())
        elif kind=='split':
            self.sim.split_jump(src.pos, dst.pos, dst1.pos)
        elif kind=='merge':
            self.sim.merge_jump(src.pos, src1.pos, dst.pos)
        else:
            raise QChessInvalidCommand(f'invalid src="{src.str_}", src1="{src1}", dst="{dst.str_}", dst1="{dst1}"')

    def run_short_cmd(self, cmd, tag_print=True, tag_step=True):
        args = _parse_cmd(cmd) #a2b2,c3  a2,b2  e1h1,g1f1  a2,a3,0
        if args['prefix_measure'] is not None:
            self.set_prefix_measure(args['prefix_measure'])
        src = args['src']
        tag_src = self[src]
        if (tag_src is None) or (tag_src[0].isupper()!=self.is_white):
            raise QChessInvalidCommand(f'invalid src="{src}"')
        src1 = args['src1']
        dst = args['dst']
        dst1 = args['dst1']
        promotion = args['promotion']
        if (src1 is not None) and (dst1 is None) and (not self[src1][0]==tag_src[0]): #merge
            raise QChessInvalidCommand(f'invalid src="{src}", src1="{src1}"')
        if (src1 is not None) and (dst1 is not None): #castling
            self.move_castling(src, src1, dst, dst1)
        elif tag_src[0] in 'Pp':
            self.move_pawn(src, dst, promotion=promotion)
        elif tag_src[0] in 'Rr':
            self.move_rook(src, src1, dst, dst1)
        elif tag_src[0] in 'Bb':
            self.move_bishop(src, src1, dst, dst1)
        elif tag_src[0] in 'Qq':
            self.move_queen(src, src1, dst, dst1)
        elif tag_src[0] in 'Kk':
            self.move_king(src, src1, dst, dst1)
        elif tag_src[0] in 'Nn':
            self.move_knight(src, src1, dst, dst1)
        else:
            raise QChessInvalidCommand(f'invalid src="{src}"')
        if tag_print:
            print(self.sim)
        if tag_step:
            self.current_step += 1
        self.set_prefix_measure(None)
        if args['prefix_measure'] is not None:
            self.history.append(cmd)
        else:
            self.history.append(cmd + (f',{self.sim.last_measure}' if self.sim.last_measure is not None else ''))

    def revert_cmd(self, step:int=1):
        assert step>=1
        step = min(step, len(self.history))
        if step>0:
            history = list(self.history)[:(-step)]
            self._reset()
            for x in history:
                self.run_short_cmd(x, tag_print=False)

    def is_finish_or_not(self):
        tmp0 = any(x=='K' for x in self.sim.pos2tag[:64])
        tmp1 = any(x=='k' for x in self.sim.pos2tag[:64])
        if tmp0 and tmp1:
            ret = 'continue'
        elif tmp0 and (not tmp1):
            ret = 'white'
        elif (not tmp0) and tmp1:
            ret = 'black'
        else:
            ret = 'draw'
        return ret

    def _get_all_available_move_i(self, src:str):
        src = hf_str_none_to_position(src)[0]
        assert src is not None
        tag_src = self[src]
        if (tag_src is None) or (tag_src[0].isupper()!=self.is_white):
            return []
        hf0 = lambda x: min(max(x,0), 7)
        all_piece = tuple(ChessPosition(x) for x in range(64))
        if tag_src[0]=='P':
            assert src.rank!=7
            tmp0 = [ChessPosition(x,src.rank+1) for x in range(max(0,src.file-1), min(7,src.file+1)+1)]
            if src.rank==1:
                tmp0 += [ChessPosition(src.file,src.rank+2)]
            if src.rank==6:
                ret = [f'{src.str_},{x}{y}' for x in tmp0 for y in 'qrbn' if self.is_valid_move_pawn(src, x, y)!='']
            else:
                ret = [f'{src.str_},{x}' for x in tmp0 if self.is_valid_move_pawn(src, x, None)!='']
        elif tag_src[0]=='p':
            assert src.rank!=0
            tmp0 = [ChessPosition(x,src.rank-1) for x in range(max(0,src.file-1), min(7,src.file+1)+1)]
            if src.rank==6:
                tmp0 += [ChessPosition(src.file,src.rank-2)]
            if src.rank==1:
                ret = [f'{src.str_},{x}{y}' for x in tmp0 for y in 'qrbn' if self.is_valid_move_pawn(src, x, y)!='']
            else:
                ret = [f'{src.str_},{x}' for x in tmp0 if self.is_valid_move_pawn(src, x, None)!='']
        elif tag_src[0] in 'Rr':
            hf0 = lambda x,y: (x.file==y.file) or (x.rank==y.rank)
            dst_list = [x for x in all_piece if (x!=src) and hf0(x,src)]
            ret = [f'{src.str_},{x.str_}' for x in dst_list if self.is_valid_move_rook(src, None, x, None)!='']
            ret += [f'{src.str_},{x.str_}{y.str_}' for x in dst_list for y in dst_list if (x!=y) and self.is_valid_move_rook(src, None, x, y)!=''] #split
            for x in range(64):
                x = ChessPosition(x)
                if (x!=src) and (self[x] is not None) and (self[x][0]==tag_src[0]):
                    ret += [f'{src.str_}{x.str_},{y.str_}' for y in dst_list if ((x!=y) and hf0(x,y) and (self.is_valid_move_rook(src, x, y, None)!=''))] # merge
        elif tag_src[0] in 'Bb':
            hf0 = lambda x,y: abs(x.file-y.file)==abs(x.rank-y.rank)
            dst_list = [x for x in all_piece if (x!=src) and hf0(x,src)]
            ret = [f'{src.str_},{x.str_}' for x in dst_list if self.is_valid_move_bishop(src, None, x, None)!='']
            ret += [f'{src.str_},{x.str_}{y.str_}' for x in dst_list for y in dst_list if (x!=y) and self.is_valid_move_bishop(src, None, x, y)!=''] #split
            for x in range(64):
                x = ChessPosition(x)
                if (x!=src) and (self[x] is not None) and (self[x][0]==tag_src[0]):
                    ret += [f'{src.str_}{x.str_},{y.str_}' for y in dst_list if ((x!=y) and hf0(x,y) and (self.is_valid_move_bishop(src, x, y, None)!=''))] # merge
        elif tag_src[0] in 'Qq':
            hf0 = lambda x,y: abs(x.file-y.file)==abs(x.rank-y.rank) or (x.file==y.file) or (x.rank==y.rank)
            dst_list = [x for x in all_piece if (x!=src) and hf0(x,src)]
            ret = [f'{src.str_},{x.str_}' for x in dst_list if self.is_valid_move_queen(src, None, x, None)!='']
            ret += [f'{src.str_},{x.str_}{y.str_}' for x in dst_list for y in dst_list if (x!=y) and self.is_valid_move_queen(src, None, x, y)!=''] #split
            for x in range(64):
                x = ChessPosition(x)
                if (x!=src) and (self[x] is not None) and (self[x][0]==tag_src[0]):
                    ret += [f'{src.str_}{x.str_},{y.str_}' for y in dst_list if ((x!=y) and hf0(x,y) and (self.is_valid_move_queen(src, x, y, None)!=''))] # merge
        elif tag_src[0] in 'Kk':
            hf0 = lambda x,y: ((x.file-y.file) in (1,0,-1)) and ((x.rank-y.rank) in (1,0,-1))
            dst_list = [x for x in all_piece if (x!=src) and hf0(x,src)]
            ret = [f'{src.str_},{x.str_}' for x in dst_list if self.is_valid_move_king(src, None, x, None)!='']
            ret += [f'{src.str_},{x.str_}{y.str_}' for x in dst_list for y in dst_list if (x!=y) and self.is_valid_move_king(src, None, x, y)!=''] #split
            for x in range(64):
                x = ChessPosition(x)
                if (x!=src) and (self[x] is not None) and (self[x][0]==tag_src[0]):
                    ret += [f'{src.str_}{x.str_},{y.str_}' for y in dst_list if ((x!=y) and hf0(x,y) and (self.is_valid_move_king(src, x, y, None)!=''))] # merge
            if (src.file,src.rank) in ((4,0),(4,7)):
                tmp0 = [('e1','a1','c1','d1'), ('e1','h1','g1','f1'), ('e8','a8','c8','d8'), ('e8','h8','g8','f8')]
                ret += [f'{a}{b},{c}{d}' for a,b,c,d in tmp0 if self.is_valid_castling(a,b,c,d)!='']
        elif tag_src[0] in 'Nn':
            hf0 = lambda x,y: (x.file-y.file, x.rank-y.rank) in {(1,2),(2,1),(-1,2),(-2,1),(1,-2),(2,-1),(-1,-2),(-2,-1)}
            dst_list = [x for x in all_piece if (x!=src) and hf0(x,src)]
            ret = [f'{src.str_},{x.str_}' for x in dst_list if self.is_valid_move_knight(src, None, x, None)!='']
            ret += [f'{src.str_},{x.str_}{y.str_}' for x in dst_list for y in dst_list if (x!=y) and self.is_valid_move_knight(src, None, x, y)!=''] #split
            for x in range(64):
                x = ChessPosition(x)
                if (x!=src) and (self[x] is not None) and (self[x][0]==tag_src[0]):
                    ret += [f'{src.str_}{x.str_},{y.str_}' for y in dst_list if ((x!=y) and hf0(x,y) and (self.is_valid_move_knight(src, x, y, None)!=''))] # merge
        return ret

    def get_all_available_move(self):
        ret = [y for x in range(64) for y in self._get_all_available_move_i(ChessPosition(x))]
        return ret

    def add_piece(self, pos, tag, reset=False):
        pos = hf_str_none_to_position(pos)[0]
        assert tag.lower() in 'prbnqk'
        if reset:
            tmp0 = 2 if (pos.pos!=1) else 1
            self._reset(tmp0, 'p')
        self.sim.add_piece(pos.pos, tag)
        if reset:
            self.sim.remove_piece(1 if (pos.pos!=1) else 0)

    def remove_piece(self, pos):
        pos = hf_str_none_to_position(pos)[0]
        self.sim.remove_piece(pos.pos)

    def remove_all_piece(self):
        self.sim.remove_all_piece()

    def random_move(self, split_probability_weight, all_move=None, seed=None):
        rng = self.rng if (seed is None) else get_rng(seed)
        if all_move is None:
            all_move = self.get_all_available_move()
        assert len(all_move)>0, 'something must be wrong, no move available'
        prob = np.array([(split_probability_weight if (len(x.split(',',1)[1])==4) else 1) for x in all_move])
        cmd = rng.choices(all_move, prob/prob.sum())[0]
        self.run_short_cmd(cmd, tag_print=False)

    @staticmethod
    def rand_qchess(step:int=100, split_probability_weight:float=0.2, seed=None, debug:bool=True):
        # 20240730 sometimes fail (bug not fixed)
        assert step>=0
        rng = get_rng(seed)
        while True:
            seed = rng.randint(0, 2**32)
            if debug:
                print(f'seed={seed}') #with seed, the result can be reproduced
            game = QChessGame(seed=seed)
            for _ in range(step):
                game.random_move(split_probability_weight)
                if game.is_finish_or_not()!='continue':
                    break #early stop, re-random
            else:
                break
        return game


def _parse_cmd(cmd:str):
    ret = {
        'prefix_measure': None, #0,1,None
        'src': None, #None,str
        'dst': None, #None,str
        'src1': None, #None,str
        'dst1': None, #None,str
        'promotion': None, #None,str
    }
    args = cmd.strip().split(',') #a2b2,c3  a2,b2  e1h1,g1f1  a2,a3,0
    if len(args)==3:
        if not args[2] in '01':
            raise QChessInvalidCommand(f'invalid command="{cmd}"')
        ret['prefix_measure'] = int(args[2])
        args = args[:2]
    if (len(args)!=2) or ((len(args[0]),len(args[1])) not in {(2,2),(2,3),(2,4),(4,2),(4,4)}):
        raise QChessInvalidCommand(f'invalid command="{cmd}"')
    ret['src'] = args[0][:2]
    ret['dst'] = args[1][:2]
    if len(args[0])==4:
        ret['src1'] = args[0][2:]
    if len(args[1])==4:
        ret['dst1'] = args[1][2:]
    elif len(args[1])==3:
        tmp0 = args[1][2]
        if tmp0.isupper():
            print('API-change-WARNING: promotion must be lower case')
            tmp0 = tmp0.lower()
        if tmp0 not in 'qrbn':
            raise QChessInvalidCommand(f'invalid command="{cmd}"')
        ret['promotion'] = tmp0
    return ret


_short_help_message = 'hint: ":quit", ":help", ":random", ":undo", '
_long_help_message = '''
:quit     quit
:help     help
:undo     undo
:random   random move
:set-M0   set prefix measure to 0
:set-M1   set prefix measure to 1
:unset-M  unset prefix measure
:undo     undo
:print    print
e2,e3     move from e2 to e3
b2,a3c3   split from b2 to a3 and c3
a3c3,b2   merge from a3 and c3 to b2
'''

def _run_QChessGame_player(game, config, split_probability_weight):
    if config['prefix_M'] is not None:
        game.set_prefix_measure(config['prefix_M'])
    all_move = game.get_all_available_move()
    str_is_white = 'white' if game.is_white else 'black'
    assert len(all_move)>0, 'something must be wrong, no move available'
    tmp0 = '' if (config['prefix_M'] is None) else (' [M0]' if (config['prefix_M']==0) else ' [M1]')
    while True:
        print(_short_help_message + f'"{game.rng.choice(all_move)}"{tmp0}')
        cmd = input(f'cmd({str_is_white})> ').strip()
        if cmd==':quit':
            config['quit'] = True
            break
        elif cmd==':help':
            print(_long_help_message)
            continue
        elif cmd==':print':
            print(game)
            continue
        elif cmd==':random':
            game.random_move(split_probability_weight, all_move=all_move)
            print(f'player({str_is_white}) move (random):', game.history[-1])
            print(game)
            break
        elif cmd==':set-M0':
            config['prefix_M'] = 0
            continue
        elif cmd==':set-M1':
            config['prefix_M'] = 1
            continue
        elif cmd==':unset-M':
            config['prefix_M'] = None
            continue
        elif cmd==':undo':
            # if pvp, revert 1 step
            # if pvc or cvp, revert 2 step
            tmp0 = 1 if (config['mode']=='pvp') else 2
            game.revert_cmd(tmp0)
            print(game)
            break
        elif cmd.startswith(':'):
            print('invalid command')
            continue
        elif (len(cmd) in (5,7,9)) and (',' in cmd) and (tuple(len(x) for x in cmd.split(',')) in {(2,2),(2,4),(4,2),(4,4)}):
            tmp0,tmp1 = cmd.split(',')
            try:
                src = ChessPosition(tmp0[:2])
                if len(tmp0)==4:
                    ChessPosition(tmp0[2:])
                dst = ChessPosition(tmp1[:2])
                if len(tmp1)==4:
                    ChessPosition(tmp1[2:])
            except QChessInvalidCommand:
                print('invalid command')
                continue
            if cmd not in game._get_all_available_move_i(src):
                print('invalid command')
                continue
            game.run_short_cmd(cmd, tag_print=False)
            print(f'player({str_is_white}) move:', game.history[-1])
            print(game)
            break
        else:
            print('invalid command')
            continue


def run_QChessGame(game, mode, split_probability_weight, ai_delay, max_cvc_step):
    game._reset()
    print(game)
    config = {'prefix_M':None, 'quit':False, 'mode':mode, 'ai-delay':ai_delay, 'max_cvc_step':max_cvc_step}
    while True:
        if (game.is_white and config['mode'] in {'pvp','pvc'}) or (config['mode']=='pvp'):
            _run_QChessGame_player(game, config, split_probability_weight)
            if config['quit']:
                break
        else:
            time.sleep(config['ai-delay'])
            game.random_move(split_probability_weight)
            print('computer move:', game.history[-1])
            print(game)
        tag = game.is_finish_or_not()
        if tag=='white':
            print('white win')
            break
        elif tag=='black':
            print('black win')
            break
        elif tag=='draw':
            print('draw')
            break
        if (config['mode']=='cvc') and (game.current_step>=config['max_cvc_step']):
            print('cvc max step reached')
            break


def hf_weird_split_slide(dst1, dst2, path1, path2):
    path1 = {int(x) for x in path1}
    path2 = {int(x) for x in path2}
    assert (dst1 not in path1) and (dst2 not in path2)
    if dst2 in path1:
        path1.remove(dst2)
    if dst1 in path2:
        path2.remove(dst1)
    path1 = sorted(path1)
    path2 = sorted(path2)
    return sorted(path1), sorted(path2)


def hf_weird_merge_slide(src1, src2, path1, path2):
    path1 = {int(x) for x in path1}
    path2 = {int(x) for x in path2}
    assert (src1 not in path1) and (src2 not in path2)
    if src2 in path1:
        path1.remove(src2)
    if src1 in path2:
        path2.remove(src1)
    path1 = sorted(path1)
    path2 = sorted(path2)
    return sorted(path1), sorted(path2)
