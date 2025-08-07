/**
 * @file chess-demo.ts
 * @purpose Demonstration of quantum chess engine capabilities
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

import { QChessGame, BitString } from '../lib/game-engine';

// Demonstration of quantum chess engine
export function demonstrateQuantumChess(): void {
  console.log('🚀 Quantum Chess Engine Demo\n');

  // Create a new game
  const game = new QChessGame(42); // Fixed seed for reproducibility
  console.log('📋 Initial Position:');
  console.log(game.toString());
  console.log('\n');

  // Show initial state
  console.log('📊 Game State:');
  const state = game.getGameState();
  console.log(`Current Player: ${state.currentPlayer}`);
  console.log(`Move Count: ${state.moveCount}`);
  console.log(`Board Pieces: ${state.board.pieces.filter(p => p !== null).length}/32`);
  console.log('\n');

  // Demonstrate basic moves
  console.log('♟️  Making Classical Moves:');
  
  try {
    const move1 = game.makeMove('e2', 'e4');
    console.log(`1. ${move1.from.str_}-${move1.to.str_} (${move1.type})`);
    
    const move2 = game.makeMove('e7', 'e5');
    console.log(`2. ${move2.from.str_}-${move2.to.str_} (${move2.type})`);
    
    const move3 = game.makeMove('g1', 'f3');
    console.log(`3. ${move3.from.str_}-${move3.to.str_} (${move3.type})`);
    
    console.log('\n📋 Position after moves:');
    console.log(game.toString());
    console.log('\n');
    
    // Show piece probabilities
    console.log('🎲 Piece Probabilities:');
    const positions = ['e4', 'e5', 'f3'];
    positions.forEach(pos => {
      const piece = game.getPieceAt(pos);
      if (piece) {
        console.log(`${pos}: ${piece.piece} (${(piece.probability * 100).toFixed(1)}%)`);
      }
    });
    console.log('\n');

    // Demonstrate move validation
    console.log('✅ Move Validation Examples:');
    console.log(`d2-d4: ${game.validateMove('d2', 'd4')}`);
    console.log(`d2-d5: ${game.validateMove('d2', 'd5')}`);
    console.log(`b8-c6: ${game.validateMove('b8', 'c6')}`);
    console.log(`a1-a2: ${game.validateMove('a1', 'a2')}`);
    console.log('\n');

    // Show move history
    console.log('📜 Move History:');
    const history = game.getMoveHistory();
    history.forEach((move, index) => {
      console.log(`${index + 1}. ${move.from.str_}-${move.to.str_} (${move.piece}, ${move.type})`);
    });
    console.log('\n');

  } catch (error) {
    console.error('Error during demo:', error);
  }

  // Demonstrate BitString precision
  console.log('🔢 BitString Precision Demo:');
  const standardPos = BitString.standardChessPosition();
  console.log(`Standard position hex: ${standardPos.toHex()}`);
  console.log(`Piece count: ${standardPos.popCount()}`);
  console.log(`Set positions: ${standardPos.getSetPositions().slice(0, 8).join(', ')}...`);
  console.log('\n');

  console.log('✨ Quantum Chess Engine Demo Complete!');
}

// Run demo if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  demonstrateQuantumChess();
}