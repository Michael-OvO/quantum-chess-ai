# GYM/RL workspace

## gym.env design guide

**action space** $\mathcal{A}=\mathbb{Z}_9^8\times \mathbb{Z}_5$

for action $x\in\mathcal{A}$

1. $x$ has 9 components $(x_0x_1,x_2x_3,x_4x_5,x_6x_7,x_8)$
2. the first 8 components represent 4 positions on the board
3. the last component represents the potential promotion type: `?rnbq->01234`
4. the integer $0$ is reserved for "filler", for example, if no promotion, $x_8=0$

| type | command | encoding |
| :-: | :-: | :-: |
| move | `a2,b2` | `(1,2,0,0,2,2,0,0,0)` |
| merge | `a2b2,c3` | `(1,2,2,2,3,3,0,0,0)` |
| split | `c3,a2b2` | `(3,3,0,0,1,2,2,2,0)` |
| castling | `e1h1,g1f1` | `(5,1,8,1,7,1,6,1,0)` |
| promotion | `a7,a8q` | `(1,7,0,0,1,8,0,0,4)` |

**state space** $\mathcal{S}=\mathbb{R}^{8\times 8\times 8\times 8}\times\mathbb{Z}_2^{8\times 8}\times\mathbb{Z}_7^{8\times 8}$

for state $(x,y,z)\in\mathcal{S}$

1. $(x,y,z)$ CANNOT fully recover the board state (wave function not available)
2. indexing $(ij)$ is from $(0,0)$ to $(7,7)$
   * `a3` is $(2,0)$
3. $x_{ijkl}\in [0,1]$ represents the probability of both $(ij)$ and $(kl)$ being occupied
   * $0$ for empty, $1$ for occupied
   * $x_{ijij}$ represents the probability of $(ij)$ being occupied
4. $y_{ij}\in \{0,1\}$: $0$ for white, $1$ for black
   * when $z_{ij}=0$, $y_{ij}=0$
5. $z_{ij}\in \{0,1,2,3,4,5,6\}$
   * $0$ for no piece
   * $1$ for king
   * $2$ for queen
   * $3$ for bishop
   * $4$ for knight
   * $5$ for rook
   * $6$ for pawn
