import { Piece, Position, Move, GameState, PieceType, Color } from '../types/chess';
import { getPossibleMoves, isKingInCheck } from './chessLogic';
import { ChatGroq } from '@langchain/groq';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// Function to convert the chess board to FEN (Forsyth-Edwards Notation)
const boardToFEN = (board: (Piece | null)[][]): string => {
  let fen = '';
  
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        
        let pieceChar = '';
        switch (piece.type) {
          case PieceType.Pawn: pieceChar = 'p'; break;
          case PieceType.Knight: pieceChar = 'n'; break;
          case PieceType.Bishop: pieceChar = 'b'; break;
          case PieceType.Rook: pieceChar = 'r'; break;
          case PieceType.Queen: pieceChar = 'q'; break;
          case PieceType.King: pieceChar = 'k'; break;
        }
        
        fen += piece.color === 'white' ? pieceChar.toUpperCase() : pieceChar;
      }
    }
    
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    
    if (row < 7) {
      fen += '/';
    }
  }
  
  return fen;
};

// Function to create a visual ASCII representation of the chess board
const createBoardVisualization = (board: (Piece | null)[][]): string => {
  const symbols = {
    [PieceType.King]: { white: '♔', black: '♚' },
    [PieceType.Queen]: { white: '♕', black: '♛' },
    [PieceType.Rook]: { white: '♖', black: '♜' },
    [PieceType.Bishop]: { white: '♗', black: '♝' },
    [PieceType.Knight]: { white: '♘', black: '♞' },
    [PieceType.Pawn]: { white: '♙', black: '♟' }
  };
  
  let visualization = '  a b c d e f g h\n';
  visualization += '  +-+-+-+-+-+-+-+-+\n';
  
  for (let row = 0; row < 8; row++) {
    visualization += `${8-row}|`;
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece === null) {
        visualization += ' |';
      } else {
        visualization += `${symbols[piece.type][piece.color]}|`;
      }
    }
    
    visualization += `${8-row}\n`;
    visualization += '  +-+-+-+-+-+-+-+-+\n';
  }
  
  visualization += '  a b c d e f g h\n';
  return visualization;
};

// Function to analyze material balance
const analyzeMaterialBalance = (board: (Piece | null)[][]): string => {
  const pieceValues = {
    [PieceType.Pawn]: 1,
    [PieceType.Knight]: 3,
    [PieceType.Bishop]: 3,
    [PieceType.Rook]: 5,
    [PieceType.Queen]: 9,
    [PieceType.King]: 0
  };
  
  let whiteMaterial = 0;
  let blackMaterial = 0;
  
  // Count pieces and their values
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === 'white') {
          whiteMaterial += pieceValues[piece.type];
        } else {
          blackMaterial += pieceValues[piece.type];
        }
      }
    }
  }
  
  // Calculate advantage
  const advantage = whiteMaterial - blackMaterial;
  let analysisText = `Material balance: White ${whiteMaterial} - Black ${blackMaterial}`;
  if (advantage > 0) {
    analysisText += ` (White is ahead by ${advantage})`;
  } else if (advantage < 0) {
    analysisText += ` (Black is ahead by ${Math.abs(advantage)})`;
  } else {
    analysisText += ' (Equal material)';
  }
  
  return analysisText;
};

// Function to generate standard algebraic notation (SAN) for move history
const generateMoveHistory = (gameState: GameState): string => {
  if (gameState.moveHistory.length === 0) {
    return "No moves played yet.";
  }
  
  let history = '';
  for (let i = 0; i < gameState.moveHistory.length; i++) {
    const move = gameState.moveHistory[i];
    if (i % 2 === 0) {
      history += `${Math.floor(i/2) + 1}. `;
    }
    
    const from = positionToAlgebraic(move.from);
    const to = positionToAlgebraic(move.to);
    const pieceSymbol = move.piece.type === PieceType.Pawn ? '' : move.piece.type.charAt(0).toUpperCase();
    const captureSymbol = move.capturedPiece ? 'x' : '';
    
    const notation = `${pieceSymbol}${from}${captureSymbol}${to}`;
    history += `${notation} `;
    
    if (i % 2 === 1) {
      history += '\n';
    }
  }
  
  return history;
};

// Function to evaluate control of center squares
const evaluateCenterControl = (gameState: GameState): string => {
  const centerSquares = [
    { row: 3, col: 3 }, { row: 3, col: 4 },
    { row: 4, col: 3 }, { row: 4, col: 4 }
  ];
  
  let whiteControl = 0;
  let blackControl = 0;
  
  centerSquares.forEach(square => {
    // Check if a piece occupies the square
    const piece = gameState.board[square.row][square.col];
    if (piece) {
      if (piece.color === 'white') whiteControl++;
      else blackControl++;
    }
    
    // TODO: For a more sophisticated analysis, we could count how many pieces attack each center square
  });
  
  return `Center control: White: ${whiteControl}/4, Black: ${blackControl}/4`;
};

