export type Color = 'white' | 'black';

export enum PieceType {
  King = 'king',
  Queen = 'queen',
  Rook = 'rook',
  Bishop = 'bishop',
  Knight = 'knight',
  Pawn = 'pawn'
}

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved?: boolean;
  canBeEnPassant?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isCastling?: boolean;
  isEnPassant?: boolean;
  promotion?: PieceType;
  notation?: string;
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: Color;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  possibleMoves: Position[];
  selectedPiece: Position | null;
  capturedPieces: {
    white: Piece[];
    black: Piece[];
  };
  lastMove?: Move;
  halfMoveClock: number;
  fullMoveNumber: number;
  lastAIReasoning?: string;
  aiReasoning?: string[];
}

export interface BettingState {
  whiteCoins: number;
  blackCoins: number;
  currentBet: number;
  betPlaced: boolean;
} 