import React, { useState, useEffect } from 'react';
import { analyzePosition, getWinProbability } from '../services/api';
import PayoffMatrix from './PayoffMatrix';
import './GameTheoryDashboard.css';

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
    <aside className="dashboard">
      <header className="dashboard__header">
        <h2 className="dashboard__title">Game Theory Dashboard</h2>
        <button
          type="button"
          className="dashboard__analyze-btn"
          onClick={runAnalysis}
          disabled={loading || !fen || !!gameOver}
        >
          {loading ? 'Analyzing…' : 'Analyze position'}
        </button>
      </header>

      {error && (
        <div className="dashboard__error">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.gameOver && (
            <section className="dashboard__section dashboard__section--terminal">
              <h3 className="dashboard__section-title">Terminal state</h3>
              <p className="dashboard__terminal-msg">
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
          <section className="dashboard__section dashboard__section--perspective">
            <h3 className="dashboard__section-title">Analysis for</h3>
            <p className="dashboard__perspective">
              {result.currentPlayerPerspective === 'white' ? 'White' : 'Black'} (current player)
            </p>
          </section>
          <section className="dashboard__section">
            <h3 className="dashboard__section-title">Best move (Minimax, depth 3)</h3>
            {result.bestMove ? (
              <p className="dashboard__best-move mono">
                <strong>{result.bestMove.san}</strong>
                {result.bestMove.score != null && (
                  <span className="dashboard__score"> ({result.bestMove.score} cp)</span>
                )}
              </p>
            ) : (
              <p className="dashboard__muted">—</p>
            )}
          </section>

          <PayoffMatrix
            payoffMatrix={result.payoffMatrix}
            dominatedRows={result.dominatedRows || []}
            turn={result.turn}
          />

          {(result.dominatedMoves?.length > 0) && (
            <section className="dashboard__section dashboard__section--dominance">
              <h3 className="dashboard__section-title">Strictly dominated moves</h3>
              <p className="dashboard__muted dashboard__dominance-desc">
                These moves are worse than some other move in every response.
              </p>
              <ul className="dashboard__dominated-list">
                {result.dominatedMoves.map((san, i) => (
                  <li key={i} className="dashboard__dominated-item mono">
                    {san}
                  </li>
                ))}
              </ul>
            </section>
          )}
            </>
          )}

          {winProb && (
            <section className="dashboard__section dashboard__section--winprob">
              <h3 className="dashboard__section-title">Win probability</h3>
              <p className="dashboard__winprob-msg">{winProb.message || '—'}</p>
              {winProb.mock && (
                <span className="dashboard__mock-badge">Mock</span>
              )}
            </section>
          )}

          {stats && (
            <section className="dashboard__section dashboard__section--performance">
              <h3 className="dashboard__section-title">Performance &amp; Quantitative Stats</h3>
              <p className="dashboard__muted">
                Supports quantitative analysis (CO10): clock-based efficiency and move dynamics.
              </p>
              <ul className="dashboard__stats-list">
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
        <p className="dashboard__hint">Click &quot;Analyze position&quot; to run Minimax and see the payoff matrix.</p>
      )}
    </aside>
  );
}