// Function to convert algebraic notation to position
const algebraicToPosition = (algebraic: string): Position => {
  const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(algebraic[1]);
  return { row, col };
};

// Function to convert position to algebraic notation
const positionToAlgebraic = (position: Position): string => {
  const col = String.fromCharCode('a'.charCodeAt(0) + position.col);
  const row = 8 - position.row;
  return `${col}${row}`;
};

// Function to get last move in algebraic notation
const getLastMoveAlgebraic = (gameState: GameState): string | null => {
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (!lastMove) return null;
  
  const from = positionToAlgebraic(lastMove.from);
  const to = positionToAlgebraic(lastMove.to);
  return `${from}${to}`;
};

// Function to get all valid moves for black in algebraic notation
const getAllValidMoves = (gameState: GameState): string[] => {
  const board = gameState.board;
  const validMoves: string[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === 'black') {
        const from = { row, col };
        const possibleMoves = getPossibleMoves(board, from, piece, gameState.moveHistory);
        
        possibleMoves.forEach(to => {
          const fromAlg = positionToAlgebraic(from);
          const toAlg = positionToAlgebraic(to);
          validMoves.push(`${fromAlg}${toAlg}`);
        });
      }
    }
  }

  return validMoves;
};

// Initialize Groq model
const initializeGroqModel = (customTemperature?: number) => {
  // Replace with your actual API key or fetch from environment variable
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  
  if (!apiKey) {
    console.error('No Groq API key found. Set the NEXT_PUBLIC_GROQ_API_KEY environment variable.');
    return null;
  }
  
  return new ChatGroq({
    apiKey,
    model: 'qwen-2.5-32b', // Use Llama 3.2 Vision model
    temperature: customTemperature ?? 0 // Lower temperature for more consistent chess moves
  });
};

// System prompt for chess AI
const CHESS_SYSTEM_PROMPT = `You are a chess engine playing as Black. Analyze the position and select a strong move.

Your response MUST be in this exact JSON format:
{
  "move": "e7e5",
  "reasoning": "Brief explanation"
}

Where "move" is exactly 4 characters (from-square to-square, e.g., "e7e5").`;

// Function to evaluate the position from black's perspective
const evaluatePosition = (board: (Piece | null)[][]): number => {
  const pieceValues = {
    [PieceType.Pawn]: 100,
    [PieceType.Knight]: 320,
    [PieceType.Bishop]: 330,
    [PieceType.Rook]: 500,
    [PieceType.Queen]: 900,
    [PieceType.King]: 20000
  };
  
  // Piece-square tables to encourage good piece positioning
  // Higher values are better for black
  const pawnTable = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ];
  
  const knightTable = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ];
  
  const bishopTable = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ];
  
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whitePosition = 0;
  let blackPosition = 0;
  
  // Count pieces and their values and positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const pieceValue = pieceValues[piece.type];
        
        if (piece.color === 'white') {
          whiteMaterial += pieceValue;
          
          // Add positional bonuses for white (from white's perspective)
          if (piece.type === PieceType.Pawn) {
            whitePosition += pawnTable[7 - row][col];
          } else if (piece.type === PieceType.Knight) {
            whitePosition += knightTable[7 - row][col];
          } else if (piece.type === PieceType.Bishop) {
            whitePosition += bishopTable[7 - row][col];
          }
        } else {
          blackMaterial += pieceValue;
          
          // Add positional bonuses for black (from black's perspective)
          if (piece.type === PieceType.Pawn) {
            blackPosition += pawnTable[row][col];
          } else if (piece.type === PieceType.Knight) {
            blackPosition += knightTable[row][col];
          } else if (piece.type === PieceType.Bishop) {
            blackPosition += bishopTable[row][col];
          }
        }
      }
    }
  }
  
  // Calculate the total evaluation from black's perspective
  // Higher number is better for black, lower is better for white
  const materialScore = blackMaterial - whiteMaterial;
  const positionalScore = blackPosition - whitePosition;
  const totalScore = materialScore + positionalScore;
  
  return totalScore;
};

