import React from 'react';
import { Move, Piece, Color, PieceType } from '../types/chess';
import styles from '../styles/GameInfo.module.css';

interface GameInfoProps {
  moveHistory: Move[];
  capturedPieces: {
    white: Piece[];
    black: Piece[];
  };
  currentTurn: Color;
}

const GameInfo: React.FC<GameInfoProps> = ({ moveHistory, capturedPieces, currentTurn }) => {
  const getPieceSymbol = (piece: Piece): string => {
    const symbols: Record<PieceType, { white: string; black: string }> = {
      [PieceType.King]: { white: '♔', black: '♚' },
      [PieceType.Queen]: { white: '♕', black: '♛' },
      [PieceType.Rook]: { white: '♖', black: '♜' },
      [PieceType.Bishop]: { white: '♗', black: '♝' },
      [PieceType.Knight]: { white: '♘', black: '♞' },
      [PieceType.Pawn]: { white: '♙', black: '♟' }
    };
    return symbols[piece.type][piece.color];
  };

  const getMoveNotation = (move: Move): string => {
    const pieceSymbol = move.piece.type === PieceType.Pawn ? '' : getPieceSymbol(move.piece);
    const captureSymbol = move.capturedPiece ? 'x' : '';
    const fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const toSquare = `${fileNames[move.to.col]}${8 - move.to.row}`;
    const fromSquare = move.piece.type === PieceType.Pawn && captureSymbol ? 
                      fileNames[move.from.col] : '';
    const promotionSymbol = move.promotion ? `=${getPieceSymbol({ ...move.piece, type: move.promotion })}` : '';

    return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}${promotionSymbol}`;
  };

  const calculateMaterialAdvantage = (pieces: Piece[]): number => {
    const values: Record<PieceType, number> = {
      [PieceType.Pawn]: 1,
      [PieceType.Knight]: 3,
      [PieceType.Bishop]: 3,
      [PieceType.Rook]: 5,
      [PieceType.Queen]: 9,
      [PieceType.King]: 0
    };
    return pieces.reduce((sum, piece) => sum + values[piece.type], 0);
  };

  const whiteMaterial = calculateMaterialAdvantage(capturedPieces.white);
  const blackMaterial = calculateMaterialAdvantage(capturedPieces.black);
  const materialAdvantage = whiteMaterial - blackMaterial;

  return (
    <div className={styles.gameInfo}>
      <div className={styles.currentTurn}>
        <h3>Current Turn: {currentTurn === 'white' ? 'White' : 'Black'}</h3>
      </div>
      
      <div className={styles.infoContainer}>
        <div className={styles.capturedPieces}>
          <div className={styles.capturedSection}>
            <h3>White Captured</h3>
            <div className={styles.pieces}>
              {capturedPieces.white
                .sort((a, b) => calculateMaterialAdvantage([b]) - calculateMaterialAdvantage([a]))
                .map((piece, index) => (
                  <span key={index} className={styles.piece} title={piece.type}>
                    {getPieceSymbol(piece)}
                  </span>
                ))}
            </div>
            {materialAdvantage > 0 && (
              <div className={styles.advantage}>+{materialAdvantage}</div>
            )}
          </div>
          <div className={styles.capturedSection}>
            <h3>Black Captured</h3>
            <div className={styles.pieces}>
              {capturedPieces.black
                .sort((a, b) => calculateMaterialAdvantage([b]) - calculateMaterialAdvantage([a]))
                .map((piece, index) => (
                  <span key={index} className={styles.piece} title={piece.type}>
                    {getPieceSymbol(piece)}
                  </span>
                ))}
            </div>
            {materialAdvantage < 0 && (
              <div className={styles.advantage}>+{-materialAdvantage}</div>
            )}
          </div>
        </div>

        <div className={styles.moveHistory}>
          <h3>Move History</h3>
          <div className={styles.moves}>
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, index) => {
              const whiteMove = moveHistory[index * 2];
              const blackMove = moveHistory[index * 2 + 1];
              return (
                <div key={index} className={styles.movePair}>
                  <span className={styles.moveNumber}>{index + 1}.</span>
                  <span className={styles.move}>{getMoveNotation(whiteMove)}</span>
                  {blackMove && (
                    <span className={styles.move}>{getMoveNotation(blackMove)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameInfo; 