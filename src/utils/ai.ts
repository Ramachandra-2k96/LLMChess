import { Piece, Position, Move, GameState, PieceType, Color } from '../types/chess';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { ChatGroq } from '@langchain/groq';
import { getPossibleMoves } from './chessLogic';

// Convert our board state to FEN notation
const boardToFEN = (gameState: GameState): string => {
  const chess = new Chess();
  
  // Convert our board to chess.js format
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece) {
        const file = String.fromCharCode(97 + col);
        const rank = 8 - row;
        const pieceChar = piece.type.charAt(0).toLowerCase() as PieceSymbol;
        const color = piece.color === 'white' ? 'w' : 'b';
        chess.put({ type: pieceChar, color }, `${file}${rank}` as Square);
      }
    }
  }
  
  return chess.fen();
};

// Analyze the position for strategic insights
const analyzePosition = (gameState: GameState): string => {
  const chess = new Chess(boardToFEN(gameState));
  const analysis: string[] = [];
  
  // Material balance
  const material = {
    w: chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => sum + (piece ? 1 : 0), 0), 0),
    b: chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => sum + (piece ? 1 : 0), 0), 0)
  };
  
  if (material.b > material.w) {
    analysis.push(`Black has a material advantage of ${(material.b - material.w).toFixed(1)} pawns`);
  } else if (material.w > material.b) {
    analysis.push(`White has a material advantage of ${(material.w - material.b).toFixed(1)} pawns`);
  }
  
  // Center control
  const centerSquares: Square[] = ['d4', 'd5', 'e4', 'e5'];
  const blackCenterControl = centerSquares.filter(sq => {
    const piece = chess.get(sq);
    return piece && piece.color === 'b';
  }).length;
  const whiteCenterControl = centerSquares.filter(sq => {
    const piece = chess.get(sq);
    return piece && piece.color === 'w';
  }).length;
  
  if (blackCenterControl > whiteCenterControl) {
    analysis.push(`Black controls the center (${blackCenterControl} vs ${whiteCenterControl} squares)`);
  } else if (whiteCenterControl > blackCenterControl) {
    analysis.push(`White controls the center (${whiteCenterControl} vs ${blackCenterControl} squares)`);
  }
  
  // Piece development
  const blackPieces = chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => 
    sum + (piece && piece.color === 'b' ? 1 : 0), 0), 0);
  const whitePieces = chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => 
    sum + (piece && piece.color === 'w' ? 1 : 0), 0), 0);
  
  if (blackPieces > whitePieces) {
    analysis.push(`Black has more pieces developed (${blackPieces} vs ${whitePieces})`);
  } else if (whitePieces > blackPieces) {
    analysis.push(`White has more pieces developed (${whitePieces} vs ${blackPieces})`);
  }
  
  // Pawn structure
  const blackPawns = chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => 
    sum + (piece && piece.color === 'b' && piece.type === 'p' ? 1 : 0), 0), 0);
  const whitePawns = chess.board().reduce((acc, row) => acc + row.reduce((sum, piece) => 
    sum + (piece && piece.color === 'w' && piece.type === 'p' ? 1 : 0), 0), 0);
  
  if (blackPawns > whitePawns) {
    analysis.push(`Black has a stronger pawn structure (${blackPawns} vs ${whitePawns} pawns)`);
  } else if (whitePawns > blackPawns) {
    analysis.push(`White has a stronger pawn structure (${whitePawns} vs ${blackPawns} pawns)`);
  }
  
  return analysis.join('\n');
};

// Get all valid moves for black
const getValidMoves = (gameState: GameState): Move[] => {
  const validMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.color === 'black') {
        const from = { row, col };
        const possibleMoves = getPossibleMoves(gameState.board, from, piece, gameState.moveHistory);
        
        possibleMoves.forEach((to: Position) => {
          validMoves.push({
            from,
            to,
            piece,
            capturedPiece: gameState.board[to.row][to.col] || undefined
          });
        });
      }
    }
  }

  return validMoves;
};

