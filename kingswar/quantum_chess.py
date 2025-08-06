from qiskit import *
from qiskit.circuit.library.standard_gates import *
import board
import piece

class QuantumChess:
    """
    A quantum chessboard.
    """

    def __init__(self):
        self.qur = QuantumRegister(20, name="board")
        self.captured = QuantumRegister(10, name="captured")
        self.captured_index = 0
        self.path = QuantumRegister(10, name="path")
        self.cr = ClassicalRegister(20)
        self.qc = QuantumCircuit(self.qur, self.captured, self.path, self.cr)

        self.qc.x(self.qur[0])
        self.qc.x(self.qur[6])
        self.qc.x(self.qur[9])
        # self.qc.x(self.qur[13])
        # self.qc.x(self.qur[19])

    def get_captured(self):
        self.captured_index += 1
        return self.captured[self.captured_index-1]

    def king_jump_blocked(self, source, target):
        self.qc.barrier()
        self.qc.measure(target, 0)
        self.qc.iswap(source, target).c_if(self.cr[0], 0)
    def king_jump_capture(self, source, target):
        self.qc.barrier()
        self.qc.measure(source, 0)
        self.qc.iswap(target, self.get_captured()).c_if(self.cr[0], 1)
        self.qc.iswap(source, target).c_if(self.cr[0], 1)
    def king_split(self, source, target_1, target_2):
        self.qc.barrier()
        self.qc.append(iSwapGate().power(1/2), [target_1, source])
        self.qc.iswap(source, target_2)
    def king_merge(self, source_1, source_2, target):
        self.qc.barrier()
        self.qc.iswap(target, source_2)
        self.qc.append(iSwapGate().power(1/2), [source_1, target])

    def _rook_path(self, source, target):
        if source // 5 == target // 5: # same column
            return list(range(source+1, target))
        elif source % 5 == target % 5: # same row
            return list(range(source+5, target, 5))
        else:
            raise "Invalid rook movement"

    def rook_slide_blocked(self, source, target):
        path = self._rook_path(source, target)
        self.qc.barrier()
        self.qc.x(path)
        self.qc.measure(target, 0)
        self.qc.append(iSwapGate().control(len(path)), path + [source, target]).c_if(self.cr[0], 0)
        self.qc.x(path)
    def rook_slide_capture(self, source, target):
        path = self._rook_path(source, target)
        path_ancilla = self.path[0]
        measure_ancilla = self.path[1]
        self.qc.barrier()
        self.qc.x(path)
        self.qc.append(MCXGate(len(path)), path + [path_ancilla])
        self.qc.x(path)
        self.qc.ccx(path_ancilla, source, measure_ancilla)
        self.qc.x(path_ancilla)
        self.qc.x(target)
        self.qc.ccx(path_ancilla, target, measure_ancilla)
        self.qc.x(target)
        self.qc.x(path_ancilla)
        self.qc.measure(measure_ancilla, 0)

        self.qc.append(iSwapGate().control(), [path_ancilla, target, self.get_captured()]).c_if(self.cr[0], 1)
        self.qc.append(iSwapGate().control(), [path_ancilla, source, target]).c_if(self.cr[0], 1)

if __name__ == "__main__":
    sim = Aer.get_backend("aer_simulator")
    qchess = QuantumChess()
    qchess.king_jump_blocked(0, 1)
    qchess.king_split(1, 2, 7)
    qchess.rook_slide_capture(6, 9)
    print(qchess.qc.draw())
    qchess.qc.measure(qchess.qur, qchess.cr)
    qobj = transpile(qchess.qc, sim)
    result = sim.run(qobj, shots=2).result()
    print(result.get_counts())
