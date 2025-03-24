import { Piece, Position, Move, Color, PieceType } from '../types/chess';

const BOARD_SIZE = 8;

export const initializeBoard = (): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  // Initialize pawns
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[1][col] = { type: PieceType.Pawn, color: 'black' };
    board[6][col] = { type: PieceType.Pawn, color: 'white' };
  }

  // Initialize other pieces
  const backRankPieces: PieceType[] = [
    PieceType.Rook,
    PieceType.Knight,
    PieceType.Bishop,
    PieceType.Queen,
    PieceType.King,
    PieceType.Bishop,
    PieceType.Knight,
    PieceType.Rook
  ];
  
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[0][col] = { type: backRankPieces[col], color: 'black' };
    board[7][col] = { type: backRankPieces[col], color: 'white' };
  }

  return board;
};

// Helper function to check if a move would put own king in check
const wouldMoveExposeKing = (
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  piece: Piece
): boolean => {
  const tempBoard = board.map(row => [...row]);
  tempBoard[to.row][to.col] = piece;
  tempBoard[from.row][from.col] = null;
  
  // Find king position
  let kingRow = -1, kingCol = -1;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = tempBoard[r][c];
      if (p?.type === PieceType.King && p.color === piece.color) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== -1) break;
  }

  // Check if any opponent piece can attack the king
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = tempBoard[r][c];
      if (p && p.color !== piece.color) {
        const moves = getBasicMoves(tempBoard, { row: r, col: c }, p);
        if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Get moves without checking for check
const getBasicMoves = (
  board: (Piece | null)[][],
  position: Position,
  piece: Piece
): Position[] => {
  const moves: Position[] = [];
  const { row, col } = position;
  const { type, color } = piece;

  switch (type) {
    case PieceType.Pawn:
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      const promotionRow = color === 'white' ? 0 : 7;

      // Forward move
      if (!board[row + direction]?.[col]) {
        moves.push({ row: row + direction, col });
        // Double move from starting position
        if (row === startRow && !board[row + 2 * direction]?.[col]) {
          moves.push({ row: row + 2 * direction, col });
        }
      }

      // Captures
      [-1, 1].forEach(offset => {
        const targetCol = col + offset;
        const targetRow = row + direction;
        if (targetRow >= 0 && targetRow < BOARD_SIZE && 
            targetCol >= 0 && targetCol < BOARD_SIZE &&
            board[targetRow]?.[targetCol]?.color === (color === 'white' ? 'black' : 'white')) {
          moves.push({ row: targetRow, col: targetCol });
        }
      });
      break;

    case PieceType.Rook:
      [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dRow, dCol]) => {
        let currentRow = row + dRow;
        let currentCol = col + dCol;
        while (
          currentRow >= 0 && currentRow < BOARD_SIZE &&
          currentCol >= 0 && currentCol < BOARD_SIZE
        ) {
          const targetPiece = board[currentRow][currentCol];
          if (!targetPiece) {
            moves.push({ row: currentRow, col: currentCol });
          } else {
            if (targetPiece.color !== color) {
              moves.push({ row: currentRow, col: currentCol });
            }
            break;
          }
          currentRow += dRow;
          currentCol += dCol;
        }
      });
      break;

    case PieceType.Knight:
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2],
       [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dRow, dCol]) => {
        const targetRow = row + dRow;
        const targetCol = col + dCol;
        if (
          targetRow >= 0 && targetRow < BOARD_SIZE &&
          targetCol >= 0 && targetCol < BOARD_SIZE &&
          (!board[targetRow][targetCol] || board[targetRow][targetCol]?.color !== color)
        ) {
          moves.push({ row: targetRow, col: targetCol });
        }
      });
      break;

    case PieceType.Bishop:
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        let currentRow = row + dRow;
        let currentCol = col + dCol;
        while (
          currentRow >= 0 && currentRow < BOARD_SIZE &&
          currentCol >= 0 && currentCol < BOARD_SIZE
        ) {
          const targetPiece = board[currentRow][currentCol];
          if (!targetPiece) {
            moves.push({ row: currentRow, col: currentCol });
          } else {
            if (targetPiece.color !== color) {
              moves.push({ row: currentRow, col: currentCol });
            }
            break;
          }
          currentRow += dRow;
          currentCol += dCol;
        }
      });
      break;

    case PieceType.Queen:
      [[0, 1], [1, 0], [0, -1], [-1, 0],
       [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        let currentRow = row + dRow;
        let currentCol = col + dCol;
        while (
          currentRow >= 0 && currentRow < BOARD_SIZE &&
          currentCol >= 0 && currentCol < BOARD_SIZE
        ) {
          const targetPiece = board[currentRow][currentCol];
          if (!targetPiece) {
            moves.push({ row: currentRow, col: currentCol });
          } else {
            if (targetPiece.color !== color) {
              moves.push({ row: currentRow, col: currentCol });
            }
            break;
          }
          currentRow += dRow;
          currentCol += dCol;
        }
      });
      break;

    case PieceType.King:
      [[0, 1], [1, 0], [0, -1], [-1, 0],
       [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dRow, dCol]) => {
        const targetRow = row + dRow;
        const targetCol = col + dCol;
        if (
          targetRow >= 0 && targetRow < BOARD_SIZE &&
          targetCol >= 0 && targetCol < BOARD_SIZE &&
          (!board[targetRow][targetCol] || board[targetRow][targetCol]?.color !== color)
        ) {
          moves.push({ row: targetRow, col: targetCol });
        }
      });
      break;
  }

  return moves;
};

export const getPossibleMoves = (
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moveHistory: Move[]
): Position[] => {
  const basicMoves = getBasicMoves(board, position, piece);
  
  // Filter out moves that would put own king in check
  return basicMoves.filter(move => 
    !wouldMoveExposeKing(board, position, move, piece)
  );
};

export const isKingInCheck = (board: (Piece | null)[][], color: Color): boolean => {
  // Find king position
  let kingPosition: Position | null = null;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece?.type === PieceType.King && piece.color === color) {
        kingPosition = { row, col };
        break;
      }
    }
    if (kingPosition) break;
  }

  if (!kingPosition) return false;

  // Check if any opponent piece can attack the king
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color !== color) {
        const moves = getBasicMoves(board, { row, col }, piece);
        if (moves.some(move => 
          move.row === kingPosition?.row && move.col === kingPosition?.col
        )) {
          return true;
        }
      }
    }
  }

  return false;
};

export const isCheckmate = (board: (Piece | null)[][], color: Color): boolean => {
  if (!isKingInCheck(board, color)) return false;

  // Check if any piece can make a legal move
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getPossibleMoves(board, { row, col }, piece, []);
        if (moves.length > 0) return false;
      }
    }
  }

  return true;
}; 