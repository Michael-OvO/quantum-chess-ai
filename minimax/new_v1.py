import numpy as np
import copy
import time
import traceback
from python.qchess.gym import game_to_observable


class QuantumChessAI:
    def __init__(self, max_depth=4, player_color='white'):
        self.max_depth = max_depth
        self.player_color = player_color
        self.is_white = player_color == 'white'

        # Classical piece values
        self.piece_values = {
            'p': 1, 'P': 1,  # Pawns
            'n': 3, 'N': 3,  # Knights
            'b': 3, 'B': 3,  # Bishops
            'r': 5, 'R': 5,  # Rooks
            'q': 9, 'Q': 9,  # Queens
            'k': 100, 'K': 100  # Kings
        }

        # Position bonuses - encourage center control
        self.position_bonus = np.array([
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
            [0.0, 0.1, 0.3, 0.3, 0.3, 0.3, 0.1, 0.0],
            [0.0, 0.1, 0.3, 0.5, 0.5, 0.3, 0.1, 0.0],
            [0.0, 0.1, 0.3, 0.5, 0.5, 0.3, 0.1, 0.0],
            [0.0, 0.1, 0.3, 0.3, 0.3, 0.3, 0.1, 0.0],
            [0.0, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        ])

        # Pawn structure bonus - encourages connected pawns
        self.pawn_structure_bonus = 0.2

        # Mobility bonus - encourages piece development
        self.mobility_bonus = 0.1

        # Check bonus
        self.check_bonus = 5.0
        self.checkmate_bonus = 1000.0

        # Quantum-specific weights
        self.quantum_opportunity_weight = 0.5  # Value of quantum opportunities

        # Transposition table
        self.tt = {}

        # Move ordering heuristics
        self.killer_moves = [None] * 10  # Store killer moves for each depth
        self.history_table = {}  # Store history heuristic scores

        # Statistics
        self.nodes_evaluated = 0
        self.pruning_count = 0
        self.tt_hits = 0

    def get_move(self, game):
        """Find the best move for the current game state."""
        try:
            self.nodes_evaluated = 0
            self.pruning_count = 0
            self.tt_hits = 0

            # Get available moves
            available_moves = game.get_all_available_move()
            if not available_moves:
                return None

            if len(available_moves) == 1:
                return available_moves[0]

            # Updated to represent player's perspective
            is_maximizing = game.is_white == self.is_white

            # Use iterative deepening
            best_move = available_moves[0]  # Default to first move
            best_value = float('-inf') if is_maximizing else float('inf')

            # Iterative deepening
            for depth in range(1, self.max_depth + 1):
                # print(f"Searching at depth {depth}...")
                start_time = time.time()

                # Alpha-beta bounds
                alpha = float('-inf')
                beta = float('inf')

                if is_maximizing:
                    value, move = self._maximize(game, depth, alpha, beta)
                else:
                    value, move = self._minimize(game, depth, alpha, beta)

                # Update best move if we finished this depth
                if move is not None:
                    best_move = move
                    best_value = value

                end_time = time.time()
                elapsed = end_time - start_time

                # print(f"Depth {depth} completed in {elapsed:.2f}s, best move: {best_move}, value: {best_value}")

                # If we found a winning move or took too long, stop
                if abs(best_value) > 900 or elapsed > 5.0:  # Winning move or time limit
                    break

            # print(f"Evaluated {self.nodes_evaluated} nodes, {self.pruning_count} prunings, {self.tt_hits} tt hits")
            return best_move
        except Exception as e:
            print(f"Error in get_move: {e}")
            traceback.print_exc()
            # Return a random valid move as fallback
            available_moves = game.get_all_available_move()
            return available_moves[0] if available_moves else None

    def _maximize(self, game, depth, alpha, beta):
        """Maximizing player in minimax search."""
        # Check for terminal states
        if depth == 0:
            return self._evaluate_quantum_state(game), None

        outcome = game.is_finish_or_not()
        if outcome != 'continue':
            if outcome == 'white' and self.is_white:
                return 1000, None  # Win for maximizing player
            elif outcome == 'black' and not self.is_white:
                return 1000, None  # Win for maximizing player
            elif outcome == 'draw':
                return 0, None  # Draw
            else:
                return -1000, None  # Loss for maximizing player

        # Get and order moves
        available_moves = self._order_moves(game, game.get_all_available_move(), depth)

        best_move = None
        best_value = float('-inf')

        # Check transposition table
        state_hash = self._get_state_hash(game)
        tt_entry = self.tt.get((state_hash, depth, True))
        if tt_entry is not None:
            self.tt_hits += 1
            value, move = tt_entry

            # If this is an exact score, return it
            if value > alpha and value < beta:
                return value, move

            # Otherwise use it to improve alpha/beta bounds
            if value >= beta:
                return value, move
            if value > alpha:
                alpha = value
                best_move = move
                best_value = value

        # Explore moves
        for move in available_moves:
            self.nodes_evaluated += 1

            # Apply move
            try:
                game_copy = copy.deepcopy(game)
                game_copy.run_short_cmd(move, tag_print=False)

                # Quantum moves introduce probability branching
                if self._is_quantum_move(move):
                    # Take expected value of outcomes for quantum moves
                    value = self._evaluate_quantum_outcomes(game_copy, depth)
                else:
                    # Regular minimax for classical moves
                    value, _ = self._minimize(game_copy, depth - 1, alpha, beta)

                # Update best move
                if value > best_value:
                    best_value = value
                    best_move = move

                # Alpha-beta pruning
                alpha = max(alpha, best_value)
                if beta <= alpha:
                    self.pruning_count += 1
                    if best_move is not None:
                        self._update_killer_move(best_move, depth)
                    break

            except Exception as e:
                # Skip invalid moves
                print(f"Error applying move {move}: {e}")
                continue

        # Store in transposition table
        if best_move is not None:
            self.tt[(state_hash, depth, True)] = (best_value, best_move)
            self._update_history_table(best_move, depth)

        return best_value, best_move

    def _minimize(self, game, depth, alpha, beta):
        """Minimizing player in minimax search."""
        # Check for terminal states
        if depth == 0:
            return self._evaluate_quantum_state(game), None

        outcome = game.is_finish_or_not()
        if outcome != 'continue':
            if outcome == 'white' and not self.is_white:
                return -1000, None  # Win for minimizing player (loss for max)
            elif outcome == 'black' and self.is_white:
                return -1000, None  # Win for minimizing player (loss for max)
            elif outcome == 'draw':
                return 0, None  # Draw
            else:
                return 1000, None  # Loss for minimizing player (win for max)

        # Get and order moves
        available_moves = self._order_moves(game, game.get_all_available_move(), depth)

        best_move = None
        best_value = float('inf')

        # Check transposition table
        state_hash = self._get_state_hash(game)
        tt_entry = self.tt.get((state_hash, depth, False))
        if tt_entry is not None:
            self.tt_hits += 1
            value, move = tt_entry

            # If this is an exact score, return it
            if value > alpha and value < beta:
                return value, move

            # Otherwise use it to improve alpha/beta bounds
            if value <= alpha:
                return value, move
            if value < beta:
                beta = value
                best_move = move
                best_value = value

        # Explore moves
        for move in available_moves:
            self.nodes_evaluated += 1

            # Apply move
            try:
                game_copy = copy.deepcopy(game)
                game_copy.run_short_cmd(move, tag_print=False)

                # Quantum moves introduce probability branching
                if self._is_quantum_move(move):
                    # Take expected value of outcomes for quantum moves
                    value = self._evaluate_quantum_outcomes(game_copy, depth)
                else:
                    # Regular minimax for classical moves
                    value, _ = self._maximize(game_copy, depth - 1, alpha, beta)

                # Update best move
                if value < best_value:
                    best_value = value
                    best_move = move

                # Alpha-beta pruning
                beta = min(beta, best_value)
                if beta <= alpha:
                    self.pruning_count += 1
                    if best_move is not None:
                        self._update_killer_move(best_move, depth)
                    break

            except Exception as e:
                # Skip invalid moves
                print(f"Error applying move {move}: {e}")
                continue

        # Store in transposition table
        if best_move is not None:
            self.tt[(state_hash, depth, False)] = (best_value, best_move)
            self._update_history_table(best_move, depth)

        return best_value, best_move

    def _evaluate_quantum_outcomes(self, game, depth):
        """
        Evaluate the expected value of quantum states by calculating
        probabilities of different outcomes.
        """
        # Get state information
        try:
            correlation, tag_white, piece_kind = game_to_observable(game)

            # For quantum moves, evaluate current state but with
            # increased depth to account for the branching factor
            if depth > 1:
                is_maximizing = game.is_white == self.is_white
                if is_maximizing:
                    value, _ = self._minimize(game, depth - 1, float('-inf'), float('inf'))
                else:
                    value, _ = self._maximize(game, depth - 1, float('-inf'), float('inf'))
                return value
            else:
                # At depth 0, just evaluate the state directly
                return self._evaluate_quantum_state(game)
        except Exception as e:
            print(f"Error in quantum evaluation: {e}")
            return self._evaluate_quantum_state(game)

    def _evaluate_quantum_state(self, game):
        """
        Evaluate a quantum chess state as a weighted sum of classical
        positions based on probabilities.
        """
        # Get quantum state
        try:
            correlation, tag_white, piece_kind = game_to_observable(game)
            correlation_flat = correlation.reshape(64, 64)
            diag_probs = np.diag(correlation_flat)

            # Initialize evaluation components
            material_score = 0
            position_score = 0
            mobility_score = 0
            pawn_structure_score = 0
            check_score = 0

            # 1. Material evaluation with probabilities
            for i in range(64):
                if i >= len(diag_probs):
                    continue

                prob = diag_probs[i]
                if prob < 0.01:  # Ignore very low probabilities
                    continue

                if i >= len(piece_kind.flatten()) or i >= len(tag_white.flatten()):
                    continue

                piece_type = piece_kind.flatten()[i]
                is_white_piece = tag_white.flatten()[i] == 0

                if piece_type > 0:
                    # Map piece type to value
                    piece_value_map = [0, 100, 9, 3, 3, 5, 1]  # King, Queen, Bishop, Knight, Rook, Pawn
                    piece_value = piece_value_map[piece_type]

                    # Add material score with probability
                    material_factor = 1 if (is_white_piece == self.is_white) else -1
                    material_score += material_factor * piece_value * prob

                    # 2. Position bonus based on piece placement
                    row, col = i // 8, i % 8
                    position_bonus = self.position_bonus[row, col]
                    position_score += material_factor * position_bonus * prob

                    # 3. Pawn structure bonus for connected pawns
                    if piece_type == 6:  # Pawn
                        pawn_structure_score += self._evaluate_pawn_structure(game, row, col, is_white_piece) * prob

            # 4. Mobility evaluation - number of legal moves
            mobility_score = self._evaluate_mobility(game)

            # 5. Check and checkmate evaluation (disabled for quantum chess)
            check_score = 0  # No check rule in quantum chess

            # 6. Quantum opportunity bonus
            quantum_opportunity = self._evaluate_quantum_opportunities(game)

            # Combine all scores with weights
            total_score = (
                    material_score +
                    0.3 * position_score +
                    self.mobility_bonus * mobility_score +
                    self.pawn_structure_bonus * pawn_structure_score +
                    check_score +
                    self.quantum_opportunity_weight * quantum_opportunity
            )

            # Adjust sign based on player's perspective
            return total_score

        except Exception as e:
            print(f"Error in evaluation: {e}")
            # Fall back to a basic material count
            return self._basic_material_count(game)

    def _basic_material_count(self, game):
        """Simple material count as fallback."""
        white_material = 0
        black_material = 0

        try:
            for i, piece in enumerate(game.sim.pos2tag[:64]):
                if piece is None:
                    continue

                value = self.piece_values.get(piece, 0)
                if piece.isupper():  # White piece
                    white_material += value
                else:  # Black piece
                    black_material += value

            # Return from the perspective of the current player
            if self.is_white:
                return white_material - black_material
            else:
                return black_material - white_material
        except:
            return 0  # Complete fallback

    def _evaluate_mobility(self, game):
        """Evaluate piece mobility (number of legal moves)."""
        try:
            # Store original turn
            original_is_white = game.is_white

            # Get mobility for current player
            player_moves = len(game.get_all_available_move())

            # Switch turn to opponent
            game.is_white = not game.is_white
            opponent_moves = len(game.get_all_available_move())

            # Restore original turn
            game.is_white = original_is_white

            # Return mobility difference from player's perspective
            mobility_diff = player_moves - opponent_moves
            return mobility_diff
        except:
            return 0  # Fallback

    def _evaluate_pawn_structure(self, game, row, col, is_white_piece):
        """Evaluate pawn structure for connected pawns."""
        if not (0 <= row < 8 and 0 <= col < 8):
            return 0

        score = 0
        pawn_char = 'P' if is_white_piece else 'p'

        try:
            # Check if this pawn is supported by other pawns
            support_positions = []

            if is_white_piece:
                # White pawns are supported from rank below
                if row < 7:
                    if col > 0:  # Supported from below left
                        support_positions.append((row + 1, col - 1))
                    if col < 7:  # Supported from below right
                        support_positions.append((row + 1, col + 1))
            else:
                # Black pawns are supported from rank above
                if row > 0:
                    if col > 0:  # Supported from above left
                        support_positions.append((row - 1, col - 1))
                    if col < 7:  # Supported from above right
                        support_positions.append((row - 1, col + 1))

            # Check each support position
            for r, c in support_positions:
                pos = r * 8 + c
                if pos < len(game.sim.pos2tag) and game.sim.pos2tag[pos] == pawn_char:
                    score += 0.2  # Bonus for each supporting pawn

            # Advanced pawns are more valuable
            advancement = abs(3.5 - row) if is_white_piece else abs(row - 3.5)
            score += advancement * 0.1

            return score
        except:
            return 0  # Fallback

    def _evaluate_check_status(self, game):
        """Evaluate check and checkmate status."""
        # Quantum chess has no check rule, so return 0
        return 0

    def _evaluate_quantum_opportunities(self, game):
        """
        Evaluate opportunities for quantum moves based on superpositions
        and potential piece captures.
        """
        try:
            # Get quantum state
            correlation, tag_white, piece_kind = game_to_observable(game)
            correlation_flat = correlation.reshape(64, 64)

            # Identify superpositions
            superposition_value = 0

            # For each position pair
            for i in range(64):
                for j in range(i + 1, 64):  # Only consider unique pairs
                    corr_value = correlation_flat[i, j]

                    # If there's meaningful superposition
                    if corr_value > 0.05:
                        # Get piece information
                        if i < len(piece_kind.flatten()) and j < len(piece_kind.flatten()):
                            piece_i_type = piece_kind.flatten()[i]
                            piece_j_type = piece_kind.flatten()[j]

                            if i < len(tag_white.flatten()) and j < len(tag_white.flatten()):
                                is_i_white = tag_white.flatten()[i] == 0
                                is_j_white = tag_white.flatten()[j] == 0

                                # If both pieces are of the same player (superposition of own pieces)
                                if is_i_white == is_j_white:
                                    # Value of the superposition is higher for higher value pieces
                                    if piece_i_type > 0 and piece_j_type > 0:
                                        piece_value_map = [0, 100, 9, 3, 3, 5, 1]
                                        piece_i_value = piece_value_map[piece_i_type]
                                        piece_j_value = piece_value_map[piece_j_type]

                                        # Superposition value depends on piece values
                                        value = (piece_i_value + piece_j_value) * 0.1 * corr_value

                                        # Adjust sign based on player's perspective
                                        if is_i_white == self.is_white:
                                            superposition_value += value
                                        else:
                                            superposition_value -= value

            return superposition_value
        except:
            return 0  # Fallback

    def _is_quantum_move(self, move):
        """Determine if a move is a quantum move."""
        # Check for merge, split, or other quantum operations
        return '+' in move or '->' in move or 'merge' in move or 'split' in move

    def _get_state_hash(self, game):
        """Generate a simple hash for the transposition table."""
        try:
            # Create a board representation
            board_str = ''.join([p if p else '.' for p in game.sim.pos2tag[:64]])

            # Include turn information
            turn = 'w' if game.is_white else 'b'

            # Return a hash
            return hash(f"{board_str}_{turn}")
        except:
            # Fallback to a simple unique identifier
            return hash(f"{game.current_step}_{game.is_white}")

    def _order_moves(self, game, moves, depth):
        """Order moves to improve alpha-beta pruning efficiency."""
        # Score the moves
        move_scores = []

        for move in moves:
            score = 0

            # 1. Killer move heuristic
            if move == self.killer_moves[depth] and self.killer_moves[depth] is not None:
                score += 10000

            # 2. History heuristic
            history_score = self.history_table.get(move, 0)
            score += history_score

            # 3. Captures
            if self._is_capture(game, move):
                score += 1000

                # MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
                victim_value = self._get_victim_value(game, move)
                attacker_value = self._get_attacker_value(game, move)

                if victim_value > 0 and attacker_value > 0:
                    score += victim_value * 100 - attacker_value

            # 4. Quantum moves get a bonus
            if self._is_quantum_move(move):
                score += 500

            # 5. Checks get a bonus (disabled for quantum chess)
            # Quantum chess has no check rule

            move_scores.append((move, score))

        # Sort by score (highest first)
        move_scores.sort(key=lambda x: x[1], reverse=True)

        # Return sorted moves
        return [move for move, _ in move_scores]

    def _is_capture(self, game, move):
        """Check if a move is a capture."""
        try:
            # Parse the move string
            parts = move.split(',')
            if len(parts) != 2:
                return False

            src, dst = parts

            # Get destination square info
            dst_col = ord(dst[0].lower()) - ord('a')
            dst_row = 8 - int(dst[1])

            if not (0 <= dst_row < 8 and 0 <= dst_col < 8):
                return False

            dst_pos = dst_row * 8 + dst_col

            # Check if there's a piece at the destination
            return dst_pos < len(game.sim.pos2tag) and game.sim.pos2tag[dst_pos] is not None
        except:
            return False

    def _get_victim_value(self, game, move):
        """Get the value of the captured piece."""
        try:
            # Parse the move string
            parts = move.split(',')
            if len(parts) != 2:
                return 0

            _, dst = parts

            # Get destination square info
            dst_col = ord(dst[0].lower()) - ord('a')
            dst_row = 8 - int(dst[1])

            if not (0 <= dst_row < 8 and 0 <= dst_col < 8):
                return 0

            dst_pos = dst_row * 8 + dst_col

            # Get the piece at the destination
            if dst_pos < len(game.sim.pos2tag) and game.sim.pos2tag[dst_pos] is not None:
                return self.piece_values.get(game.sim.pos2tag[dst_pos], 0)
            return 0
        except:
            return 0

    def _get_attacker_value(self, game, move):
        """Get the value of the attacking piece."""
        try:
            # Parse the move string
            parts = move.split(',')
            if len(parts) != 2:
                return 0

            src, _ = parts

            # Get source square info
            src_col = ord(src[0].lower()) - ord('a')
            src_row = 8 - int(src[1])

            if not (0 <= src_row < 8 and 0 <= src_col < 8):
                return 0

            src_pos = src_row * 8 + src_col

            # Get the piece at the source
            if src_pos < len(game.sim.pos2tag) and game.sim.pos2tag[src_pos] is not None:
                return self.piece_values.get(game.sim.pos2tag[src_pos], 0)
            return 0
        except:
            return 0

    def _gives_check(self, game, move):
        """Check if a move gives check to the opponent."""
        # Quantum chess has no check rule
        return False

    def _update_killer_move(self, move, depth):
        """Update the killer move for a given depth."""
        if 0 <= depth < len(self.killer_moves):
            self.killer_moves[depth] = move

    def _update_history_table(self, move, depth):
        """Update the history table for a given move."""
        # Update history score - squares of depth works well
        current_score = self.history_table.get(move, 0)
        self.history_table[move] = current_score + depth * depth