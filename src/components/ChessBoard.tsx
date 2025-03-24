import React, { useState } from 'react';
import styles from '../styles/ChessBoard.module.css';
import { Piece, PieceType, Position, Color, Move } from '../types/chess';
import { getPossibleMoves, isKingInCheck } from '../utils/chessLogic';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface ChessBoardProps {
  board: (Piece | null)[][];
  currentTurn: Color;
  onMove: (from: Position, to: Position) => void;
  isGameOver: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ board, currentTurn, onMove, isGameOver }) => {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const handleSquareClick = (row: number, col: number) => {
    if (isGameOver) return;

    const clickedPiece = board[row][col];
    const position: Position = { row, col };
    
    // If a square is already selected
    if (selectedSquare) {
      // Check if the clicked square is a valid move
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);
      
      if (isValidMove) {
        onMove(selectedSquare, position);
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // If clicking on a different piece of the same color, select that piece instead
        if (clickedPiece?.color === currentTurn) {
          const moves = getPossibleMoves(board, position, clickedPiece, []);
          setSelectedSquare(position);
          setValidMoves(moves);
        } else {
          // Deselect if clicking on an invalid square
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select the piece if it's the current player's turn
      if (clickedPiece?.color === currentTurn) {
        const moves = getPossibleMoves(board, position, clickedPiece, []);
        setSelectedSquare(position);
        setValidMoves(moves);
      }
    }
  };

  const isValidMove = (row: number, col: number) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isSquareInCheck = (row: number, col: number) => {
    const piece = board[row][col];
    return piece?.type === PieceType.King && 
           piece.color === currentTurn && 
           isKingInCheck(board, currentTurn);
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.coordinates}>
        <div /> {/* Empty corner */}
        <div className={styles.files}>
          {FILES.map(file => (
            <span key={file} className={styles.fileLabel}>{file}</span>
          ))}
        </div>
        <div /> {/* Empty corner */}
        
        <div className={styles.ranks}>
          {RANKS.map(rank => (
            <span key={rank} className={styles.rankLabel}>{rank}</span>
          ))}
        </div>
        
        <div className={styles.board}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              {row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.square} ${isLight ? styles.light : styles.dark}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <div
                        className={`${styles.piece} ${styles[piece.color]}`}
                      >
                        {getPieceSymbol(piece.type)}
                      </div>
                    )}
                    {isSquareSelected(rowIndex, colIndex) && (
                      <div className={styles.selected} />
                    )}
                    {isValidMove(rowIndex, colIndex) && (
                      <div className={styles.validMove} />
                    )}
                    {isSquareInCheck(rowIndex, colIndex) && (
                      <div className={styles.check} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className={styles.ranks}>
          {RANKS.map(rank => (
            <span key={rank} className={styles.rankLabel}>{rank}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const getPieceSymbol = (type: PieceType): string => {
  switch (type) {
    case PieceType.King: return '♔';
    case PieceType.Queen: return '♕';
    case PieceType.Rook: return '♖';
    case PieceType.Bishop: return '♗';
    case PieceType.Knight: return '♘';
    case PieceType.Pawn: return '♙';
    default: return '';
  }
};

export default ChessBoard; 