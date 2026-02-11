import React from 'react';

/**
 * 3×3 Payoff Matrix: rows = AI's top 3 moves, columns = Player's top 3 responses.
 * Cell = evaluation score (positive = White advantage).
 */
export default function PayoffMatrix({ payoffMatrix, dominatedRows = [], turn }) {
  if (!payoffMatrix || !payoffMatrix.rowLabels?.length) {
    return (
      <div className="bg-github-surface border border-github-border rounded-lg p-4 sm:p-5 mb-5">
        <h3 className="text-base font-semibold text-github-text mb-1">Payoff Matrix</h3>
        <p className="text-github-muted text-sm">Analyze a position to see the 3×3 payoff matrix.</p>
      </div>
    );
  }

  const { rowLabels, colLabels, matrix } = payoffMatrix;

  return (
    <div className="bg-github-surface border border-github-border rounded-lg p-4 sm:p-5 mb-5">
      <h3 className="text-base font-semibold text-github-text mb-1">Payoff Matrix</h3>
      <p className="text-xs text-github-muted mb-1">
        Rows: <strong>Current player&apos;s</strong> top 3 moves · Cols: <strong>Opponent&apos;s</strong> best responses
      </p>
      <p className="text-[0.7rem] text-[#6e7681] mb-3">
        Scores from White&apos;s perspective (positive = White advantage). {turn === 'b' ? 'Black prefers lower values.' : ''}
      </p>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full border-collapse text-sm sm:text-base">
          <thead>
            <tr>
              <th className="w-12 min-w-[3rem] bg-[#21262d]" />
              {colLabels.map((label, j) => (
                <th key={j} className="px-2 py-1.5 text-center bg-[#21262d] text-[#c9d1d9] font-medium border border-github-border mono">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, i) => (
              <tr key={i}>
                <th
                  className={`px-2 py-1.5 text-center bg-[#21262d] text-[#c9d1d9] font-medium border border-github-border mono ${
                    dominatedRows.includes(i) ? 'bg-red-500/25 text-github-error opacity-90' : ''
                  }`}
                  title={dominatedRows.includes(i) ? 'Strictly dominated move' : ''}
                >
                  {rowLabel}
                </th>
                {matrix[i]?.map((cell, j) => (
                  <td key={j} className="px-2 py-1.5 text-center border border-github-border bg-[#0d1117] text-github-text hover:bg-github-surface transition-colors mono">
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
