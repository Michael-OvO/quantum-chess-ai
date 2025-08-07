/**
 * @file tournament.types.ts
 * @purpose Type definitions for tournaments
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.1
 */

import type { ModelConfig } from './model.types';

export type TournamentFormat = 'swiss' | 'round-robin' | 'knockout' | 'double-elimination';
export type TournamentStatus = 'created' | 'in-progress' | 'completed' | 'cancelled';

export interface TournamentConfig {
  id: string;
  name: string;
  format: TournamentFormat;
  participants: string[];
  rounds: number;
  timeControl?: {
    initial: number;
    increment: number;
  };
  startDate: Date;
  endDate?: Date;
  status: TournamentStatus;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  whitePlayer: string;
  blackPlayer: string;
  gameId?: string;
  result?: MatchResult;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface MatchResult {
  winner?: string;
  draw: boolean;
  score: {
    white: number;
    black: number;
  };
  reason?: string;
}

export interface TournamentStanding {
  playerId: string;
  rank: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  tiebreak: number;
}

export interface Tournament {
  config: TournamentConfig;
  matches: Match[];
  standings: TournamentStanding[];
  currentRound: number;
  models: Map<string, ModelConfig>;
}