# quantum chess

1. link
   * [wiki/GNU-chess](https://en.wikipedia.org/wiki/GNU_Chess)
   * [wiki/chess-symbols-in-unicode](https://en.wikipedia.org/wiki/Chess_symbols_in_Unicode)
   * [wiki/algebraic-notation-chess](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))
   * [PixiJS](https://pixijs.com/)
   * [quantum-chess-web](https://quantumchess.net/)
   * [stackoverflow-link](https://stackoverflow.com/a/21924519/7290857) How get ASCII characters similar to output of the linux command 'tree'?
   * FEN: Forsyth–Edwards Notation
   * [quantum-chess-website](https://quantumchess.net/)
   * [cirq/quantum-chess-tutorial](https://quantumai.google/cirq/experiments/unitary/quantum_chess) [github/google/unitary](https://github.com/quantumlib/unitary)
   * [arxiv-link](https://arxiv.org/abs/1906.05836) Quantum Chess: Developing a Mathematical Framework and Design Methodology for Creating Quantum Games
   * [github-link](https://github.com/healeycodes/andoma/tree/main) A chess engine

```text
file: a b c d e f g h
rank: 1 2 3 4 5 6 7 8

Be5: bishop to e5
Nf3: knight to f3
c5: pawn to c5

K: king
Q: queen
B: bishop
R: rook
N: knight

upper case: white
lower case: black

white first
```

## terminology

traditional chess

1. chess 国际象棋
2. check 将军
3. checkmate 将死
4. king 国王
5. queen 女王
6. bishop 主教
7. knight 骑士
8. rook 车
9. paws 兵
10. castling 王车易位
11. capture 吃子
12. square 格子
13. pawn promotion 兵升变
14. algebraic notation 代数记谱法 [wiki-link](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))

quantum chess

1. no double occupancy rule 无双占位规则
2. split move 分裂移动
3. merge move 合并移动
4. measurement 测量

## rules

1. movement
2. no check rule: any rules in traditional chess that require the king to be in a safe position are removed
3. no double occupancy rule: no square can be occupied by more than one distinct piece at a time
4. pawn behavior: no split move, no merge move
5. measurement: move, capture
6. split move
7. merge move

```bash
## for development
micromamba create -y -n env-qchess
micromamba install -y -n env-qchess cython ipython pytest "numpy<2.0" matplotlib pylint scipy tqdm pygame
pip install gymnasium==1.0.0a2

## for production, pygame is optional (if you want to use GUI)
micromamba create -y -n env-qchess
micromamba install -y -n env-qchess pytest "numpy<2.0"
# micromamba install -y -n env-qchess pytest "numpy<2.0" pygame

## deprecated environment
# micromamba create -y -n env-cirq
# micromamba install -y -n env-cirq cython ipython pytest matplotlib h5py pandas pylint jupyterlab pillow protobuf scipy requests tqdm lxml opt_einsum
# micromamba activate env-cirq
# pip install cirq #conda-forge/macOS/pytorch is broken
# pip install git+https://github.com/quantumlib/unitary
```

```text
           ───────────────────────────────
        8 | R | N | B | Q | K | B | N | R |
        7 | P | P | P | P | P | P | P | P |  black
        6 |   |   |   |   |   |   |   |   |
        5 |   |   |   |   |   |   |   |   |
        4 |   |   |   |   |   |   |   |   |
        3 |   |   |   |   |   |   |   |   |
        2 | P | P | P | P | P | P | P | P |  white
        1 | R | N | B | Q | K | B | N | R |
           ───────────────────────────────
          | a | b | c | d | e | f | g | h |
type ":quit" to quit, ":help" for detailed help, "Be3" to move bishop to e3
cmd(white)> :quit

       ───────────────────────────────────────────────────────
    8 | ·    | ·    | ·    | ·    | ·    | ·    | ·    | ·    |
    7 | ·    | ·    | ·    | ·    | ·    | ·    | ·    | ·    |
    6 | ·    | ·    | ·    | ·    | ·    | ·    | ·    | ·    |
    5 | ·    | R.5  | ·    | R.5  | ·    | ·    | ·    | ·    |
    4 | ·    | ·    | ·    | R.5  | ·    | ·    | ·    | ·    |
    3 | ·    | ·    | R.5  | ·    | ·    | ·    | ·    | ·    |
    2 | ·    | ·    | ·    | ·    | ·    | ·    | ·    | ·    |
    1 | ·    | ·    | ·    | ·    | ·    | ·    | ·    | ·    |
       ───────────────────────────────────────────────────────
      | a    | b    | c    | d    | e    | f    | g    | h    |
```

install

```bash
pip install -e .
```

quick start

```bash
qchess
qchess pvp
qchess pvc
qchess cvp
qchess cvc --max-cvc-step=100 --ai-delay=0.01
qchess pvc --history=game00.txt

qchess-gui
qchess-gui --help
qchess-gui pvc
qchess-gui cvp
qchess-gui pvp
# load history
qchess-gui pvc --history=game00.txt
```

```bash
python draft00.py
```

run unittest

```bash
pytest
```

ui demo

1. use package: pygame
2. click left mouse button to select; click right mouse button to comfirm

TODO

1. [x] add classic chess rule: en passant, promotion, castling
2. [x] list all possible moves (for Reinforcement Learning)
3. [x] more unittests, compare with steam-game, compare with paper
4. [x] GUI: introduce functionalities like "redo" and "restart"
