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

  const turn = useMemo(() => {
    const part = fen.split(' ')[1];
    return part === 'b' ? 'b' : 'w';
  }, [fen]);

  useEffect(() => {
    if (!moveError) return;
    const t = setTimeout(() => setMoveError(null), 3000);
    return () => clearTimeout(t);
  }, [moveError]);

  const applyMoveAndCheckGameOver = useCallback((g) => {
    setGame(g);
    setFen(g.fen());
    if (g.isGameOver()) {
      if (g.isCheckmate()) {
        const winner = g.turn() === 'w' ? 'b' : 'w';
        setGameOver({ type: 'checkmate', winner });
      } else {
        setGameOver({ type: 'draw' });
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
  }, []);

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
          <Chessboard
            position={fen}
            onPieceDrop={handleMove}
            onPromotionCheck={isPromotionMove}
            onPromotionPieceSelect={handlePromotionPieceSelect}
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
          />
        </div>

        <GameTheoryDashboard key={playAgainKey} fen={fen} turn={turn} gameOver={gameOver} />
      </main>

      {gameOver && (
        <GameOverModal gameOver={gameOver} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}
