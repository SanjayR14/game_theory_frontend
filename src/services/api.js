import axios from 'axios';

// const API_BASE = 'http://localhost:5000';
const API_BASE = 'https://game-theory-backend.onrender.com';

/**
 * Analyze position: get best move, payoff matrix, dominated moves.
 * @param {string} fen - FEN string
 * @returns {Promise<{ bestMove, payoffMatrix, dominatedMoves, turn, dominatedRows }>}
 */
export async function analyzePosition(fen) {
  const { data } = await axios.post(`${API_BASE}/api/analyze`, { fen });
  return data;
}

/**
 * Mock win probability from ML service (optional).
 * @param {string} fen - FEN string
 */
export async function getWinProbability(fen) {
  try {
    const { data } = await axios.post(`${API_BASE}/api/win-probability`, { fen });
    return data;
  } catch (e) {
    return { winProbability: 0.5, message: 'ML service unavailable', mock: true };
  }
}
