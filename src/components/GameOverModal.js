import React from 'react';
import './GameOverModal.css';

export default function GameOverModal({ gameOver, onPlayAgain }) {
  const isDraw = gameOver?.type === 'draw';
  const winnerName = gameOver?.winner === 'w' ? 'White' : gameOver?.winner === 'b' ? 'Black' : null;

  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="game-over-modal">
        <h2 id="game-over-title" className="game-over-title">
          Match Over
        </h2>
        {isDraw ? (
          <p className="game-over-message">Game Over: Draw</p>
        ) : (
          <p className="game-over-message">Checkmate! {winnerName} Wins!</p>
        )}
        <button type="button" className="game-over-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
