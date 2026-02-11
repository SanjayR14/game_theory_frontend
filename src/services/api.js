import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';

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
    const base = process.env.REACT_APP_ML_URL || 'http://localhost:5001';
    const { data } = await axios.post(`${base}/api/win-probability`, { fen });
    return data;
  } catch (e) {
    return { winProbability: 0.5, message: 'ML service unavailable', mock: true };
  }
}