// Function to generate the prompt for the AI
const generatePrompt = (gameState: GameState) => {
  const boardVisualization = createBoardVisualization(gameState.board);
  const lastMove = getLastMoveAlgebraic(gameState);
  const validMoves = getAllValidMoves(gameState);
  
  // Check for important game state information
  let gameStateInfo = '';
  if (gameState.isCheck) {
    gameStateInfo += 'BLACK KING IS IN CHECK! Address this threat.\n';
  }
  
  if (gameState.isCheckmate) {
    return `
GAME OVER - WHITE HAS WON.
${boardVisualization}

Checkmate. White has won. Please acknowledge:
{
  "move": "resign",
  "reasoning": "White won by checkmate."
}
`;
  }
  
  if (validMoves.length === 0) {
    return `
GAME OVER - STALEMATE.
${boardVisualization}

Stalemate. Draw. Please acknowledge:
{
  "move": "draw",
  "reasoning": "Draw by stalemate."
}
`;
  }
  
  return `
CURRENT POSITION:
${boardVisualization}

${gameStateInfo}
LAST MOVE BY WHITE: ${lastMove || 'None (first move)'}
VALID MOVES: ${validMoves.join(', ')}

Select your strongest move and respond with a valid JSON.
`;
};

// Function to validate and process the AI response
const processAIResponse = (response: string, gameState: GameState): Move | null => {
  try {
    // Clean up the response text before attempting to parse it
    const cleanedResponse = response
      .replace(/\n/g, ' ') // Replace all newlines with spaces
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove all control characters
      .replace(/Note:.*/g, ''); // Remove any "Note:" parts that might be added
    
    // Extract just the JSON part using a more forgiving regex without the 's' flag
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*?"move"\s*:\s*"[a-h][1-8][a-h][1-8]"[\s\S]*?"reasoning"\s*:[\s\S]*?\}/);
    
    if (!jsonMatch) {
      console.error('Invalid AI response format:', response);
      
      // Fallback approach: try to directly extract move if JSON parsing fails
      const moveMatch = response.match(/"move"\s*:\s*"([a-h][1-8][a-h][1-8])"/);
      if (moveMatch && moveMatch[1]) {
        console.log('Extracted move using fallback method:', moveMatch[1]);
        const move = moveMatch[1];
        const fromAlgebraic = move.substring(0, 2);
        const toAlgebraic = move.substring(2, 4);
        
        const from = algebraicToPosition(fromAlgebraic);
        const to = algebraicToPosition(toAlgebraic);
        
        // Get the piece at the 'from' position
        const piece = gameState.board[from.row][from.col];
        
        if (!piece || piece.color !== 'black') {
          console.error('Invalid move: No black piece at position', fromAlgebraic);
          return null;
        }
        
        // Check if the move is valid
        const possibleMoves = getPossibleMoves(gameState.board, from, piece, gameState.moveHistory);
        
        if (!possibleMoves.some(pos => pos.row === to.row && pos.col === to.col)) {
          console.error('Invalid move: Not a legal move for this piece');
          return null;
        }
        
        return {
          from,
          to,
          piece,
          capturedPiece: gameState.board[to.row][to.col] || undefined
        };
      }
      
      return null;
    }
    
    // Try to parse the JSON with error handling
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      
      // Create a minimal valid JSON with just the move
      const miniMatch = jsonMatch[0].match(/"move"\s*:\s*"([a-h][1-8][a-h][1-8])"/);
      if (miniMatch && miniMatch[1]) {
        console.log('Extracted move from broken JSON:', miniMatch[1]);
        parsedResponse = { move: miniMatch[1] };
      } else {
        return null;
      }
    }
    
    const move = parsedResponse.move;
    
    if (!move || typeof move !== 'string' || move.length !== 4) {
      console.error('Invalid move format in AI response:', move);
      return null;
    }
    
    const fromAlgebraic = move.substring(0, 2);
    const toAlgebraic = move.substring(2, 4);
    
    const from = algebraicToPosition(fromAlgebraic);
    const to = algebraicToPosition(toAlgebraic);
    
    // Get the piece at the 'from' position
    const piece = gameState.board[from.row][from.col];
    
    if (!piece || piece.color !== 'black') {
      console.error('Invalid move: No black piece at position', fromAlgebraic);
      return null;
    }
    
    // Check if the move is valid
    const possibleMoves = getPossibleMoves(gameState.board, from, piece, gameState.moveHistory);
    
    if (!possibleMoves.some(pos => pos.row === to.row && pos.col === to.col)) {
      console.error('Invalid move: Not a legal move for this piece');
      return null;
    }
    
    return {
      from,
      to,
      piece,
      capturedPiece: gameState.board[to.row][to.col] || undefined
    };
  } catch (error) {
    console.error('Error processing AI response:', error);
    return null;
  }
};