// Main function to get AI move
export const getAIMove = async (gameState: GameState): Promise<{ move: Move | null, reasoning?: string }> => {
  try {
    // If the game is over, no need to get a move
    if (gameState.isCheckmate || gameState.moveHistory.length === 0) {
      return { move: null };
    }
    
    // Get position analysis
    const analysis = analyzePosition(gameState);
    
    // Get all valid moves
    const validMoves = getValidMoves(gameState);
    
    if (validMoves.length === 0) {
      return { move: null };
    }
    
    // Generate reasoning using Groq
    const model = new ChatGroq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
      model: 'llama-3.3-70b-specdec',
      temperature: 0
    });
    
    // Format move history with previous reasoning
    const moveHistory = gameState.moveHistory.map((move, index) => {
      const moveStr = `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`;
      const reasoning = index % 2 === 0 ? "White's move" : gameState.aiReasoning?.[Math.floor(index/2)] || "Black's move";
      return `${moveStr} - ${reasoning}`;
    }).reverse().join('\n');  // Reverse the array to show most recent moves first
    
    const prompt = `You are a chess grandmaster playing as Black with a history of decisive wins. Your objective is to force a victory by exploiting tactical vulnerabilities and maximizing strategic advantages to create unavoidable threats. Analyze the current position rigorously and anticipate your opponent's counterplay.

Game State Details:

Previous moves and your reasoning (most recent first):
${moveHistory}

Current position analysis:
${analysis}

Legal moves available (detailed descriptions):
${validMoves.map(move => `${move.piece.type} from ${String.fromCharCode(97 + move.from.col)}${8 - move.from.row} to ${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`).join('\n')}

Strategic factors to consider:
1. Material balance and opportunities for calculated sacrifices.
2. Piece activity and coordination aimed at creating overwhelming pressure.
3. King safety, with emphasis on exploiting any weaknesses in your opponent's position.
4. Dominance in the center and open lines to mobilize forces effectively.
5. Pawn structure weaknesses, such as isolated or doubled pawns, to target.
6. Long-term strategic goals including outposts, enhanced piece coordination, and space control.
7. Immediate tactical opportunities like forks, pins, skewers, discovered attacks, and forcing sequences.
8. Creating mating nets and decisive threats that limit your opponent's viable responses.
9. Psychological pressure by forcing your opponent into highly constrained and vulnerable positions.

Your response MUST be in EXACT JSON format:
{
  "move": "e7e5",  // Replace with your chosen move in exactly 4 characters (from-square to-square, e.g., "e7e5").
  "reasoning": "This move [specific strategic action] to [clear objective]."
}

Where "move" must be exactly 4 characters and "reasoning" is a single, clear sentence starting with "This move". Your analysis must lead to a decisive advantage that forces a win.`;

    
    const result = await model.invoke(prompt);
    const response = result.content.toString();
    
    // Parse the response
    try {
      const parsed = JSON.parse(response);
      const moveStr = parsed.move;
      
      // Convert algebraic notation to Position format
      const fromCol = moveStr.charCodeAt(0) - 97;
      const fromRow = 8 - parseInt(moveStr[1]);
      const toCol = moveStr.charCodeAt(2) - 97;
      const toRow = 8 - parseInt(moveStr[3]);
      
      const move = validMoves.find(m => 
        m.from.row === fromRow && 
        m.from.col === fromCol && 
        m.to.row === toRow && 
        m.to.col === toCol
      );
      
      if (move) {
        return { move, reasoning: parsed.reasoning };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }
    
    // If we couldn't parse the response or find a valid move, select a random valid move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { 
      move: randomMove, 
      reasoning: "Selected a valid move after AI analysis failed." 
    };
    
  } catch (error) {
    console.error('Error getting AI move:', error);
    return { move: null };
  }
}; 