/**
 * @file route.ts
 * @purpose API endpoint to create a new chess game
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { QChessGame } from '@/lib/game-engine';
import { getGameStateStore } from '@/lib/game-state';
import { generateSeed } from '@/lib/game-engine/utils';
import { withRateLimit, rateLimiters } from '@/lib/api/rateLimiter';

// Request schema
const CreateGameSchema = z.object({
  playerWhite: z.string().min(1).max(100).optional(),
  playerBlack: z.string().min(1).max(100).optional(),
  timeControl: z.object({
    initial: z.number().min(0).max(86400).optional(),
    increment: z.number().min(0).max(3600).optional()
  }).optional(),
  variant: z.enum(['standard', 'quantum']).default('quantum'),
  seed: z.number().optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.createGame);
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = CreateGameSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Generate game ID
    const gameId = crypto.randomUUID();
    
    // Create new game instance
    const seed = data.seed || generateSeed();
    const game = new QChessGame(seed);
    
    // Create game state
    const gameState = {
      id: gameId,
      whitePieces: game.getWhitePieces(),
      blackPieces: game.getBlackPieces(),
      currentTurn: 'white' as const,
      moveHistory: [],
      capturedPieces: [],
      gameStatus: 'active' as const,
      players: {
        white: data.playerWhite || 'Anonymous',
        black: data.playerBlack || 'Anonymous'
      },
      timeControl: data.timeControl || null,
      variant: data.variant,
      seed,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to store
    const store = getGameStateStore();
    await store.saveGame(gameId, gameState);
    
    // Return success response
    return NextResponse.json({
      success: true,
      gameId,
      game: {
        id: gameId,
        players: gameState.players,
        variant: gameState.variant,
        status: gameState.gameStatus,
        currentTurn: gameState.currentTurn,
        createdAt: gameState.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('[T1.8] Error creating game:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create game',
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