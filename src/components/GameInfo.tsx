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
  isAIThinking?: boolean;
  lastAIReasoning?: string;
}

const GameInfo: React.FC<GameInfoProps> = ({ moveHistory, capturedPieces, currentTurn, isAIThinking = false }) => {
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

  const sortPieces = (pieces: Piece[]): Piece[] => {
    const pieceValues: Record<PieceType, number> = {
      [PieceType.Queen]: 5,
      [PieceType.Rook]: 4,
      [PieceType.Bishop]: 3,
      [PieceType.Knight]: 2,
      [PieceType.Pawn]: 1,
      [PieceType.King]: 0
    };
    return [...pieces].sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);
  };

  return (
    <div className={styles.gameInfo}>
      <div className={styles.currentTurn}>
        <h3>
          Current Turn: {currentTurn === 'white' ? 'White' : 'Black'}
          {isAIThinking && <span className={styles.thinking}> (Thinking...)</span>}
        </h3>
      </div>
      
      <div className={styles.infoContainer}>
        <div className={styles.capturedPieces}>
          <div className={styles.capturedSection}>
            <h3>WHITE CAPTURED</h3>
            <div className={styles.pieces}>
              {sortPieces(capturedPieces.white).map((piece, index) => (
                <span key={index} className={`${styles.piece} ${styles.white}`} title={piece.type}>
                  {getPieceSymbol(piece)}
                </span>
              ))}
              {capturedPieces.white.length === 0 && (
                <span className={styles.emptyMessage}>No pieces captured</span>
              )}
            </div>
            {materialAdvantage > 0 && (
              <div className={styles.advantage}>+{materialAdvantage}</div>
            )}
          </div>
          
          <div className={styles.capturedSection}>
            <h3>BLACK CAPTURED</h3>
            <div className={styles.pieces}>
              {sortPieces(capturedPieces.black).map((piece, index) => (
                <span key={index} className={`${styles.piece} ${styles.black}`} title={piece.type}>
                  {getPieceSymbol(piece)}
                </span>
              ))}
              {capturedPieces.black.length === 0 && (
                <span className={styles.emptyMessage}>No pieces captured</span>
              )}
            </div>
            {materialAdvantage < 0 && (
              <div className={styles.advantage}>+{-materialAdvantage}</div>
            )}
          </div>
        </div>

        <div className={styles.moveHistory}>
          <h3>MOVE HISTORY</h3>
          <div className={styles.moves}>
            {moveHistory.length === 0 && (
              <span className={styles.emptyMessage}>No moves yet</span>
            )}
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, roundIndex) => {
              const whiteMove = moveHistory[roundIndex * 2];
              const blackMove = moveHistory[roundIndex * 2 + 1];
              return (
                <div key={roundIndex} className={styles.move}>
                  <span className={styles.moveNumber}>{roundIndex + 1}.</span>
                  {whiteMove && (
                    <span className={`${styles.moveNotation} ${styles.white}`}>
                      {getPieceSymbol(whiteMove.piece)}
                      {whiteMove.capturedPiece ? 'x' : ''}
                      {String.fromCharCode(97 + whiteMove.to.col)}
                      {8 - whiteMove.to.row}
                    </span>
                  )}
                  {blackMove && (
                    <span className={`${styles.moveNotation} ${styles.black}`}>
                      {getPieceSymbol(blackMove.piece)}
                      {blackMove.capturedPiece ? 'x' : ''}
                      {String.fromCharCode(97 + blackMove.to.col)}
                      {8 - blackMove.to.row}
                    </span>
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