// Main function to get AI move using Groq LLM
export const getAIMove = async (gameState: GameState, retryCount = 0): Promise<{ move: Move | null, reasoning?: string }> => {
  try {
    // If the game is already over, no need to get a move
    if (gameState.isCheckmate || getAllValidMoves(gameState).length === 0) {
      console.log("Game is already over, no need for AI move");
      return { move: null };
    }

    // Lower temperature on retries to increase determinism
    const temperature = retryCount > 0 ? 0 : 0.2;
    const model = initializeGroqModel(temperature);
    
    if (!model) {
      console.error('Failed to initialize Groq model');
      return { move: null };
    }
    
    const prompt = generatePrompt(gameState);
    
    // Create a proper message structure for the chat model
    const messages = [
      {
        role: "system", 
        content: CHESS_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    console.log(`Asking chess engine for a move... (retry: ${retryCount}, temp: ${temperature})`);
    
    try {
      // Pass the messages directly to the model
      const result = await model.invoke(messages);
      const responseText = result.content.toString();
      console.log("Chess engine response:", responseText);
      
      // Handle resignation or draw acknowledgement
      if (responseText.includes('"move": "resign"') || responseText.includes('"move": "draw"')) {
        console.log("AI acknowledges game over state");
        
        // Extract reasoning if available
        const reasoningMatch = responseText.match(/"reasoning"\s*:\s*"([^"]+)"/);
        const reasoning = reasoningMatch ? reasoningMatch[1] : "Game over.";
        
        return { 
          move: null, 
          reasoning
        };
      }
      
      // Process and validate the AI response
      const move = processAIResponse(responseText, gameState);
      
      // Extract reasoning if available
      const reasoningMatch = responseText.match(/"reasoning"\s*:\s*"([^"]+)"/);
      let reasoning = reasoningMatch ? reasoningMatch[1] : undefined;
      
      // Format the reasoning for better display
      if (reasoning) {
        // Get information about captured piece if any
        const capturedPiece = move?.capturedPiece;
        const captureInfo = capturedPiece 
          ? `Captured ${capturedPiece.type} at ${positionToAlgebraic(move.to)}.` 
          : '';
        
        // Format move in readable notation
        const fromAlg = move ? positionToAlgebraic(move.from) : '';
        const toAlg = move ? positionToAlgebraic(move.to) : '';
        const moveNotation = move ? `${fromAlg} → ${toAlg}` : '';
        
        // Create nicely formatted reasoning
        reasoning = `Move: ${moveNotation}\n${captureInfo ? captureInfo + '\n' : ''}Reasoning: ${reasoning}`;
      }
      
      if (move) {
        console.log("Selected move:", 
          positionToAlgebraic(move.from) + positionToAlgebraic(move.to));
        return { 
          move, 
          reasoning
        };
      } else {
        console.error("Generated an invalid move, waiting for retry");
        
        // Retry with lower temperature if we haven't exceeded max retries (3)
        if (retryCount < 3) {
          console.log(`Retrying AI move generation (${retryCount + 1}/3)...`);
          
          // Add a system message for better formatting in the retry
          messages.push({
            role: "system",
            content: "Please respond with valid JSON format. The response must include a 'move' in the format 'e7e5' and a 'reasoning'."
          });
          
          return getAIMove(gameState, retryCount + 1);
        } else {
          // We've exceeded max retries, try a random valid move as fallback
          console.error("Failed to get valid AI move after 3 retries. Selecting a random valid move.");
          const randomMove = selectRandomValidMove(gameState);
          return { 
            move: randomMove, 
            reasoning: "Fallback random move selected."
          };
        }
      }
    } catch (chainError) {
      console.error('Error in LangChain pipeline:', chainError);
      
      // Retry on API errors too
      if (retryCount < 3) {
        console.log(`Retrying AI move generation after error (${retryCount + 1}/3)...`);
        return getAIMove(gameState, retryCount + 1);
      }
      return { move: null };
    }
  } catch (error) {
    console.error('Error getting AI move:', error);
    return { move: null };
  }
};

// Fallback function to select a random valid move when AI fails
const selectRandomValidMove = (gameState: GameState): Move | null => {
  const board = gameState.board;
  const validMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === 'black') {
        const from = { row, col };
        const possibleMoves = getPossibleMoves(board, from, piece, gameState.moveHistory);
        
        possibleMoves.forEach(to => {
          validMoves.push({
            from,
            to,
            piece,
            capturedPiece: board[to.row][to.col] || undefined
          });
        });
      }
    }
  }

  if (validMoves.length === 0) {
    return null;
  }

  // Select a random move, preferring captures and checks if possible
  const captureMoves = validMoves.filter(move => move.capturedPiece);
  if (captureMoves.length > 0) {
    return captureMoves[Math.floor(Math.random() * captureMoves.length)];
  }
  
  return validMoves[Math.floor(Math.random() * validMoves.length)];
}; 