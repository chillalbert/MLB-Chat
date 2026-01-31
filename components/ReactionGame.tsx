
import React, { useState, useEffect, useRef } from 'react';

interface ReactionGameProps {
  onGameOver: (ms: number) => void;
  onClose: () => void;
}

const ReactionGame: React.FC<ReactionGameProps> = ({ onGameOver, onClose }) => {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'result'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startWait();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startWait = () => {
    setGameState('waiting');
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = window.setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      alert("Too early! Foul ball!");
      if (timerRef.current) clearTimeout(timerRef.current);
      startWait();
      return;
    }

    if (gameState === 'ready') {
      const diff = Date.now() - startTime;
      setResult(diff);
      setGameState('result');
      setTimeout(() => onGameOver(diff), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#002D72]/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden relative text-center p-10">
        <h2 className="text-3xl font-black italic uppercase text-[#002D72] mb-6">100MPH Heat Challenge</h2>
        
        <div 
          onClick={handleClick}
          className={`h-64 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-75 border-4 ${
            gameState === 'waiting' ? 'bg-red-500 border-red-600' : 
            gameState === 'ready' ? 'bg-green-500 border-green-600 scale-105' : 
            'bg-blue-100 border-blue-200'
          }`}
        >
          {gameState === 'waiting' && (
            <div className="text-white">
              <p className="text-4xl font-black uppercase mb-2">Watch...</p>
              <p className="text-sm font-bold opacity-80">Tap when it turns GREEN!</p>
            </div>
          )}
          {gameState === 'ready' && (
            <div className="text-white animate-pulse">
              <p className="text-6xl font-black uppercase">HIT IT!</p>
            </div>
          )}
          {gameState === 'result' && (
            <div className="text-[#002D72]">
              <p className="text-2xl font-black uppercase">PITCH CLOCK</p>
              <p className="text-6xl font-black italic">{result}ms</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 text-gray-400 font-bold hover:text-[#BA0C2F] transition uppercase text-xs tracking-widest"
        >
          Close Game
        </button>
      </div>
    </div>
  );
};

export default ReactionGame;
