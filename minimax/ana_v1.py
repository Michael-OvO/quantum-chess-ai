print("Starting ana_v1_fixed.py...")
import os
import sys
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import time
import random
import json
import copy
import traceback

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python.qchess.chess_utils import QChessGame
from python.qchess.ai import get_greedy_move, evaluate_board
from python.qchess.gym import game_to_observable

# Import the QuantumChessAI we defined
from new_v1 import QuantumChessAI

class ChessAIAnalyzer:
    """Class for analyzing performance of Quantum Chess AI algorithms."""

    def __init__(self, output_dir="analysis_results"):
        """Initialize the analyzer."""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(os.path.join(output_dir, "figures"), exist_ok=True)
        os.makedirs(os.path.join(output_dir, "games"), exist_ok=True)

        # Statistics to track
        self.quantum_move_types = ["merge", "split", "+", "->"]

    def run_comparison(self, num_games=10, max_moves=100, max_depth=4):
        """Run a comparison between QuantumChessAI and built-in Greedy."""
        print(f"Starting comparison: QuantumChessAI vs Built-in Greedy ({num_games} games)")

        all_results = []

        # Create our AI with faster settings
        quantum_ai = QuantumChessAI(max_depth=max_depth)

        # Run games with alternating colors
        for game_num in range(num_games):
            print(f"\nPlaying game {game_num + 1} of {num_games}...")
            # Determine player colors for this game
            if game_num % 2 == 0:
                # QuantumChessAI plays white
                quantum_ai.player_color = 'white'
                quantum_ai.is_white = True
                white_player = "QuantumChessAI"
                black_player = "GreedyAI"
            else:
                # QuantumChessAI plays black
                quantum_ai.player_color = 'black'
                quantum_ai.is_white = False
                white_player = "GreedyAI"
                black_player = "QuantumChessAI"

            # Play a single game
            try:
                print(f"Starting game with {white_player} (white) vs {black_player} (black)")
                game_result = self._play_single_game(
                    quantum_ai, game_num, max_moves,
                    white_player, black_player
                )
                all_results.append(game_result)
                print(f"Game {game_num + 1} completed")
            except Exception as e:
                print(f"Error in game {game_num}: {e}")
                traceback.print_exc()

        # Analyze the results
        if all_results:
            self._analyze_results(all_results)

        return all_results

    def _play_single_game(self, quantum_ai, game_num, max_moves, white_player, black_player):
        """Play a single game between QuantumChessAI and Greedy."""
        print("_play_single_game called")
        
        # Initialize game
        game = QChessGame()
        print(f"Game initialized. White to move: {game.is_white}")

        # Game data structure
        game_data = {
            'game_num': game_num,
            'moves': [],
            'white_player': white_player,
            'black_player': black_player,
            'outcome': None,
            'total_moves': 0,
            'material_balance': [],
            'quantum_ai_is_white': (white_player == "QuantumChessAI")
        }

        # Play the game
        for move_num in range(max_moves):
            # Record material balance
            material_balance = self._calculate_material_balance(game)
            game_data['material_balance'].append(material_balance)

            # Check if game is over
            outcome = game.is_finish_or_not()
            if outcome != 'continue':
                if outcome == 'white':
                    game_data['outcome'] = 'white_wins'
                elif outcome == 'black':
                    game_data['outcome'] = 'black_wins'
                elif outcome == 'draw':
                    game_data['outcome'] = 'draw'
                else:
                    game_data['outcome'] = 'unknown'

                game_data['total_moves'] = len(game_data['moves'])
                break

            # Get current player
            current_is_white = game.is_white
            current_player = white_player if current_is_white else black_player

            # Get move based on player
            if current_player == "QuantumChessAI":
                # Our AI's turn
                start_time = time.time()

                try:
                    move = quantum_ai.get_move(game)
                except Exception as e:
                    print(f"Error getting move from QuantumChessAI: {e}")
                    traceback.print_exc()

                    # Fall back to a random move
                    available_moves = game.get_all_available_move()
                    move = available_moves[0] if available_moves else None

                move_time = time.time() - start_time

                # Make the move
                if move is None or move not in game.get_all_available_move():
                    print(f"Invalid move from QuantumChessAI: {move}")

                    # Fall back to a random move
                    available_moves = game.get_all_available_move()
                    if not available_moves:
                        game_data['outcome'] = 'error'
                        game_data['total_moves'] = move_num
                        return game_data

                    move = random.choice(available_moves)

                # Record move data
                is_quantum = self._is_quantum_move(move)
                move_data = {
                    'move_num': move_num,
                    'player': 'white' if current_is_white else 'black',
                    'ai': "QuantumChessAI",
                    'move': move,
                    'time': move_time,
                    'is_quantum': is_quantum,
                    'material_balance': material_balance,
                    'nodes_evaluated': quantum_ai.nodes_evaluated,
                    'pruning_count': quantum_ai.pruning_count,
                    'tt_hits': quantum_ai.tt_hits
                }

                game_data['moves'].append(move_data)
                print(f"Game {game_num}, Move {len(game_data['moves'])}: QuantumChessAI ({current_player}) plays {move}")

            else:
                # Greedy AI's turn
                start_time = time.time()
                
                # Get greedy move
                try:
                    move = get_greedy_move(game, ver='v1')
                except Exception as e:
                    print(f"Error getting greedy move: {e}")
                    available_moves = game.get_all_available_move()
                    move = available_moves[0] if available_moves else None
                
                move_time = time.time() - start_time
                
                # Record move data
                is_quantum = self._is_quantum_move(move)
                move_data = {
                    'move_num': move_num,
                    'player': 'white' if current_is_white else 'black',
                    'ai': "GreedyAI",
                    'move': move,
                    'time': move_time,
                    'is_quantum': is_quantum,
                    'material_balance': material_balance,
                    'nodes_evaluated': 0,
                    'pruning_count': 0,
                    'tt_hits': 0
                }
                
                game_data['moves'].append(move_data)
                print(f"Game {game_num}, Move {len(game_data['moves'])}: GreedyAI ({current_player}) plays {move}")

            # Apply the move
            try:
                game.run_short_cmd(move, tag_print=False)
            except Exception as e:
                print(f"Error applying move {move}: {e}")
                game_data['outcome'] = 'error'
                game_data['total_moves'] = len(game_data['moves'])
                return game_data

        # If max moves reached
        if 'outcome' not in game_data or game_data['outcome'] is None:
            game_data['outcome'] = 'draw'
            game_data['total_moves'] = len(game_data['moves'])

        # Save game record
        self._save_game_record(game_data)

        return game_data

    def _calculate_material_balance(self, game):
        """Calculate material balance between white and black."""
        piece_values = {
            'p': 1, 'P': 1,  # Pawns
            'n': 3, 'N': 3,  # Knights
            'b': 3, 'B': 3,  # Bishops
            'r': 5, 'R': 5,  # Rooks
            'q': 9, 'Q': 9,  # Queens
            'k': 100, 'K': 100  # Kings
        }

        try:
            # Get quantum state
            correlation, tag_white, piece_kind = game_to_observable(game)
            correlation_flat = correlation.reshape(64, 64)
            diag_probs = np.diag(correlation_flat)

            white_material = 0
            black_material = 0

            # Calculate material with probabilities
            for i in range(64):
                if i >= len(diag_probs):
                    continue

                prob = diag_probs[i]

                if i >= len(piece_kind.flatten()) or i >= len(tag_white.flatten()):
                    continue

                piece_type = piece_kind.flatten()[i]
                is_white_piece = tag_white.flatten()[i] == 0

                if piece_type > 0 and prob > 0.01:
                    # Map piece type to value
                    piece_value_map = [0, 100, 9, 3, 3, 5, 1]  # King, Queen, Bishop, Knight, Rook, Pawn
                    piece_value = piece_value_map[piece_type]

                    # Add material based on color
                    if is_white_piece:
                        white_material += piece_value * prob
                    else:
                        black_material += piece_value * prob

            return white_material - black_material
        except Exception as e:
            print(f"Error calculating material: {e}")

            # Fallback to simpler calculation
            white_material = 0
            black_material = 0

            try:
                for i, piece in enumerate(game.sim.pos2tag[:64]):
                    if piece is None:
                        continue

                    value = piece_values.get(piece, 0)
                    if piece.isupper():  # White piece
                        white_material += value
                    else:  # Black piece
                        black_material += value

                return white_material - black_material
            except:
                return 0  # Complete fallback

    def _is_quantum_move(self, move):
        """Check if a move is a quantum move (includes split moves)."""
        if move is None or not isinstance(move, str) or move == "unknown":
            return False

        # Check for split moves: piece goes to multiple destinations (e.g., "b1,a3c3")
        parts = move.split(',')
        if len(parts) == 2 and len(parts[1]) > 2:
            return True
        
        # Check for other quantum move types
        return any(qt in move for qt in self.quantum_move_types)

    def _save_game_record(self, game_data):
        """Save a detailed record of the game."""
        game_num = game_data['game_num']
        filename = os.path.join(self.output_dir, "games", f"game_{game_num}.json")

        with open(filename, 'w') as f:
            json.dump(game_data, f, indent=2)

    def _analyze_results(self, all_results):
        """Analyze the results of all games."""
        print("\nAnalyzing results...")

        # Extract statistics
        quantum_ai_stats = self._extract_player_stats(all_results, "QuantumChessAI")
        greedy_ai_stats = self._extract_player_stats(all_results, "GreedyAI")

        # Generate summary
        summary = self._generate_summary(quantum_ai_stats, greedy_ai_stats)

        # Save summary
        with open(os.path.join(self.output_dir, "summary.json"), 'w') as f:
            json.dump(summary, f, indent=2)

        # Generate visualizations
        self._generate_visualizations(all_results, quantum_ai_stats, greedy_ai_stats)

        # Print summary to console
        self._print_summary(summary)

    def _extract_player_stats(self, all_results, player_name):
        """Extract statistics for a specific player."""
        stats = {
            'wins': 0,
            'losses': 0,
            'draws': 0,
            'total_games': 0,
            'total_moves': 0,
            'quantum_moves': 0,
            'classical_moves': 0,
            'avg_time_per_move': 0,
            'total_time': 0,
            'times': [],
            'nodes_evaluated': 0,
            'pruning_count': 0,
            'tt_hits': 0
        }

        # Calculate wins/losses
        for game in all_results:
            player_is_white = game['white_player'] == player_name
            player_is_black = game['black_player'] == player_name

            if game['outcome'] == 'white_wins' and player_is_white:
                stats['wins'] += 1
            elif game['outcome'] == 'black_wins' and player_is_black:
                stats['wins'] += 1
            elif game['outcome'] == 'white_wins' and player_is_black:
                stats['losses'] += 1
            elif game['outcome'] == 'black_wins' and player_is_white:
                stats['losses'] += 1
            elif game['outcome'] == 'draw':
                stats['draws'] += 1

        # Calculate move statistics
        for game in all_results:
            for move in game['moves']:
                if move['ai'] == player_name:
                    stats['total_moves'] += 1
                    stats['total_time'] += move['time']
                    stats['times'].append(move['time'])

                    if move['is_quantum']:
                        stats['quantum_moves'] += 1
                    else:
                        stats['classical_moves'] += 1

                    # Only QuantumChessAI has these stats
                    if player_name == "QuantumChessAI":
                        stats['nodes_evaluated'] += move.get('nodes_evaluated', 0)
                        stats['pruning_count'] += move.get('pruning_count', 0)
                        stats['tt_hits'] += move.get('tt_hits', 0)

        # Calculate derived statistics
        stats['total_games'] = stats['wins'] + stats['losses'] + stats['draws']

        if stats['total_moves'] > 0:
            stats['avg_time_per_move'] = stats['total_time'] / stats['total_moves']

        return stats

    def _generate_summary(self, quantum_ai_stats, greedy_ai_stats):
        """Generate a summary of the results."""
        # Calculate win percentages
        quantum_games = quantum_ai_stats['total_games']
        quantum_win_pct = (quantum_ai_stats['wins'] / quantum_games * 100) if quantum_games > 0 else 0

        greedy_games = greedy_ai_stats['total_games']
        greedy_win_pct = (greedy_ai_stats['wins'] / greedy_games * 100) if greedy_games > 0 else 0

        # Calculate quantum move percentages
        quantum_ai_moves = quantum_ai_stats['total_moves']
        quantum_ai_quantum_pct = (
                    quantum_ai_stats['quantum_moves'] / quantum_ai_moves * 100) if quantum_ai_moves > 0 else 0

        greedy_ai_moves = greedy_ai_stats['total_moves']
        greedy_ai_quantum_pct = (greedy_ai_stats['quantum_moves'] / greedy_ai_moves * 100) if greedy_ai_moves > 0 else 0

        # Create summary dictionary
        summary = {
            'total_games': quantum_games,
            'quantum_ai': {
                'wins': quantum_ai_stats['wins'],
                'losses': quantum_ai_stats['losses'],
                'draws': quantum_ai_stats['draws'],
                'win_percentage': quantum_win_pct,
                'total_moves': quantum_ai_stats['total_moves'],
                'quantum_moves': quantum_ai_stats['quantum_moves'],
                'classical_moves': quantum_ai_stats['classical_moves'],
                'quantum_move_percentage': quantum_ai_quantum_pct,
                'avg_time_per_move': quantum_ai_stats['avg_time_per_move'],
                'total_time': quantum_ai_stats['total_time'],
                'nodes_evaluated': quantum_ai_stats['nodes_evaluated'],
                'pruning_count': quantum_ai_stats['pruning_count'],
                'tt_hits': quantum_ai_stats['tt_hits']
            },
            'greedy_ai': {
                'wins': greedy_ai_stats['wins'],
                'losses': greedy_ai_stats['losses'],
                'draws': greedy_ai_stats['draws'],
                'win_percentage': greedy_win_pct,
                'total_moves': greedy_ai_stats['total_moves'],
                'quantum_moves': greedy_ai_stats['quantum_moves'],
                'classical_moves': greedy_ai_stats['classical_moves'],
                'quantum_move_percentage': greedy_ai_quantum_pct,
                'avg_time_per_move': greedy_ai_stats['avg_time_per_move'],
                'total_time': greedy_ai_stats['total_time']
            },
            'comparative': {
                'quantum_ai_over_greedy_win_ratio': quantum_win_pct / greedy_win_pct if greedy_win_pct > 0 else 999.0,
                'time_ratio': quantum_ai_stats['avg_time_per_move'] / greedy_ai_stats['avg_time_per_move'] if
                greedy_ai_stats['avg_time_per_move'] > 0 else 999.0,
                'quantum_move_ratio': quantum_ai_quantum_pct / greedy_ai_quantum_pct if greedy_ai_quantum_pct > 0 else 999.0
            }
        }

        return summary

    def _generate_visualizations(self, all_results, quantum_ai_stats, greedy_ai_stats):
        """Generate visualization plots."""
        figures_dir = os.path.join(self.output_dir, "figures")

        # 1. Game outcomes pie chart
        plt.figure(figsize=(10, 6))
        labels = ['QuantumChessAI wins', 'GreedyAI wins', 'Draws']
        sizes = [quantum_ai_stats['wins'], greedy_ai_stats['wins'], quantum_ai_stats['draws']]

        # Filter out zero values to prevent matplotlib errors
        valid_data = [(size, label) for size, label in zip(sizes, labels) if size > 0]
        
        if valid_data:
            valid_sizes, valid_labels = zip(*valid_data)
            plt.pie(valid_sizes, labels=valid_labels, autopct='%1.1f%%', startangle=90)
            plt.axis('equal')
            plt.title(f'Game Outcomes ({sum(sizes)} games)')
        else:
            plt.text(0.5, 0.5, 'No game data available', ha='center', va='center', fontsize=16)
            plt.title('Game Outcomes (0 games)')
            
        plt.savefig(os.path.join(figures_dir, 'game_outcomes.png'), dpi=300, bbox_inches='tight')
        plt.close()

        # 2. Time per move comparison
        plt.figure(figsize=(10, 6))
        labels = ['QuantumChessAI', 'GreedyAI']
        times = [quantum_ai_stats['avg_time_per_move'], greedy_ai_stats['avg_time_per_move']]

        plt.bar(labels, times, color=['blue', 'orange'])
        plt.ylabel('Average time per move (seconds)')
        plt.title('Move Time Comparison')
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.savefig(os.path.join(figures_dir, 'move_time_comparison.png'), dpi=300, bbox_inches='tight')
        plt.close()

        # 3. Quantum vs Classical moves
        plt.figure(figsize=(12, 6))

        # Data
        ai_names = ['QuantumChessAI', 'GreedyAI']
        quantum_moves = [quantum_ai_stats['quantum_moves'], greedy_ai_stats['quantum_moves']]
        classical_moves = [quantum_ai_stats['classical_moves'], greedy_ai_stats['classical_moves']]

        # Percentages for display
        total_moves = [quantum_ai_stats['total_moves'], greedy_ai_stats['total_moves']]
        quantum_pcts = [(q / t * 100) if t > 0 else 0 for q, t in zip(quantum_moves, total_moves)]
        classical_pcts = [(c / t * 100) if t > 0 else 0 for c, t in zip(classical_moves, total_moves)]

        x = np.arange(len(ai_names))
        width = 0.35

        fig, ax = plt.subplots(figsize=(12, 6))
        ax.bar(x, quantum_pcts, width, label='Quantum Moves')
        ax.bar(x, classical_pcts, width, bottom=quantum_pcts, label='Classical Moves')

        ax.set_ylabel('Percentage of Moves')
        ax.set_title('Move Type Distribution')
        ax.set_xticks(x)
        ax.set_xticklabels(ai_names)
        ax.legend()

        # Add move counts as text
        for i, ai in enumerate(ai_names):
            ax.text(i, 105, f'Total: {total_moves[i]} moves', ha='center')

        plt.savefig(os.path.join(figures_dir, 'move_type_distribution.png'), dpi=300, bbox_inches='tight')
        plt.close()

        # 4. Material balance over time for each game
        plt.figure(figsize=(14, 8))

        # Only show up to 5 games for clarity
        games_to_show = min(5, len(all_results))

        for i in range(games_to_show):
            game = all_results[i]
            material_balance = game['material_balance']

            # Adjust sign based on who plays what color
            if not game['quantum_ai_is_white']:
                material_balance = [-m for m in material_balance]

            # Plot this game's material balance
            plt.plot(material_balance, label=f'Game {i + 1}')

        plt.axhline(y=0, color='red', linestyle='-', alpha=0.3)
        plt.xlabel('Move Number')
        plt.ylabel('Material Balance (+ favors QuantumChessAI)')
        plt.title('Material Balance Over Time')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.5)
        plt.savefig(os.path.join(figures_dir, 'material_balance.png'), dpi=300, bbox_inches='tight')
        plt.close()

        # 5. Box plot of move times
        plt.figure(figsize=(10, 6))

        # Collect move times for each AI
        quantum_times = quantum_ai_stats['times']
        greedy_times = []

        for game in all_results:
            for move in game['moves']:
                if move['ai'] == 'GreedyAI':
                    greedy_times.append(move['time'])

        # Create box plot
        if quantum_times and greedy_times:
            plt.boxplot([quantum_times, greedy_times], labels=['QuantumChessAI', 'GreedyAI'])
            plt.ylabel('Time per move (seconds)')
            plt.title('Move Time Distribution')
            plt.grid(True, linestyle='--', alpha=0.7)
        else:
            plt.text(0.5, 0.5, 'No timing data available', ha='center', va='center', 
                    transform=plt.gca().transAxes, fontsize=16)
            plt.title('Move Time Distribution')
        plt.savefig(os.path.join(figures_dir, 'move_time_distribution.png'), dpi=300, bbox_inches='tight')
        plt.close()

        # 6. Search Statistics for QuantumChessAI
        if quantum_ai_stats['total_moves'] > 0:
            plt.figure(figsize=(12, 6))

            # Average stats per move
            avg_nodes = quantum_ai_stats['nodes_evaluated'] / quantum_ai_stats['total_moves']
            avg_pruning = quantum_ai_stats['pruning_count'] / quantum_ai_stats['total_moves']
            avg_tt_hits = quantum_ai_stats['tt_hits'] / quantum_ai_stats['total_moves']

            stats = [avg_nodes, avg_pruning, avg_tt_hits]
            labels = ['Nodes Evaluated', 'Pruning Count', 'TT Hits']

            plt.bar(labels, stats, color=['blue', 'green', 'orange'])
            plt.ylabel('Average per move')
            plt.title('QuantumChessAI Search Statistics')
            plt.grid(True, linestyle='--', alpha=0.7)

            # Add values on top of bars
            for i, v in enumerate(stats):
                plt.text(i, v + 0.1, f'{v:.1f}', ha='center')

            plt.savefig(os.path.join(figures_dir, 'search_statistics.png'), dpi=300, bbox_inches='tight')
            plt.close()

    def _print_summary(self, summary):
        """Print a summary of the results to the console."""
        print("\n" + "=" * 60)
        print("         QUANTUM CHESS AI PERFORMANCE ANALYSIS")
        print("=" * 60)

        print(f"\nTotal games played: {summary['total_games']}")
        print("\nWin/Loss Record:")
        print(
            f"  QuantumChessAI: {summary['quantum_ai']['wins']} wins, {summary['quantum_ai']['losses']} losses, {summary['quantum_ai']['draws']} draws ({summary['quantum_ai']['win_percentage']:.1f}%)")
        print(
            f"  GreedyAI: {summary['greedy_ai']['wins']} wins, {summary['greedy_ai']['losses']} losses, {summary['greedy_ai']['draws']} draws ({summary['greedy_ai']['win_percentage']:.1f}%)")

        print("\nMove Statistics:")
        print(
            f"  QuantumChessAI: {summary['quantum_ai']['total_moves']} moves ({summary['quantum_ai']['quantum_move_percentage']:.1f}% quantum)")
        print(
            f"  GreedyAI: {summary['greedy_ai']['total_moves']} moves ({summary['greedy_ai']['quantum_move_percentage']:.1f}% quantum)")

        print("\nTime Performance:")
        print(f"  QuantumChessAI: {summary['quantum_ai']['avg_time_per_move']:.3f} seconds per move")
        print(f"  GreedyAI: {summary['greedy_ai']['avg_time_per_move']:.3f} seconds per move")

        if summary['quantum_ai']['total_moves'] > 0:
            print("\nQuantumChessAI Search Stats (per move):")
            avg_nodes = summary['quantum_ai']['nodes_evaluated'] / summary['quantum_ai']['total_moves']
            avg_pruning = summary['quantum_ai']['pruning_count'] / summary['quantum_ai']['total_moves']
            avg_tt_hits = summary['quantum_ai']['tt_hits'] / summary['quantum_ai']['total_moves']

            print(f"  Nodes evaluated: {avg_nodes:.1f}")
            print(f"  Pruning count: {avg_pruning:.1f}")
            print(f"  Transposition table hits: {avg_tt_hits:.1f}")

        print("\nAnalysis completed! Visualizations saved to:", self.output_dir)
        print("=" * 60)


# Define a main function to run the analysis
def run_quantum_chess_analysis(num_games=10, max_depth=4):
    """Run a complete analysis of QuantumChessAI vs Greedy."""
    print("Starting Quantum Chess AI Analysis...")

    # Create the analyzer
    analyzer = ChessAIAnalyzer(output_dir="quantum_chess_analysis")

    # Run the comparison
    analyzer.run_comparison(
        num_games=num_games,
        max_moves=100,  # Limit the number of moves per game
        max_depth=max_depth
    )

    print("Analysis complete!")


# Run the analysis if this script is executed directly
if __name__ == "__main__":
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)

    # Run the analysis with faster settings
    run_quantum_chess_analysis(num_games=10, max_depth=2)