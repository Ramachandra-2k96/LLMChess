import { Piece, Position, Move, GameState, PieceType } from '../types/chess';
import { getPossibleMoves, isKingInCheck } from './chessLogic';

const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.Pawn]: 1,
  [PieceType.Knight]: 3,
  [PieceType.Bishop]: 3,
  [PieceType.Rook]: 5,
  [PieceType.Queen]: 9,
  [PieceType.King]: 0
};

export const getAIMove = (gameState: GameState): Move | null => {
  const board = gameState.board;
  const moves: Move[] = [];

  // Collect all possible moves for black pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === 'black') {
        const possibleMoves = getPossibleMoves(board, { row, col }, piece, gameState.moveHistory);
        possibleMoves.forEach(to => {
          moves.push({
            from: { row, col },
            to,
            piece,
            capturedPiece: board[to.row][to.col] || undefined
          });
        });
      }
    }
  }

  // If no moves available, return null
  if (moves.length === 0) {
    return null;
  }

  // Evaluate moves and select the best one
  const evaluatedMoves = moves.map(move => ({
    move,
    score: evaluateMove(move, board)
  }));

  // Sort moves by score (highest first)
  evaluatedMoves.sort((a, b) => b.score - a.score);

  // Select one of the top 3 moves randomly
  const topMoves = evaluatedMoves.slice(0, Math.min(3, evaluatedMoves.length));
  const randomIndex = Math.floor(Math.random() * topMoves.length);
  return topMoves[randomIndex].move;
};

const evaluateMove = (move: Move, board: (Piece | null)[][]): number => {
  let score = 0;

  // Capture evaluation
  if (move.capturedPiece) {
    score += PIECE_VALUES[move.capturedPiece.type] * 10;
  }

  // Position evaluation (simple center control)
  const centerSquares = [
    { row: 3, col: 3 }, { row: 3, col: 4 },
    { row: 4, col: 3 }, { row: 4, col: 4 }
  ];
  if (centerSquares.some(square => 
    square.row === move.to.row && square.col === move.to.col
  )) {
    score += 5;
  }

  // Mobility evaluation
  const tempBoard = board.map(row => [...row]);
  tempBoard[move.to.row][move.to.col] = move.piece;
  tempBoard[move.from.row][move.from.col] = null;
  
  const possibleMoves = getPossibleMoves(tempBoard, move.to, move.piece, []);
  score += possibleMoves.length * 2;

  // Safety evaluation (avoid moves that put king in check)
  if (isKingInCheck(tempBoard, 'black')) {
    score -= 50;
  }

  // Add some randomness to avoid predictable play
  score += Math.random() * 10;

  return score;
}; 