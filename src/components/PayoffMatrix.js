import React from 'react';
import './PayoffMatrix.css';

/**
 * 3×3 Payoff Matrix: rows = AI's top 3 moves, columns = Player's top 3 responses.
 * Cell = evaluation score (positive = White advantage).
 */
export default function PayoffMatrix({ payoffMatrix, dominatedRows = [], turn }) {
  if (!payoffMatrix || !payoffMatrix.rowLabels?.length) {
    return (
      <div className="payoff-matrix payoff-matrix--empty">
        <h3 className="payoff-matrix__title">Payoff Matrix</h3>
        <p className="payoff-matrix__placeholder">Analyze a position to see the 3×3 payoff matrix.</p>
      </div>
    );
  }

  const { rowLabels, colLabels, matrix } = payoffMatrix;

  return (
    <div className="payoff-matrix">
      <h3 className="payoff-matrix__title">Payoff Matrix</h3>
      <p className="payoff-matrix__subtitle">
        Rows: <strong>Current player&apos;s</strong> top 3 moves · Cols: <strong>Opponent&apos;s</strong> best responses
      </p>
      <p className="payoff-matrix__score-note">
        Scores from White&apos;s perspective (positive = White advantage). {turn === 'b' ? 'Black prefers lower values.' : ''}
      </p>
      <div className="payoff-matrix__table-wrap">
        <table className="payoff-matrix__table">
          <thead>
            <tr>
              <th className="payoff-matrix__corner" />
              {colLabels.map((label, j) => (
                <th key={j} className="payoff-matrix__col-header mono">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, i) => (
              <tr key={i}>
                <th
                  className={`payoff-matrix__row-header mono ${
                    dominatedRows.includes(i) ? 'payoff-matrix__row-header--dominated' : ''
                  }`}
                  title={dominatedRows.includes(i) ? 'Strictly dominated move' : ''}
                >
                  {rowLabel}
                </th>
                {matrix[i]?.map((cell, j) => (
                  <td key={j} className="payoff-matrix__cell mono">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
