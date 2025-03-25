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

// Get moves without checking for check
const getBasicMoves = (
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  lastMove?: Move
): Position[] => {
  const moves: Position[] = [];
  const { row, col } = position;
  const { type, color } = piece;

  switch (type) {
    case PieceType.Pawn:
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;

      // Forward move
      if (!board[row + direction]?.[col]) {
        moves.push({ row: row + direction, col });
        // Double move from starting position
        if (row === startRow && !board[row + 2 * direction]?.[col]) {
          moves.push({ row: row + 2 * direction, col });
        }
      }

      // Captures and En Passant
      [-1, 1].forEach(offset => {
        const targetCol = col + offset;
        const targetRow = row + direction;
        if (targetRow >= 0 && targetRow < BOARD_SIZE && 
            targetCol >= 0 && targetCol < BOARD_SIZE) {
          const targetPiece = board[targetRow][targetCol];
          if (targetPiece?.color === (color === 'white' ? 'black' : 'white')) {
            moves.push({ row: targetRow, col: targetCol });
          }
          // En Passant
          if (lastMove?.piece.type === PieceType.Pawn &&
              Math.abs(lastMove.to.row - lastMove.from.row) === 2 &&
              lastMove.to.row === row &&
              lastMove.to.col === targetCol &&
              lastMove.piece.canBeEnPassant) {
            moves.push({ row: targetRow, col: targetCol });
          }
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
      // Normal moves
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

      // Castling
      if (!piece.hasMoved) {
        // Kingside castling
        const kingsideRook = board[row][7];
        if (kingsideRook?.type === PieceType.Rook && 
            !kingsideRook.hasMoved &&
            !board[row][5] && 
            !board[row][6]) {
          moves.push({ row, col: 6 });
        }

        // Queenside castling
        const queensideRook = board[row][0];
        if (queensideRook?.type === PieceType.Rook && 
            !queensideRook.hasMoved &&
            !board[row][1] && 
            !board[row][2] && 
            !board[row][3]) {
          moves.push({ row, col: 2 });
        }
      }
      break;
  }

  return moves;
};

// Helper function to check if a position is under attack
const isPositionUnderAttack = (
  board: (Piece | null)[][],
  position: Position,
  attackingColor: Color
): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === attackingColor) {
        const moves = getBasicMoves(board, { row, col }, piece);
        if (moves.some(m => m.row === position.row && m.col === position.col)) {
          return true;
        }
      }
    }
  }
  return false;
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

  // Check if king is under attack
  return isPositionUnderAttack(board, kingPosition, color === 'white' ? 'black' : 'white');
};

export const getPossibleMoves = (
  board: (Piece | null)[][],
  position: Position,
  piece: Piece,
  moveHistory: Move[]
): Position[] => {
  const basicMoves = getBasicMoves(board, position, piece, moveHistory[moveHistory.length - 1]);
  
  // Filter out moves that would put own king in check
  return basicMoves.filter(move => {
    const tempBoard = board.map(row => [...row]);
    tempBoard[move.row][move.col] = piece;
    tempBoard[position.row][position.col] = null;
    return !isKingInCheck(tempBoard, piece.color);
  });
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

export const isStalemate = (board: (Piece | null)[][], color: Color): boolean => {
  if (isKingInCheck(board, color)) return false;

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

export const isInsufficientMaterial = (board: (Piece | null)[][]): boolean => {
  const pieces: Piece[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) pieces.push(piece);
    }
  }

  if (pieces.length === 2) return true; // King vs King
  if (pieces.length === 3) {
    return pieces.some(p => p.type === PieceType.Bishop || p.type === PieceType.Knight);
  }
  return false;
};

export const generateSAN = (move: Move, board: (Piece | null)[][]): string => {
  const { from, to, piece, capturedPiece, isCastling, isEnPassant } = move;
  const file = String.fromCharCode(97 + from.col);
  const rank = 8 - from.row;
  const targetFile = String.fromCharCode(97 + to.col);
  const targetRank = 8 - to.row;

  // Castling
  if (isCastling) {
    return to.col > from.col ? 'O-O' : 'O-O-O';
  }

  // Pawn moves
  if (piece.type === PieceType.Pawn) {
    if (capturedPiece || isEnPassant) {
      return `${file}x${targetFile}${targetRank}`;
    }
    return `${targetFile}${targetRank}`;
  }

  // Other pieces
  const pieceSymbol = {
    [PieceType.King]: 'K',
    [PieceType.Queen]: 'Q',
    [PieceType.Rook]: 'R',
    [PieceType.Bishop]: 'B',
    [PieceType.Knight]: 'N'
  }[piece.type];

  // Find if we need to specify file or rank
  let needsFile = false;
  let needsRank = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (p && p.type === piece.type && p.color === piece.color &&
          (r !== from.row || c !== from.col)) {
        const moves = getBasicMoves(board, { row: r, col: c }, p);
        if (moves.some(m => m.row === to.row && m.col === to.col)) {
          if (c !== from.col) needsFile = true;
          if (r !== from.row) needsRank = true;
        }
      }
    }
  }

  let san = pieceSymbol;
  if (needsFile) san += file;
  if (needsRank) san += rank;
  if (capturedPiece) san += 'x';
  san += `${targetFile}${targetRank}`;

  return san;
}; 