/**
 * @file route.ts
 * @purpose API endpoint to get game state by ID
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GameStateStore } from '@/lib/game-state';

// Path parameters schema
const PathParamsSchema = z.object({
  id: z.string().uuid()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Validate path parameters
    const validation = PathParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid game ID format',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { id } = validation.data;
    
    // Get game from store
    const store = GameStateStore.getInstance();
    const gameState = await store.getGame(id);
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Return game state
    return NextResponse.json({
      success: true,
      game: {
        id: gameState.id,
        whitePieces: gameState.whitePieces.toString(),
        blackPieces: gameState.blackPieces.toString(),
        currentTurn: gameState.currentTurn,
        moveHistory: gameState.moveHistory,
        capturedPieces: gameState.capturedPieces,
        gameStatus: gameState.gameStatus,
        players: gameState.players,
        timeControl: gameState.timeControl,
        variant: gameState.variant,
        createdAt: gameState.createdAt,
        updatedAt: gameState.updatedAt
      }
    });
    
  } catch (error) {
    console.error('[T1.8] Error fetching game:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch game',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE method to remove a game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    
    // Validate path parameters
    const validation = PathParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid game ID format',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { id } = validation.data;
    
    // Delete game from store
    const store = GameStateStore.getInstance();
    const success = await store.deleteGame(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Game not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });
    
  } catch (error) {
    console.error('[T1.8] Error deleting game:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete game',
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}