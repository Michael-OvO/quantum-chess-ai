/**
 * @file ChessBoard.test.tsx
 * @purpose Unit tests for ChessBoard component
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChessBoard } from '@/components/board';
import { QChessGame } from '@/lib/game-engine';

describe('ChessBoard', () => {
  let game: QChessGame;
  
  beforeEach(() => {
    game = new QChessGame();
  });
  
  it('renders 64 squares', () => {
    const { container } = render(<ChessBoard game={game} />);
    const squares = container.querySelectorAll('.chess-square');
    expect(squares).toHaveLength(64);
  });
  
  it('renders pieces in starting position', () => {
    const { container } = render(<ChessBoard game={game} />);
    const pieces = container.querySelectorAll('.chess-piece');
    // Starting position has 32 pieces (16 per side)
    expect(pieces.length).toBeGreaterThan(0);
  });
  
  it('shows notation when enabled', () => {
    render(<ChessBoard game={game} showNotation={true} />);
    // Check for file labels
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('h')).toBeInTheDocument();
    // Check for rank labels
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
  
  it('handles square selection', () => {
    const { container } = render(<ChessBoard game={game} allowMoves={true} />);
    const squares = container.querySelectorAll('.chess-square');
    
    // Click on a square with a piece (e2 pawn)
    const e2Square = squares[12]; // e2 is index 12
    fireEvent.click(e2Square);
    
    // Should show selection indicator
    expect(e2Square).toHaveClass('ring-4');
  });
  
  it('calls onMove callback when move is made', () => {
    const onMove = jest.fn();
    const { container } = render(
      <ChessBoard game={game} onMove={onMove} allowMoves={true} />
    );
    
    const squares = container.querySelectorAll('.chess-square');
    
    // Select e2 pawn
    fireEvent.click(squares[12]);
    
    // Move to e4
    fireEvent.click(squares[28]);
    
    // Check if onMove was called
    expect(onMove).toHaveBeenCalledWith('e2', 'e4');
  });
  
  it('prevents moves when allowMoves is false', () => {
    const onMove = jest.fn();
    const { container } = render(
      <ChessBoard game={game} onMove={onMove} allowMoves={false} />
    );
    
    const squares = container.querySelectorAll('.chess-square');
    
    // Try to select and move
    fireEvent.click(squares[12]);
    fireEvent.click(squares[28]);
    
    // onMove should not be called
    expect(onMove).not.toHaveBeenCalled();
  });
  
  it('can be flipped', () => {
    const { container, rerender } = render(<ChessBoard game={game} flipped={false} />);
    const normalBoard = container.innerHTML;
    
    rerender(<ChessBoard game={game} flipped={true} />);
    const flippedBoard = container.innerHTML;
    
    // Board HTML should be different when flipped
    expect(normalBoard).not.toEqual(flippedBoard);
  });
  
  it('highlights last move when enabled', () => {
    const { container } = render(
      <ChessBoard game={game} highlightLastMove={true} allowMoves={true} />
    );
    
    const squares = container.querySelectorAll('.chess-square');
    
    // Make a move
    fireEvent.click(squares[12]); // e2
    fireEvent.click(squares[28]); // e4
    
    // Check that the move squares are highlighted
    expect(squares[12]).toHaveClass('bg-opacity-80');
    expect(squares[28]).toHaveClass('bg-opacity-80');
  });
  
  it('displays valid moves when piece is selected', () => {
    const { container } = render(<ChessBoard game={game} allowMoves={true} />);
    const squares = container.querySelectorAll('.chess-square');
    
    // Select e2 pawn
    fireEvent.click(squares[12]);
    
    // e3 and e4 should be valid moves
    const e3Square = squares[20];
    const e4Square = squares[28];
    
    // Check for valid move indicators
    const validMoveIndicators = container.querySelectorAll('.bg-green-500');
    expect(validMoveIndicators.length).toBeGreaterThan(0);
  });
  
  it('respects board size prop', () => {
    const { container } = render(<ChessBoard game={game} boardSize={480} />);
    const board = container.querySelector('.chess-board');
    
    expect(board).toHaveStyle({ width: '544px' }); // 480 + 64 padding
  });
});

describe('ChessBoard - Drag and Drop', () => {
  let game: QChessGame;
  
  beforeEach(() => {
    game = new QChessGame();
  });
  
  it('supports drag and drop moves', () => {
    const onMove = jest.fn();
    const { container } = render(
      <ChessBoard game={game} onMove={onMove} allowMoves={true} />
    );
    
    const squares = container.querySelectorAll('.chess-square');
    const e2Square = squares[12];
    const e4Square = squares[28];
    
    // Simulate drag from e2
    fireEvent.dragStart(e2Square.querySelector('.chess-piece')!);
    
    // Simulate drop on e4
    fireEvent.dragOver(e4Square);
    fireEvent.drop(e4Square);
    
    // Check if move was made
    expect(onMove).toHaveBeenCalledWith('e2', 'e4');
  });
});