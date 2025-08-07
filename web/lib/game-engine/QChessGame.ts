/**
 * @file QChessGame.ts
 * @purpose Main quantum chess game class
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

import type { 
  ChessPosition, 
  QuantumMove, 
  GameState, 
  MoveValidationResult, 
  MoveType,
  PieceType,
  Color,
  PieceChar,
  QuantumPiece 
} from './types';
import { QChessSparseSimulator } from './QChessSparseSimulator';
import { 
  convertPosToInt, 
  intToPosition, 
  strNoneToPosition, 
  getTwoPointPath,
  isValidPosition,
  getColorFromPiece,
  getPieceTypeFromChar,
  getCharFromPiece,
  generateSeed 
} from './utils';

export class QChessGame {
  private sim: QChessSparseSimulator;
  private currentStep: number;
  private gameId: string;
  private moves: QuantumMove[];
  private capturedPieces: QuantumPiece[];
  private castlingRights: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  private enPassantTarget: ChessPosition | null;
  private prefixMeasure: number | null;

  constructor(seed?: number) {
    // Initialize with standard chess starting position
    // Use undefined to trigger default bit pattern creation
    const INITIAL_TAGS = 'RNBQKBNRPPPPPPPPpppppppprnbqkbnr';
    this.sim = new QChessSparseSimulator(undefined, INITIAL_TAGS, seed);
    this.currentStep = 0;
    this.gameId = this.generateGameId();
    this.moves = [];
    this.capturedPieces = [];
    this.castlingRights = {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    };
    this.enPassantTarget = null;
    this.prefixMeasure = null;
  }

  /**
   * Generate unique game ID
   */
  private generateGameId(): string {
    return `qchess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get current player color
   */
  get isWhite(): boolean {
    return this.currentStep % 2 === 0;
  }

  get currentPlayer(): Color {
    return this.isWhite ? 'white' : 'black';
  }

  /**
   * Get piece at position with probability
   */
  getPieceAt(pos: string | number): { piece: PieceChar; probability: number } | null {
    const position = typeof pos === 'string' ? convertPosToInt(pos) : pos;
    
    if (!isValidPosition(position)) {
      return null;
    }

    const piece = this.sim.pos2tag[position];
    if (piece === null) {
      return null;
    }

    const probability = this.sim.getMarginalProbability(position) as number;
    return { piece, probability };
  }

  /**
   * Set prefix measure for deterministic outcomes
   */
  setPrefixMeasure(value: number | null): void {
    if (value !== null && value !== 0 && value !== 1) {
      throw new Error('Prefix measure must be 0, 1, or null');
    }
    this.prefixMeasure = value;
  }

  /**
   * Get and optionally reset prefix measure
   */
  getPrefixMeasure(resetToNull: boolean = true): number | null {
    const result = this.prefixMeasure;
    if (resetToNull) {
      this.prefixMeasure = null;
    }
    return result;
  }

  /**
   * Validate pawn move
   */
  private isValidMovePawn(
    src: ChessPosition, 
    dst: ChessPosition, 
    promotion?: PieceType
  ): MoveValidationResult {
    const isWhite = this.isWhite;
    const srcPiece = this.getPieceAt(src.pos);
    const dstPiece = this.getPieceAt(dst.pos);
    
    if (!srcPiece) return 'invalid-no-piece';
    if (getColorFromPiece(srcPiece.piece) !== this.currentPlayer) return 'invalid-wrong-color';
    if (getPieceTypeFromChar(srcPiece.piece) !== 'pawn') return 'invalid-piece-movement';

    const fileDirection = dst.file - src.file;
    const rankDirection = dst.rank - src.rank;
    const expectedRankDirection = isWhite ? 1 : -1;

    // One step forward
    if (fileDirection === 0 && rankDirection === expectedRankDirection && !dstPiece) {
      return 'valid';
    }

    // Two steps forward from starting position
    const startingRank = isWhite ? 1 : 6;
    if (fileDirection === 0 && rankDirection === 2 * expectedRankDirection && 
        src.rank === startingRank && !dstPiece) {
      return 'valid';
    }

    // Diagonal capture
    if (Math.abs(fileDirection) === 1 && rankDirection === expectedRankDirection && dstPiece &&
        getColorFromPiece(dstPiece.piece) !== this.currentPlayer) {
      return 'valid';
    }

    // En passant
    if (Math.abs(fileDirection) === 1 && rankDirection === expectedRankDirection &&
        this.enPassantTarget && dst.pos === this.enPassantTarget.pos) {
      return 'valid';
    }

    return 'invalid-piece-movement';
  }

  /**
   * Validate rook move
   */
  private isValidMoveRook(
    src: ChessPosition,
    dst: ChessPosition,
    srcSecond?: ChessPosition
  ): MoveValidationResult {
    // Rook moves horizontally or vertically
    if (src.file !== dst.file && src.rank !== dst.rank) {
      return 'invalid-piece-movement';
    }

    const path = getTwoPointPath(src, dst);
    
    // Check if path is clear
    for (const pos of path) {
      const piece = this.getPieceAt(pos);
      if (piece && piece.probability > 0) {
        return 'invalid-path-blocked';
      }
    }

    return 'valid';
  }

  /**
   * Validate bishop move
   */
  private isValidMoveBishop(
    src: ChessPosition,
    dst: ChessPosition,
    srcSecond?: ChessPosition
  ): MoveValidationResult {
    // Bishop moves diagonally
    if (Math.abs(src.file - dst.file) !== Math.abs(src.rank - dst.rank)) {
      return 'invalid-piece-movement';
    }

    const path = getTwoPointPath(src, dst);
    
    // Check if path is clear
    for (const pos of path) {
      const piece = this.getPieceAt(pos);
      if (piece && piece.probability > 0) {
        return 'invalid-path-blocked';
      }
    }

    return 'valid';
  }

  /**
   * Validate queen move (combination of rook and bishop)
   */
  private isValidMoveQueen(
    src: ChessPosition,
    dst: ChessPosition,
    srcSecond?: ChessPosition
  ): MoveValidationResult {
    const rookValid = this.isValidMoveRook(src, dst, srcSecond);
    const bishopValid = this.isValidMoveBishop(src, dst, srcSecond);
    
    return rookValid === 'valid' || bishopValid === 'valid' ? 'valid' : 'invalid-piece-movement';
  }

  /**
   * Validate king move
   */
  private isValidMoveKing(
    src: ChessPosition,
    dst: ChessPosition,
    srcSecond?: ChessPosition
  ): MoveValidationResult {
    const fileDiff = Math.abs(src.file - dst.file);
    const rankDiff = Math.abs(src.rank - dst.rank);
    
    // King moves one square in any direction
    if (fileDiff <= 1 && rankDiff <= 1) {
      return 'valid';
    }

    // Castling (king moves two squares)
    if (fileDiff === 2 && rankDiff === 0) {
      return this.isValidCastling(src, dst);
    }

    return 'invalid-piece-movement';
  }

  /**
   * Validate knight move
   */
  private isValidMoveKnight(
    src: ChessPosition,
    dst: ChessPosition,
    srcSecond?: ChessPosition
  ): MoveValidationResult {
    const fileDiff = Math.abs(src.file - dst.file);
    const rankDiff = Math.abs(src.rank - dst.rank);
    
    // Knight moves in L-shape: 2+1 or 1+2
    if ((fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)) {
      return 'valid';
    }

    return 'invalid-piece-movement';
  }

  /**
   * Validate castling
   */
  private isValidCastling(src: ChessPosition, dst: ChessPosition): MoveValidationResult {
    const isWhite = this.isWhite;
    const isKingSide = dst.file > src.file;
    
    // Check castling rights
    if (isWhite && isKingSide && !this.castlingRights.whiteKingSide) return 'invalid-castle-conditions';
    if (isWhite && !isKingSide && !this.castlingRights.whiteQueenSide) return 'invalid-castle-conditions';
    if (!isWhite && isKingSide && !this.castlingRights.blackKingSide) return 'invalid-castle-conditions';
    if (!isWhite && !isKingSide && !this.castlingRights.blackQueenSide) return 'invalid-castle-conditions';

    // Check if king is in correct position
    const expectedKingFile = 4; // e-file
    const expectedKingRank = isWhite ? 0 : 7;
    if (src.file !== expectedKingFile || src.rank !== expectedKingRank) {
      return 'invalid-castle-conditions';
    }

    // Check if rook is in correct position
    const rookFile = isKingSide ? 7 : 0; // h-file or a-file
    const rookPos = rookFile + expectedKingRank * 8;
    const rookPiece = this.getPieceAt(rookPos);
    if (!rookPiece || getPieceTypeFromChar(rookPiece.piece) !== 'rook') {
      return 'invalid-castle-conditions';
    }

    // Check if squares between king and rook are empty
    const startFile = Math.min(src.file, rookFile);
    const endFile = Math.max(src.file, rookFile);
    for (let file = startFile + 1; file < endFile; file++) {
      const pos = file + expectedKingRank * 8;
      const piece = this.getPieceAt(pos);
      if (piece) {
        return 'invalid-path-blocked';
      }
    }

    return 'valid';
  }

  /**
   * Validate any move
   */
  validateMove(
    src: string,
    dst: string,
    srcSecond?: string,
    promotion?: PieceType
  ): MoveValidationResult {
    const [srcPos, dstPos, srcSecondPos] = strNoneToPosition(src, dst, srcSecond ?? null);
    if (!srcPos || !dstPos) return 'invalid-out-of-bounds';

    const srcPiece = this.getPieceAt(srcPos.pos);
    if (!srcPiece) return 'invalid-no-piece';
    
    // Check if it's the correct player's turn
    const pieceColor = getColorFromPiece(srcPiece.piece);
    if (pieceColor !== this.currentPlayer) {
      return 'invalid-wrong-color';
    }

    const pieceType = getPieceTypeFromChar(srcPiece.piece);

    switch (pieceType) {
      case 'pawn':
        return this.isValidMovePawn(srcPos, dstPos, promotion);
      case 'rook':
        return this.isValidMoveRook(srcPos, dstPos, srcSecondPos ?? undefined);
      case 'bishop':
        return this.isValidMoveBishop(srcPos, dstPos, srcSecondPos ?? undefined);
      case 'queen':
        return this.isValidMoveQueen(srcPos, dstPos, srcSecondPos ?? undefined);
      case 'king':
        return this.isValidMoveKing(srcPos, dstPos, srcSecondPos ?? undefined);
      case 'knight':
        return this.isValidMoveKnight(srcPos, dstPos, srcSecondPos ?? undefined);
      default:
        return 'invalid-piece-movement';
    }
  }

  /**
   * Check if a move is valid without making it
   */
  isValidMove(from: string, to: string): boolean {
    try {
      const validation = this.validateMove(from, to);
      return validation === 'valid';
    } catch {
      return false;
    }
  }

  /**
   * Make a quantum move
   */
  makeMove(
    src: string,
    dst: string,
    srcSecond?: string,
    dstSecond?: string,
    promotion?: PieceType
  ): QuantumMove {
    const validation = this.validateMove(src, dst, srcSecond, promotion);
    if (validation !== 'valid') {
      throw new Error(`Invalid move: ${validation}`);
    }

    const [srcPos, dstPos, srcSecondPos, dstSecondPos] = strNoneToPosition(
      src, 
      dst, 
      srcSecond ?? null, 
      dstSecond ?? null
    );

    if (!srcPos || !dstPos) {
      throw new Error('Invalid positions');
    }

    const srcPiece = this.getPieceAt(srcPos.pos)!;
    const pieceType = getPieceTypeFromChar(srcPiece.piece);
    
    let moveType: MoveType = 'normal';
    
    // Determine move type and execute quantum operation
    if (srcSecondPos && dstSecondPos) {
      // Split move
      moveType = 'split';
      this.sim.applyISwap(srcPos.pos, dstPos.pos);
      this.sim.applyISwap(srcSecondPos.pos, dstSecondPos.pos);
    } else if (srcSecondPos) {
      // Merge move  
      moveType = 'merge';
      this.sim.applyISwap(srcPos.pos, dstPos.pos);
      this.sim.applyISwap(srcSecondPos.pos, dstPos.pos);
    } else {
      // Check if destination is occupied (capture)
      const dstPiece = this.getPieceAt(dstPos.pos);
      if (dstPiece) {
        moveType = 'capture';
        this.capturedPieces.push({
          type: getPieceTypeFromChar(dstPiece.piece),
          color: getColorFromPiece(dstPiece.piece),
          char: dstPiece.piece,
          probability: dstPiece.probability,
        });
      }
      
      // Normal move
      this.sim.applyISwap(srcPos.pos, dstPos.pos);
    }

    // Handle promotion
    if (promotion && pieceType === 'pawn') {
      const newChar = getCharFromPiece(promotion, this.currentPlayer);
      this.sim.changeTag(dstPos.pos, newChar);
    }

    // Update castling rights
    this.updateCastlingRights(srcPos, pieceType);

    // Create move record
    const move: QuantumMove = {
      from: srcPos,
      to: dstPos,
      type: moveType,
      piece: pieceType,
      fromSecond: srcSecondPos ?? undefined,
      toSecond: dstSecondPos ?? undefined,
      promotion,
      capture: moveType === 'capture',
    };

    this.moves.push(move);
    this.currentStep++;
    
    return move;
  }

  /**
   * Update castling rights after a move
   */
  private updateCastlingRights(src: ChessPosition, pieceType: PieceType): void {
    if (pieceType === 'king') {
      if (this.isWhite) {
        this.castlingRights.whiteKingSide = false;
        this.castlingRights.whiteQueenSide = false;
      } else {
        this.castlingRights.blackKingSide = false;
        this.castlingRights.blackQueenSide = false;
      }
    }

    if (pieceType === 'rook') {
      // Check if rook moved from initial position
      if (src.pos === 0) this.castlingRights.whiteQueenSide = false;  // a1
      if (src.pos === 7) this.castlingRights.whiteKingSide = false;   // h1
      if (src.pos === 56) this.castlingRights.blackQueenSide = false; // a8
      if (src.pos === 63) this.castlingRights.blackKingSide = false;  // h8
    }
  }

  /**
   * Get white pieces as BigInt bitboard
   */
  getWhitePieces(): bigint {
    let whitePieces = BigInt(0);
    const tagList = this.sim.pos2tag;
    
    tagList.forEach((tag, index) => {
      if (tag && tag !== '.' && tag !== null && tag.toUpperCase() === tag) {
        // Uppercase = white piece
        whitePieces |= (BigInt(1) << BigInt(index));
      }
    });
    
    return whitePieces;
  }
  
  /**
   * Get black pieces as BigInt bitboard
   */
  getBlackPieces(): bigint {
    let blackPieces = BigInt(0);
    const tagList = this.sim.pos2tag;
    
    tagList.forEach((tag, index) => {
      if (tag && tag !== '.' && tag !== null && tag.toLowerCase() === tag) {
        // Lowercase = black piece
        blackPieces |= (BigInt(1) << BigInt(index));
      }
    });
    
    return blackPieces;
  }
  
  /**
   * Check if the current player is in check
   */
  isCheck(): boolean {
    // Simplified check detection - would need full implementation
    // For now, return false to allow game to continue
    return false;
  }
  
  /**
   * Check if the game is in checkmate
   */
  isCheckmate(): boolean {
    // Simplified checkmate detection - would need full implementation
    // Check if in check and no legal moves available
    return false;
  }
  
  /**
   * Check if the game is in stalemate
   */
  isStalemate(): boolean {
    // Simplified stalemate detection - would need full implementation
    // Check if not in check but no legal moves available
    return false;
  }
  
  /**
   * Get current game state
   */
  getGameState(): GameState {
    const [tagList, probList] = this.sim.getMarginalProbability() as [PieceChar[], number[]];
    
    const pieces: (QuantumPiece | null)[] = tagList.map((tag, index) => {
      if (tag === null) return null;
      return {
        type: getPieceTypeFromChar(tag),
        color: getColorFromPiece(tag),
        char: tag,
        probability: probList[index],
      };
    });

    // Create correlation matrix (simplified version)
    const correlationMatrix = Array(64).fill(null).map(() => Array(64).fill(0));
    // TODO: Implement proper correlation calculation

    return {
      id: this.gameId,
      board: {
        pieces,
        probabilities: probList,
        correlationMatrix,
      },
      currentPlayer: this.currentPlayer,
      moves: [...this.moves],
      capturedPieces: [...this.capturedPieces],
      status: 'active',
      moveCount: this.currentStep,
      canCastle: { ...this.castlingRights },
      enPassant: this.enPassantTarget ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get string representation of board
   */
  toString(): string {
    return this.sim.getPrintStr(4);
  }

  /**
   * Copy game state
   */
  copy(): QChessGame {
    const newGame = new QChessGame();
    newGame.sim.cloneFromSim(this.sim);
    newGame.currentStep = this.currentStep;
    newGame.gameId = this.gameId + '_copy';
    newGame.moves = [...this.moves];
    newGame.capturedPieces = [...this.capturedPieces];
    newGame.castlingRights = { ...this.castlingRights };
    newGame.enPassantTarget = this.enPassantTarget;
    return newGame;
  }

  /**
   * Reset to initial position
   */
  reset(): void {
    const INITIAL_TAGS = 'RNBQKBNRPPPPPPPPpppppppprnbqkbnr';
    this.sim = new QChessSparseSimulator(undefined, INITIAL_TAGS);
    this.currentStep = 0;
    this.gameId = this.generateGameId();
    this.moves = [];
    this.capturedPieces = [];
    this.castlingRights = {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    };
    this.enPassantTarget = null;
  }

  /**
   * Get move history
   */
  getMoveHistory(): QuantumMove[] {
    return [...this.moves];
  }

  /**
   * Get captured pieces
   */
  getCapturedPieces(): QuantumPiece[] {
    return [...this.capturedPieces];
  }
}