import React from 'react';
import './GameOverModal.css';

export default function GameOverModal({ gameOver, onPlayAgain }) {
  const isDraw = gameOver?.type === 'draw';
  const winnerName = gameOver?.winner === 'w' ? 'White' : gameOver?.winner === 'b' ? 'Black' : null;
  const reason =
    gameOver?.reason ||
    (gameOver?.type === 'checkmate'
      ? 'Checkmate'
      : gameOver?.type === 'stalemate'
        ? 'Stalemate'
        : gameOver?.type === 'timeout'
          ? 'Time Out'
          : 'Game Over');

  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="game-over-modal">
        <h2 id="game-over-title" className="game-over-title">
          Match Over
        </h2>
        {isDraw ? (
          <p className="game-over-message">Game Over: Draw ({reason})</p>
        ) : (
          <>
            {winnerName && (
              <p className="game-over-message">
                Winner: <strong>{winnerName}</strong>
              </p>
            )}
            <p className="game-over-submessage">Reason: {reason}</p>
          </>
        )}
        <button type="button" className="game-over-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
