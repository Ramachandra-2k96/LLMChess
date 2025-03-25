# Chess Game with Llama 3.2 AI

A chess game application built with Next.js, React, and TypeScript, featuring an intelligent opponent powered exclusively by Groq's Llama 3.2 vision model.

## Features

- Full chess game implementation with all standard rules
- AI opponent powered by Llama 3.2 vision model via Groq API
- Visual board representation with move highlighting
- Move history and captured pieces tracking
- Check and checkmate detection
- Human player plays as White, Llama 3.2 plays as Black

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the root directory with your Groq API key:
   ```
   NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
   ```
   Get your Groq API key by signing up at [https://console.groq.com](https://console.groq.com)

4. Start the development server:
   ```
   npm run dev
   ```
   
5. Open [http://localhost:3000](http://localhost:3000) in your browser to start playing!

## How it works

This chess game is a direct interface to Llama 3.2 - the LLM is responsible for all Black moves with no algorithmic fallbacks.

The AI integration uses:
- Groq API with the Llama 3.2 11B vision model
- LangChain for prompt engineering and response processing
- FEN notation to represent the chess board state
- Structured output for move generation

When it's the AI's turn:
1. The current board state is converted to FEN notation
2. A list of all valid moves is generated
3. The board state, previous move, and valid moves are sent to the Llama 3.2 model
4. Llama 3.2 responds with its chosen move and reasoning in JSON format
5. The move is validated and executed on the board

This creates a genuine "Human vs. LLM" chess experience where you can test your skills against Llama 3.2's chess understanding.

## License

MIT
