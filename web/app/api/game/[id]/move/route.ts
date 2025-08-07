/**
 * @file route.ts
 * @purpose API endpoint to make a move in a chess game
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { QChessGame } from '@/lib/game-engine';
import { getGameStateStore } from '@/lib/game-state';
import { BitString } from '@/lib/game-engine/BitString';

// Request schema for move
const MakeMoveSchema = z.object({
  from: z.string().regex(/^[a-h][1-8]$/, 'Invalid square notation'),
  to: z.string().regex(/^[a-h][1-8]$/, 'Invalid square notation'),
  promotion: z.enum(['queen', 'rook', 'bishop', 'knight']).optional(),
  isQuantumMove: z.boolean().optional()
});

// Path parameters schema
const PathParamsSchema = z.object({
  id: z.string().uuid()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Validate path parameters
    const pathValidation = PathParamsSchema.safeParse(resolvedParams);
    
    if (!pathValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid game ID format',
          details: pathValidation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { id } = pathValidation.data;
    
    // Parse and validate request body
    const body = await request.json();
    const moveValidation = MakeMoveSchema.safeParse(body);
    
    if (!moveValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid move data',
          details: moveValidation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const moveData = moveValidation.data;
    
    // Get game from store
    const store = getGameStateStore();
    const gameState = await store.load(id);
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Check if game is still active
    if (gameState.gameStatus !== 'active') {
      return NextResponse.json(
        { error: `Game is ${gameState.gameStatus}, cannot make moves` },
        { status: 400 }
      );
    }
    
    // Recreate game instance from state
    const game = new QChessGame(gameState.seed);
    
    // Replay all previous moves to get to current state
    for (const move of gameState.moveHistory) {
      const [from, to] = move.notation.split('-');
      game.makeMove(from, to);
    }
    
    // Validate the move
    if (!game.isValidMove(moveData.from, moveData.to)) {
      return NextResponse.json(
        { error: 'Invalid move' },
        { status: 400 }
      );
    }
    
    // Make the move
    game.makeMove(moveData.from, moveData.to);
    
    // Update game state
    const updatedGameState = {
      ...gameState,
      whitePieces: game.getWhitePieces(),
      blackPieces: game.getBlackPieces(),
      currentTurn: gameState.currentTurn === 'white' ? 'black' as const : 'white' as const,
      moveHistory: [
        ...gameState.moveHistory,
        {
          notation: `${moveData.from}-${moveData.to}`,
          player: gameState.currentTurn,
          timestamp: new Date(),
          isQuantumMove: moveData.isQuantumMove || false
        }
      ],
      updatedAt: new Date()
    };
    
    // Check game status
    if (game.isCheckmate()) {
      updatedGameState.gameStatus = 'checkmate';
    } else if (game.isStalemate()) {
      updatedGameState.gameStatus = 'stalemate';
    } else if (game.isCheck()) {
      updatedGameState.gameStatus = 'check';
    }
    
    // Save updated state
    await store.saveGame(id, updatedGameState);
    
    // Return response
    return NextResponse.json({
      success: true,
      move: {
        from: moveData.from,
        to: moveData.to,
        player: gameState.currentTurn,
        moveNumber: updatedGameState.moveHistory.length
      },
      gameState: {
        currentTurn: updatedGameState.currentTurn,
        gameStatus: updatedGameState.gameStatus,
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isStalemate: game.isStalemate(),
        moveCount: updatedGameState.moveHistory.length
      }
    });
    
  } catch (error) {
    console.error('[T1.8] Error making move:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to make move',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}