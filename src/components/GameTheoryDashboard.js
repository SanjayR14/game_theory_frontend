import React, { useState } from 'react';
import { analyzePosition, getWinProbability } from '../services/api';
import PayoffMatrix from './PayoffMatrix';

export default function GameTheoryDashboard({ fen, turn, gameOver, stats }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [winProb, setWinProb] = useState(null);

  const runAnalysis = async () => {
    if (!fen) return;
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzePosition(fen);
      setResult(analysis);
      if (analysis.gameOver) {
        if (analysis.checkmate && analysis.winner) {
          const winnerName = analysis.winner === 'w' ? 'White' : 'Black';
          setWinProb({
            message: `${winnerName} has a 100% chance of winning (Checkmate).`,
            winProbability: analysis.winner === 'w' ? 1 : 0,
            mock: false,
          });
        } else if (analysis.draw) {
          setWinProb({
            message: 'Game Over: Draw.',
            winProbability: 0.5,
            mock: false,
          });
        } else {
          setWinProb({ message: '—', winProbability: 0.5, mock: true });
        }
      } else {
        const prob = await getWinProbability(fen).catch(() => ({ winProbability: 0.5, message: '—', mock: true }));
        setWinProb(prob);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Optional: run when fen changes (e.g. for "real-time"). Omitted to avoid excessive requests.
  // useEffect(() => { if (fen) runAnalysis(); }, [fen]);

  return (
    <aside className="w-full h-full overflow-y-auto bg-github-surface border-t lg:border-t-0 lg:border-l border-github-border p-5 rounded-lg lg:rounded-l-none">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-github-text mb-3">Game Theory Dashboard</h2>
        <button
          type="button"
          className="w-full py-2.5 px-4 text-sm font-semibold text-[#0d1117] bg-github-accent rounded-md hover:bg-github-accent-hover disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-github-accent transition-colors"
          onClick={runAnalysis}
          disabled={loading || !fen || !!gameOver}
        >
          {loading ? 'Analyzing…' : 'Analyze position'}
        </button>
      </header>

      {error && (
        <div className="py-3 px-4 bg-red-500/15 border border-github-error rounded-md text-github-error text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.gameOver && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Terminal state</h3>
              <p className="text-[#c9d1d9] text-[0.95rem]">
                {result.checkmate && result.winner
                  ? `Checkmate! ${result.winner === 'w' ? 'White' : 'Black'} wins. Score: ${result.score}.`
                  : result.draw
                    ? 'Game Over: Draw.'
                    : 'Game over.'}
              </p>
            </section>
          )}
          {!result.gameOver && (
            <>
          <section className="mb-3">
            <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Analysis for</h3>
            <p className="text-base font-semibold text-github-accent">
              {result.currentPlayerPerspective === 'white' ? 'White' : 'Black'} (current player)
            </p>
          </section>
          <section className="mb-4">
            <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Best move (Minimax, depth 3)</h3>
            {result.bestMove ? (
              <p className="text-lg text-github-text mono">
                <strong>{result.bestMove.san}</strong>
                {result.bestMove.score != null && (
                  <span className="font-normal text-github-muted"> ({result.bestMove.score} cp)</span>
                )}
              </p>
            ) : (
              <p className="text-github-muted text-sm mt-1">—</p>
            )}
          </section>

          <PayoffMatrix
            payoffMatrix={result.payoffMatrix}
            dominatedRows={result.dominatedRows || []}
            turn={result.turn}
          />

          {(result.dominatedMoves?.length > 0) && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Strictly dominated moves</h3>
              <p className="text-github-muted text-sm mt-1 mb-2">
                These moves are worse than some other move in every response.
              </p>
              <ul className="list-disc pl-5 m-0">
                {result.dominatedMoves.map((san, i) => (
                  <li key={i} className="text-github-error mb-1 mono">
                    {san}
                  </li>
                ))}
              </ul>
            </section>
          )}
            </>
          )}

          {winProb && (
            <section className="pt-2 mt-2 border-t border-github-border">
              <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Win probability</h3>
              <p className="text-[#c9d1d9] text-[0.95rem]">{winProb.message || '—'}</p>
              {winProb.mock && (
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[0.7rem] bg-[#21262d] text-github-muted rounded">Mock</span>
              )}
            </section>
          )}

          {stats && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-github-muted uppercase tracking-wide mb-1">Performance &amp; Quantitative Stats</h3>
              <p className="text-github-muted text-sm mt-1">
                Supports quantitative analysis (CO10): clock-based efficiency and move dynamics.
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>
                  <strong>Total moves (plies):</strong>{' '}
                  <span className="mono">{stats.totalMoves ?? 0}</span>
                </li>
                <li>
                  <strong>Total match time:</strong>{' '}
                  <span className="mono">
                    {stats.totalMatchTimeMs != null
                      ? `${Math.round(stats.totalMatchTimeMs / 1000)} s`
                      : '—'}
                  </span>
                </li>
                <li>
                  <strong>Average move time – White:</strong>{' '}
                  <span className="mono">
                    {stats.whiteAvgMoveSec ? stats.whiteAvgMoveSec.toFixed(2) : '—'} s
                  </span>
                </li>
                <li>
                  <strong>Average move time – Black:</strong>{' '}
                  <span className="mono">
                    {stats.blackAvgMoveSec ? stats.blackAvgMoveSec.toFixed(2) : '—'} s
                  </span>
                </li>
              </ul>
            </section>
          )}
        </>
      )}

      {!result && !loading && !error && fen && (
        <p className="text-github-muted text-sm">Click &quot;Analyze position&quot; to run Minimax and see the payoff matrix.</p>
      )}
    </aside>
  );
}
