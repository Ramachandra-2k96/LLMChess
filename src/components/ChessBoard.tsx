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
  isAIThinking?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ board, currentTurn, onMove, isGameOver, isAIThinking = false }) => {
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const handleSquareClick = (row: number, col: number) => {
    // Prevent interaction if game is over or AI is thinking
    if (isGameOver || isAIThinking) return;
    
    // Prevent selecting black pieces to move (but allow targeting them for capture)
    const clickedPiece = board[row][col];
    const position: Position = { row, col };
    
    // If a square is already selected
    if (selectedSquare) {
      // Check if the clicked square is a valid move
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);
      
      if (isValidMove) {
        // Make the move (this can be a capture of a black piece)
        onMove(selectedSquare, position);
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // If clicking on another white piece when it's white's turn, select that piece instead
        if (clickedPiece?.color === 'white' && currentTurn === 'white') {
          const moves = getPossibleMoves(board, position, clickedPiece, []);
          setSelectedSquare(position);
          setValidMoves(moves);
        } else {
          // Deselect if clicking elsewhere
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Initial selection - only allow selecting white pieces on white's turn
      if (clickedPiece?.color === 'white' && currentTurn === 'white') {
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
                        {getPieceSymbol(piece.type, piece.color)}
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

const getPieceSymbol = (type: PieceType, color: Color = 'white'): string => {
  const symbols: Record<PieceType, { white: string; black: string }> = {
    [PieceType.King]: { white: '♔', black: '♚' },
    [PieceType.Queen]: { white: '♕', black: '♛' },
    [PieceType.Rook]: { white: '♖', black: '♜' },
    [PieceType.Bishop]: { white: '♗', black: '♝' },
    [PieceType.Knight]: { white: '♘', black: '♞' },
    [PieceType.Pawn]: { white: '♙', black: '♟' }
  };
  return symbols[type][color];
};

export default ChessBoard; 