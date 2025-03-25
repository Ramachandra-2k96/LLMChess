import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { GameState, Move, Position, Color, PieceType, Piece } from '../types/chess';
import { 
  initializeBoard, 
  isKingInCheck, 
  isCheckmate,
  isStalemate,
  isInsufficientMaterial,
  generateSAN
} from '../utils/chessLogic';
import { getAIMove } from '../utils/ai';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import AIChat from './AIChat';
import styles from '../styles/ChessGame.module.css';
import chatStyles from '../styles/AIChat.module.css';

const ChessGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentTurn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    possibleMoves: [],
    selectedPiece: null,
    capturedPieces: {
      white: [],
      black: []
    },
    halfMoveClock: 0,
    fullMoveNumber: 1,
    lastAIReasoning: undefined,
    aiReasoning: []
  });

  const [promotionChoice, setPromotionChoice] = useState<{
    position: Position;
    color: Color;
  } | null>(null);
  
  // Add state to track when AI is thinking
  const [isAIThinking, setIsAIThinking] = useState(false);

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

    // Check for special moves
    const isCastling = piece.type === PieceType.King && Math.abs(to.col - from.col) === 2;
    const isEnPassant = piece.type === PieceType.Pawn && 
                       Math.abs(to.col - from.col) === 1 && 
                       !capturedPiece;

    // Handle castling
    if (isCastling) {
      const isKingside = to.col > from.col;
      const rookFromCol = isKingside ? 7 : 0;
      const rookToCol = isKingside ? to.col - 1 : to.col + 1;
      const rook = newBoard[from.row][rookFromCol];
      
      if (rook) {
        newBoard[from.row][rookToCol] = { ...rook, hasMoved: true };
        newBoard[from.row][rookFromCol] = null;
      }
    }

    // Handle en passant
    if (isEnPassant) {
      const capturedPawnRow = from.row;
      const capturedPawnCol = to.col;
      const capturedPawnPiece = newBoard[capturedPawnRow][capturedPawnCol];
      move.capturedPiece = capturedPawnPiece || undefined;
      newBoard[capturedPawnRow][capturedPawnCol] = null;
    }

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
        hasMoved: true,
        canBeEnPassant: piece.type === PieceType.Pawn && Math.abs(to.row - from.row) === 2
      };
      newBoard[from.row][from.col] = null;
    }

    // Update game state
    const nextTurn: Color = gameState.currentTurn === 'white' ? 'black' : 'white';
    
    // Handle captured pieces
    const newCapturedPieces = { ...gameState.capturedPieces };
    if (move.capturedPiece) {
      const capturedBy = piece.color;
      const oppositeColor = capturedBy === 'white' ? 'black' : 'white';
      newCapturedPieces[oppositeColor] = [...newCapturedPieces[oppositeColor], move.capturedPiece];
    }

    // Generate SAN notation
    move.notation = generateSAN(move, newBoard);

    const newGameState: GameState = {
      ...gameState,
      board: newBoard,
      currentTurn: !isPromotion ? nextTurn : gameState.currentTurn,
      moveHistory: [...gameState.moveHistory, move],
      isCheck: !isPromotion && isKingInCheck(newBoard, nextTurn),
      isCheckmate: !isPromotion && isCheckmate(newBoard, nextTurn),
      possibleMoves: [],
      selectedPiece: null,
      capturedPieces: newCapturedPieces,
      lastMove: move,
      halfMoveClock: (piece.type === PieceType.Pawn || move.capturedPiece) ? 0 : gameState.halfMoveClock + 1,
      fullMoveNumber: nextTurn === 'white' ? gameState.fullMoveNumber + 1 : gameState.fullMoveNumber
    };

    setGameState(newGameState);

    // Handle game end
    if (newGameState.isCheckmate) {
      alert(`${gameState.currentTurn === 'white' ? 'White' : 'Black'} wins!`);
    } else if (isStalemate(newBoard, nextTurn)) {
      alert('Stalemate! The game is a draw.');
    } else if (isInsufficientMaterial(newBoard)) {
      alert('Insufficient material! The game is a draw.');
    } else if (newGameState.halfMoveClock >= 50) {
      alert('50-move rule! The game is a draw.');
    }
  };

  // Handle AI moves
  useEffect(() => {
    if (gameState.currentTurn === 'black' && !gameState.isCheckmate && !promotionChoice) {
      const makeAIMove = async () => {
        try {
          // Set AI thinking state to true
          setIsAIThinking(true);
          
          // Show loading indicator
          const loadingToast = toast.loading('Chess engine is thinking...', {
            style: {
              background: '#333',
              color: '#fff',
            },
          });
          
          // Try up to 3 times if the AI returns null
          let aiMoveResult = null;
          let attempts = 0;
          
          while (!aiMoveResult?.move && attempts < 3) {
            attempts++;
            aiMoveResult = await getAIMove(gameState);
            
            if (!aiMoveResult?.move && attempts < 3) {
              console.log(`Retry attempt ${attempts + 1}/3 for AI move`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Dismiss loading indicator
          toast.dismiss(loadingToast);
          
          // Clear previous reasoning if the move failed
          if (!aiMoveResult?.move) {
            setGameState(prevState => ({
              ...prevState,
              lastAIReasoning: undefined
            }));
          }
          
          // Update reasoning if we have it, regardless of move success
          if (aiMoveResult?.reasoning) {
            console.log("SAVING AI REASONING TO GAME STATE:", aiMoveResult.reasoning);
            setGameState(prevState => ({
              ...prevState,
              lastAIReasoning: aiMoveResult.reasoning
            }));
          }
          
          if (aiMoveResult?.move) {
            // Show AI move notification
            toast.success(`Chess engine moves!`, {
              duration: 1500,
              style: {
                background: '#333',
                color: '#fff',
              },
            });
            
            // Handle the move after a short delay to ensure reasoning is processed
            const move = aiMoveResult.move;
            setTimeout(() => {
              handleMove(move.from, move.to);
            }, 100);
          } else {
            // Handle failed move attempts
            if (gameState.isCheckmate) {
              toast.success('Checkmate! You win!', {
                duration: 3000,
                style: {
                  background: '#4CAF50',
                  color: '#fff',
                },
              });
            } else if (isStalemate(gameState.board, 'black')) {
              toast.success('Stalemate! Game is a draw.', {
                duration: 3000,
                style: {
                  background: '#2196F3',
                  color: '#fff',
                },
              });
            } else {
              toast.error('Chess engine couldn\'t make a valid move', {
                duration: 3000,
                style: {
                  background: '#d32f2f',
                  color: '#fff',
                },
              });
              console.error('AI failed to generate a valid move after 3 attempts');
            }
          }
        } catch (error) {
          console.error('Error making AI move:', error);
          // Clear reasoning on error
          setGameState(prevState => ({
            ...prevState,
            lastAIReasoning: undefined
          }));
          
          toast.error('Error connecting to AI service', {
            duration: 3000,
            style: {
              background: '#d32f2f',
              color: '#fff',
            },
          });
        } finally {
          // Always set AI thinking state to false when done
          setIsAIThinking(false);
        }
      };
      
      makeAIMove();
    }
  }, [gameState.currentTurn, promotionChoice]);

  // Add useEffect to show toast notifications when check or checkmate occurs
  useEffect(() => {
    if (gameState.isCheck && !gameState.isCheckmate) {
      toast('Check!', {
        icon: '⚠️',
        style: {
          background: '#ffd700',
          color: '#000',
          fontWeight: 'bold',
        },
        duration: 2000,
      });
    }
    if (gameState.isCheckmate) {
      toast('Checkmate!', {
        icon: '👑',
        style: {
          background: '#ff4444',
          color: '#fff',
          fontWeight: 'bold',
        },
        duration: 3000,
      });
    }
  }, [gameState.isCheck, gameState.isCheckmate]);

  return (
    <div className={styles.gameContainer}>
      <Toaster />
      
      {promotionChoice && (
        <div className={styles.promotionModal}>
          <div className={styles.promotionOptions}>
            <h3>Choose promotion piece:</h3>
            <div className={styles.options}>
              <button onClick={() => handlePromotion(PieceType.Queen)}>
                {promotionChoice.color === 'white' ? '♕' : '♛'}
              </button>
              <button onClick={() => handlePromotion(PieceType.Rook)}>
                {promotionChoice.color === 'white' ? '♖' : '♜'}
              </button>
              <button onClick={() => handlePromotion(PieceType.Bishop)}>
                {promotionChoice.color === 'white' ? '♗' : '♝'}
              </button>
              <button onClick={() => handlePromotion(PieceType.Knight)}>
                {promotionChoice.color === 'white' ? '♘' : '♞'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.gameBoard}>
        <ChessBoard 
          board={gameState.board} 
          currentTurn={gameState.currentTurn} 
          onMove={handleMove} 
          isGameOver={gameState.isCheckmate} 
          isAIThinking={isAIThinking}
        />
      </div>
      
      <GameInfo 
        moveHistory={gameState.moveHistory}
        capturedPieces={gameState.capturedPieces}
        currentTurn={gameState.currentTurn}
        isAIThinking={isAIThinking}
        lastAIReasoning={gameState.lastAIReasoning}
      />
      
      {/* AIChat for displaying chess engine's thoughts */}
      <AIChat 
        reasoning={gameState.lastAIReasoning}
        isAIThinking={isAIThinking}
      />
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