import React, { useState, useEffect } from 'react';
import { GameState, Move, Position, Color, PieceType, Piece } from '../types/chess';
import { initializeBoard, isKingInCheck, isCheckmate } from '../utils/chessLogic';
import { getAIMove } from '../utils/ai';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import styles from '../styles/ChessGame.module.css';

const ChessGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentTurn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    possibleMoves: [],
    selectedPiece: null,
    capturedPieces: {
      white: [],
      black: []
    }
  });

  const [promotionChoice, setPromotionChoice] = useState<{
    position: Position;
    color: Color;
  } | null>(null);

  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionChoice) return;

    const { position, color } = promotionChoice;
    const newBoard = gameState.board.map(row => [...row]);
    newBoard[position.row][position.col] = {
      type: pieceType,
      color,
      hasMoved: true
    };

    const nextTurn: Color = color === 'white' ? 'black' : 'white';
    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentTurn: nextTurn,
      isCheck: isKingInCheck(newBoard, nextTurn),
      isCheckmate: isCheckmate(newBoard, nextTurn)
    };

    setGameState(newGameState);
    setPromotionChoice(null);
  };

  const handleMove = (from: Position, to: Position) => {
    const piece = gameState.board[from.row][from.col];
    if (!piece) return;

    const capturedPiece = gameState.board[to.row][to.col];
    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined
    };

    const newBoard = gameState.board.map(row => [...row]);

    // Check for pawn promotion
    const isPromotion = piece.type === PieceType.Pawn && 
                       ((piece.color === 'white' && to.row === 0) || 
                        (piece.color === 'black' && to.row === 7));

    if (isPromotion) {
      setPromotionChoice({ position: to, color: piece.color });
      newBoard[to.row][to.col] = null;
      newBoard[from.row][from.col] = null;
    } else {
      // Update piece position
      newBoard[to.row][to.col] = {
        ...piece,
        hasMoved: true
      };
      newBoard[from.row][from.col] = null;
    }

    // Handle captured pieces
    if (capturedPiece) {
      const newCapturedPieces = {
        ...gameState.capturedPieces,
        [piece.color]: [...gameState.capturedPieces[piece.color], capturedPiece]
      };
      setGameState(prev => ({ ...prev, capturedPieces: newCapturedPieces }));
    }

    // Update game state
    const nextTurn: Color = gameState.currentTurn === 'white' ? 'black' : 'white';
    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentTurn: !isPromotion ? nextTurn : gameState.currentTurn,
      moveHistory: [...gameState.moveHistory, move],
      isCheck: !isPromotion && isKingInCheck(newBoard, nextTurn),
      isCheckmate: !isPromotion && isCheckmate(newBoard, nextTurn),
      possibleMoves: [],
      selectedPiece: null
    };

    setGameState(newGameState);

    // Handle game end
    if (newGameState.isCheckmate) {
      alert(`${gameState.currentTurn === 'white' ? 'White' : 'Black'} wins!`);
    }
  };

  // Handle AI moves
  useEffect(() => {
    if (gameState.currentTurn === 'black' && !gameState.isCheckmate && !promotionChoice) {
      const aiMove = getAIMove(gameState);
      if (aiMove) {
        handleMove(aiMove.from, aiMove.to);
      }
    }
  }, [gameState.currentTurn, promotionChoice]);

  const renderPromotionDialog = () => {
    if (!promotionChoice) return null;

    const promotionPieces = [
      PieceType.Queen,
      PieceType.Rook,
      PieceType.Bishop,
      PieceType.Knight
    ];

    return (
      <div className={styles.promotionDialog}>
        <div className={styles.promotionOptions}>
          {promotionPieces.map((pieceType) => (
            <button
              key={pieceType}
              className={styles.promotionOption}
              onClick={() => handlePromotion(pieceType)}
            >
              {getPieceSymbol(pieceType, promotionChoice.color)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameInfo}>
        {gameState.isCheck && <h3 className={styles.checkWarning}>Check!</h3>}
        {gameState.isCheckmate && <h3 className={styles.checkmateWarning}>Checkmate!</h3>}
      </div>

      <div className={styles.gameLayout}>
        <div className={styles.boardContainer}>
          <ChessBoard
            board={gameState.board}
            currentTurn={gameState.currentTurn}
            onMove={handleMove}
            isGameOver={gameState.isCheckmate}
          />
          {renderPromotionDialog()}
        </div>

        <GameInfo
          moveHistory={gameState.moveHistory}
          capturedPieces={gameState.capturedPieces}
          currentTurn={gameState.currentTurn}
        />
      </div>
    </div>
  );
};

const getPieceSymbol = (type: PieceType, color: Color): string => {
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

export default ChessGame; 