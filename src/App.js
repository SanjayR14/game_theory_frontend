import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import GameTheoryDashboard from './components/GameTheoryDashboard';
import GameOverModal from './components/GameOverModal';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function isPromotionMove(sourceSquare, targetSquare, piece) {
  const isPawnToLastRank =
    (piece === 'wP' && sourceSquare[1] === '7' && targetSquare[1] === '8') ||
    (piece === 'bP' && sourceSquare[1] === '2' && targetSquare[1] === '1');
  const validFile = Math.abs(sourceSquare.charCodeAt(0) - targetSquare.charCodeAt(0)) <= 1;
  return !!(isPawnToLastRank && validFile);
}

export default function App() {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [gameOver, setGameOver] = useState(null);
  const [playAgainKey, setPlayAgainKey] = useState(0);
  const [moveError, setMoveError] = useState(null);
  const [optionSquares, setOptionSquares] = useState({});

  // Clock / performance tracking
  const [baseMinutes, setBaseMinutes] = useState(5); // starting time setting
  const [whiteTimeMs, setWhiteTimeMs] = useState(baseMinutes * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(baseMinutes * 60 * 1000);
  const [matchStartTime, setMatchStartTime] = useState(null);
  const [whiteMoves, setWhiteMoves] = useState(0);
  const [blackMoves, setBlackMoves] = useState(0);
  const [whiteElapsedMs, setWhiteElapsedMs] = useState(0);
  const [blackElapsedMs, setBlackElapsedMs] = useState(0);
  const [activePlayer, setActivePlayer] = useState(null); // 'w' | 'b' | null
  const [timerRunning, setTimerRunning] = useState(false);

  const turn = useMemo(() => {
    const part = fen.split(' ')[1];
    return part === 'b' ? 'b' : 'w';
  }, [fen]);

  useEffect(() => {
    if (!moveError) return;
    const t = setTimeout(() => setMoveError(null), 3000);
    return () => clearTimeout(t);
  }, [moveError]);

  // Professional chess clock using setInterval; only the active player's
  // time is decremented and only after the first move has been made.
  useEffect(() => {
    if (!timerRunning || gameOver || !activePlayer) return;

    const interval = setInterval(() => {
      if (activePlayer === 'w') {
        setWhiteTimeMs((prev) => {
          const next = Math.max(0, prev - 1000);
          if (next === 0) {
            setTimerRunning(false);
            setGameOver((prevOver) => prevOver || { type: 'timeout', winner: 'b', reason: 'Time Out' });
          }
          return next;
        });
        setWhiteElapsedMs((prev) => prev + 1000);
      } else if (activePlayer === 'b') {
        setBlackTimeMs((prev) => {
          const next = Math.max(0, prev - 1000);
          if (next === 0) {
            setTimerRunning(false);
            setGameOver((prevOver) => prevOver || { type: 'timeout', winner: 'w', reason: 'Time Out' });
          }
          return next;
        });
        setBlackElapsedMs((prev) => prev + 1000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, gameOver, activePlayer]);

  const formatClock = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const maybeStartMatchClock = (nextToMove) => {
    // Do not start any clock until the first move is actually made.
    if (!matchStartTime) {
      setMatchStartTime(Date.now());
    }
    // Hand-off: start the timer for the side whose turn it is AFTER the move.
    setActivePlayer(nextToMove);
    setTimerRunning(true);
  };

  const applyMoveAndCheckGameOver = useCallback((g) => {
    setGame(g);
    setFen(g.fen());
    if (g.isGameOver()) {
      if (g.isCheckmate()) {
        const winner = g.turn() === 'w' ? 'b' : 'w';
        setGameOver({ type: 'checkmate', winner, reason: 'Checkmate' });
      } else if (g.isStalemate()) {
        setGameOver({ type: 'stalemate', winner: null, reason: 'Stalemate' });
      } else if (g.isDraw()) {
        setGameOver({ type: 'draw', winner: null, reason: 'Draw' });
      } else {
        setGameOver({ type: 'draw', winner: null, reason: 'Game Over' });
      }
    }
  }, []);

  const handleMove = useCallback((sourceSquare, targetSquare, piece) => {
    if (gameOver) return false;
    setMoveError(null);
    try {
      const g = new Chess(fen);
      const moveOptions = { from: sourceSquare, to: targetSquare };
      const isPromotion = isPromotionMove(sourceSquare, targetSquare, piece);
      if (isPromotion) moveOptions.promotion = (piece && String(piece).slice(-1).toLowerCase()) || 'q';
      const move = g.move(moveOptions);
      if (move) {
        // Clear highlighted options and hand off the clock: after a legal move,
        // chess.js sets turn() to the opponent, whose clock must now start.
        setOptionSquares({});
        maybeStartMatchClock(g.turn());
        if (turn === 'w') {
          setWhiteMoves((m) => m + 1);
        } else {
          setBlackMoves((m) => m + 1);
        }
        applyMoveAndCheckGameOver(g);
        return true;
      }
    } catch (e) {
      setMoveError('Legal move required');
      return false;
    }
    setMoveError('Legal move required');
    return false;
  }, [fen, gameOver, applyMoveAndCheckGameOver]);

  const handlePromotionPieceSelect = useCallback((piece, promoteFromSquare, promoteToSquare) => {
    if (gameOver) return false;
    setMoveError(null);
    const promo = piece && String(piece).slice(-1).toLowerCase();
    if (!promo || !['q', 'r', 'b', 'n'].includes(promo)) return false;
    try {
      const g = new Chess(fen);
      const move = g.move({ from: promoteFromSquare, to: promoteToSquare, promotion: promo });
      if (move) {
        setOptionSquares({});
        maybeStartMatchClock(g.turn());
        if (turn === 'w') {
          setWhiteMoves((m) => m + 1);
        } else {
          setBlackMoves((m) => m + 1);
        }
        applyMoveAndCheckGameOver(g);
        return true;
      }
    } catch (e) {
      setMoveError('Legal move required');
      return false;
    }
    setMoveError('Legal move required');
    return false;
  }, [fen, gameOver, applyMoveAndCheckGameOver]);

  const handlePlayAgain = useCallback(() => {
    setGame(new Chess());
    setFen(START_FEN);
    setGameOver(null);
    setMoveError(null);
    setPlayAgainKey((k) => k + 1);
    setOptionSquares({});

    const resetMs = baseMinutes * 60 * 1000;
    setWhiteTimeMs(resetMs);
    setBlackTimeMs(resetMs);
    setWhiteMoves(0);
    setBlackMoves(0);
    setWhiteElapsedMs(0);
    setBlackElapsedMs(0);
    setMatchStartTime(null);
    setActivePlayer(null);
    setTimerRunning(false);
  }, []);

  const handleTimeSettingChange = (event) => {
    const minutes = Number(event.target.value) || 5;
    setBaseMinutes(minutes);
    const resetMs = minutes * 60 * 1000;
    setWhiteTimeMs(resetMs);
    setBlackTimeMs(resetMs);
    setWhiteElapsedMs(0);
    setBlackElapsedMs(0);
    setWhiteMoves(0);
    setBlackMoves(0);
    setMatchStartTime(null);
    setTimerRunning(false);
    setActivePlayer(null);
  };

  const handleSquareClick = (square) => {
    if (gameOver) return;
    const g = new Chess(fen);
    const piece = g.get(square);

    // If no piece or opponent piece, clear highlights
    if (!piece || piece.color !== turn) {
      setOptionSquares({});
      return;
    }

    const moves = g.moves({ square, verbose: true });
    if (!moves.length) {
      setOptionSquares({});
      return;
    }

    const newSquares = {};
    newSquares[square] = {
      background:
        'radial-gradient(circle, rgba(144,238,144,0.55) 0, rgba(144,238,144,0.25) 40%, transparent 60%)',
      borderRadius: '50%',
    };

    moves.forEach((move) => {
      newSquares[move.to] = {
        backgroundColor: 'rgba(144,238,144,0.35)',
      };
    });

    setOptionSquares(newSquares);
  };

  const totalMoves = whiteMoves + blackMoves;
  const totalMatchTimeMs =
    matchStartTime && gameOver ? Date.now() - matchStartTime : whiteElapsedMs + blackElapsedMs;

  const [boardSize, setBoardSize] = useState(480);
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w < 400) setBoardSize(Math.min(320, w - 32));
      else if (w < 640) setBoardSize(Math.min(360, w - 48));
      else setBoardSize(480);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-4 sm:px-6 sm:py-5 bg-github-surface border-b border-github-border text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-github-text mb-1">Chess Decision Support System</h1>
        <p className="text-sm sm:text-base text-github-muted">Game theory: Payoff matrix, dominance, minimax</p>
        <p className="text-sm font-semibold text-github-accent mt-1.5">Turn: {turn === 'w' ? 'White' : 'Black'}</p>
        {moveError && <p className="text-sm font-medium text-github-error mt-1.5" role="alert">{moveError}</p>}
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="w-full max-w-[480px] flex-shrink-0 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 w-full max-w-md">
            <span className="text-sm text-github-muted">Clock (per side):</span>
            <select
              className="bg-[#0d1117] text-github-text rounded border border-github-border px-2 py-1 text-sm"
              value={baseMinutes}
              onChange={handleTimeSettingChange}
              disabled={timerRunning}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <div className="flex gap-3 mb-3 w-full max-w-md">
            <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md border-2 bg-github-surface ${
              activePlayer === 'w' ? 'border-github-accent shadow-[0_0_0_1px_rgba(63,185,80,0.6),0_0_10px_rgba(63,185,80,0.5)]' : 'border-github-border'
            }`}>
              <span className="text-xs text-github-muted uppercase tracking-wider">White</span>
              <span className="font-mono font-semibold text-github-text">{formatClock(whiteTimeMs)}</span>
            </div>
            <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md border-2 bg-github-surface ${
              activePlayer === 'b' ? 'border-github-accent shadow-[0_0_0_1px_rgba(63,185,80,0.6),0_0_10px_rgba(63,185,80,0.5)]' : 'border-github-border'
            }`}>
              <span className="text-xs text-github-muted uppercase tracking-wider">Black</span>
              <span className="font-mono font-semibold text-github-text">{formatClock(blackTimeMs)}</span>
            </div>
          </div>

          <Chessboard
            position={fen}
            onPieceDrop={handleMove}
            onPromotionCheck={isPromotionMove}
            onPromotionPieceSelect={handlePromotionPieceSelect}
            onSquareClick={handleSquareClick}
            promotionDialogVariant="modal"
            boardWidth={boardSize}
            boardOrientation={turn === 'w' ? 'white' : 'black'}
            arePiecesDraggable={!gameOver}
            showBoardLetters={true}
            customBoardStyle={{
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
            customLightSquareStyle={{ backgroundColor: '#484f58' }}
            customSquareStyles={optionSquares}
          />
        </div>

        <div className="w-full lg:max-w-[420px] lg:min-w-[280px]">
          <GameTheoryDashboard
          key={playAgainKey}
          fen={fen}
          turn={turn}
          gameOver={gameOver}
          stats={{
            totalMoves,
            totalMatchTimeMs,
            whiteAvgMoveSec: whiteMoves ? whiteElapsedMs / 1000 / whiteMoves : 0,
            blackAvgMoveSec: blackMoves ? blackElapsedMs / 1000 / blackMoves : 0,
          }}
        />
        </div>
      </main>

      {gameOver && (
        <GameOverModal gameOver={gameOver} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
