/**
 * @file model.types.ts
 * @purpose Type definitions for AI models
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.1
 */

import type { Move, GameState } from './game.types';

export type ModelType = 
  | 'minimax' 
  | 'chain-of-thought' 
  | 'react' 
  | 'tree-of-thoughts' 
  | 'self-consistency' 
  | 'debate' 
  | 'custom';

export type ThoughtType = 
  | 'analysis' 
  | 'evaluation' 
  | 'planning' 
  | 'reflection' 
  | 'critique' 
  | 'decision';

export interface ThoughtStep {
  id: string;
  type: ThoughtType;
  content: string;
  confidence?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ReasoningChain {
  modelId: string;
  gameId: string;
  moveNumber: number;
  thoughts: ThoughtStep[];
  finalMove: Move;
  alternativeMoves?: Move[];
  totalThinkingTime: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  apiKey?: string;
  endpoint?: string;
  maxThinkingTime: number;
  temperature?: number;
  maxTokens?: number;
  customPrompt?: string;
}

export interface ModelPerformance {
  modelId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  avgMoveTime: number;
  avgThoughtCount: number;
  eloRating: number;
}

export interface BaseModel {
  id: string;
  config: ModelConfig;
  
  makeMove(gameState: GameState): Promise<ReasoningChain>;
  analyzePosition(gameState: GameState): Promise<ThoughtStep[]>;
  getPerformance(): Promise<ModelPerformance>;
}