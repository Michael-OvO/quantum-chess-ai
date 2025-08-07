/**
 * @file game.test.ts
 * @purpose Unit tests for game API endpoints
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.8
 */

import { NextRequest } from 'next/server';
import { POST as createGame } from '@/app/api/game/create/route';
import { GET as getGame, DELETE as deleteGame } from '@/app/api/game/[id]/route';
import { POST as makeMove } from '@/app/api/game/[id]/move/route';
import { GameStateStore } from '@/lib/game-state';

// Mock the GameStateStore
jest.mock('@/lib/game-state', () => ({
  GameStateStore: {
    getInstance: jest.fn(() => ({
      saveGame: jest.fn(),
      getGame: jest.fn(),
      deleteGame: jest.fn(),
      listGames: jest.fn()
    }))
  }
}));

describe('Game API', () => {
  let store: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    store = GameStateStore.getInstance();
  });
  
  describe('POST /api/game/create', () => {
    it('creates a new game successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/game/create', {
        method: 'POST',
        body: JSON.stringify({
          playerWhite: 'Alice',
          playerBlack: 'Bob',
          variant: 'quantum'
        })
      });
      
      store.saveGame.mockResolvedValue(true);
      
      const response = await createGame(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.gameId).toBeDefined();
      expect(data.game.players.white).toBe('Alice');
      expect(data.game.players.black).toBe('Bob');
    });
    
    it('validates request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/game/create', {
        method: 'POST',
        body: JSON.stringify({
          playerWhite: '',  // Invalid: empty string
          variant: 'invalid'  // Invalid variant
        })
      });
      
      const response = await createGame(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });
    
    it('handles server errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/game/create', {
        method: 'POST',
        body: JSON.stringify({
          variant: 'quantum'
        })
      });
      
      store.saveGame.mockRejectedValue(new Error('Database error'));
      
      const response = await createGame(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create game');
    });
  });
  
  describe('GET /api/game/[id]', () => {
    it('retrieves game successfully', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const mockGame = {
        id: gameId,
        whitePieces: BigInt(0xFFFF),
        blackPieces: BigInt(0xFFFF000000000000),
        currentTurn: 'white',
        moveHistory: [],
        capturedPieces: [],
        gameStatus: 'active',
        players: { white: 'Alice', black: 'Bob' },
        timeControl: null,
        variant: 'quantum',
        seed: 12345,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      store.getGame.mockResolvedValue(mockGame);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}`);
      const response = await getGame(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.game.id).toBe(gameId);
      expect(data.game.players.white).toBe('Alice');
    });
    
    it('returns 404 for non-existent game', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      store.getGame.mockResolvedValue(null);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}`);
      const response = await getGame(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found');
    });
    
    it('validates game ID format', async () => {
      const invalidId = 'invalid-id';
      
      const request = new NextRequest(`http://localhost:3000/api/game/${invalidId}`);
      const response = await getGame(request, { params: { id: invalidId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid game ID format');
    });
  });
  
  describe('POST /api/game/[id]/move', () => {
    it('makes a valid move', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const mockGame = {
        id: gameId,
        whitePieces: BigInt(0xFFFF),
        blackPieces: BigInt(0xFFFF000000000000),
        currentTurn: 'white',
        moveHistory: [],
        capturedPieces: [],
        gameStatus: 'active',
        players: { white: 'Alice', black: 'Bob' },
        timeControl: null,
        variant: 'quantum',
        seed: 12345,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      store.getGame.mockResolvedValue(mockGame);
      store.saveGame.mockResolvedValue(true);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          from: 'e2',
          to: 'e4'
        })
      });
      
      const response = await makeMove(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.move.from).toBe('e2');
      expect(data.move.to).toBe('e4');
    });
    
    it('rejects invalid move notation', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          from: 'invalid',
          to: 'e4'
        })
      });
      
      const response = await makeMove(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid move data');
    });
    
    it('prevents moves in finished games', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      const mockGame = {
        id: gameId,
        whitePieces: BigInt(0xFFFF),
        blackPieces: BigInt(0xFFFF000000000000),
        currentTurn: 'white',
        moveHistory: [],
        capturedPieces: [],
        gameStatus: 'checkmate',  // Game is finished
        players: { white: 'Alice', black: 'Bob' },
        timeControl: null,
        variant: 'quantum',
        seed: 12345,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      store.getGame.mockResolvedValue(mockGame);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}/move`, {
        method: 'POST',
        body: JSON.stringify({
          from: 'e2',
          to: 'e4'
        })
      });
      
      const response = await makeMove(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Game is checkmate, cannot make moves');
    });
  });
  
  describe('DELETE /api/game/[id]', () => {
    it('deletes game successfully', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      store.deleteGame.mockResolvedValue(true);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}`, {
        method: 'DELETE'
      });
      
      const response = await deleteGame(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Game deleted successfully');
    });
    
    it('returns 404 for non-existent game deletion', async () => {
      const gameId = '123e4567-e89b-12d3-a456-426614174000';
      store.deleteGame.mockResolvedValue(false);
      
      const request = new NextRequest(`http://localhost:3000/api/game/${gameId}`, {
        method: 'DELETE'
      });
      
      const response = await deleteGame(request, { params: { id: gameId } });
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Game not found or already deleted');
    });
  });
});