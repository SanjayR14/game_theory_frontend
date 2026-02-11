import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import GameTheoryDashboard from './components/GameTheoryDashboard';
import GameOverModal from './components/GameOverModal';
import './App.css';

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

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Chess Decision Support System</h1>
        <p className="app__tagline">Game theory: Payoff matrix, dominance, minimax</p>
        <p className="app__turn">Turn: {turn === 'w' ? 'White' : 'Black'}</p>
        {moveError && <p className="app__move-error" role="alert">{moveError}</p>}
      </header>

      <main className="app__main">
        <div className="app__board-wrap">
          <div className="app__settings">
            <span className="app__settings-label">Clock (per side):</span>
            <select
              className="app__settings-select"
              value={baseMinutes}
              onChange={handleTimeSettingChange}
              disabled={timerRunning}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <div className="app__clocks">
            <div className={`app__clock app__clock--white ${activePlayer === 'w' ? 'app__clock--active' : ''}`}>
              <span className="app__clock-label">White</span>
              <span className="app__clock-time">{formatClock(whiteTimeMs)}</span>
            </div>
            <div className={`app__clock app__clock--black ${activePlayer === 'b' ? 'app__clock--active' : ''}`}>
              <span className="app__clock-label">Black</span>
              <span className="app__clock-time">{formatClock(blackTimeMs)}</span>
            </div>
          </div>

          <Chessboard
            position={fen}
            onPieceDrop={handleMove}
            onPromotionCheck={isPromotionMove}
            onPromotionPieceSelect={handlePromotionPieceSelect}
            onSquareClick={handleSquareClick}
            promotionDialogVariant="modal"
            boardWidth={480}
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
      </main>

      {gameOver && (
        <GameOverModal gameOver={gameOver} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
