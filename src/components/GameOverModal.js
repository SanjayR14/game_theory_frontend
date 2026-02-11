import React from 'react';

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="bg-github-surface border border-github-border rounded-xl p-6 sm:p-8 max-w-[360px] w-full text-center shadow-2xl mx-4">
        <h2 id="game-over-title" className="text-xl sm:text-2xl font-bold text-github-text mb-4">
          Match Over
        </h2>
        {isDraw ? (
          <p className="text-[#c9d1d9] text-base sm:text-lg mb-6">Game Over: Draw ({reason})</p>
        ) : (
          <>
            {winnerName && (
              <p className="text-[#c9d1d9] text-base sm:text-lg mb-2">
                Winner: <strong>{winnerName}</strong>
              </p>
            )}
            <p className="text-[#c9d1d9] text-sm sm:text-base mb-6">Reason: {reason}</p>
          </>
        )}
        <button
          type="button"
          className="w-full sm:w-auto font-semibold text-[#0d1117] bg-github-accent rounded-lg py-2.5 px-6 hover:bg-github-accent-hover transition-colors cursor-pointer"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
