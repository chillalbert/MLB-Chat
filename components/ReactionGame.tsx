
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
    const delay = 2000 + Math.random() * 3500;
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative text-center p-10 border border-slate-800">
        <h2 className="text-3xl font-black italic uppercase text-white mb-6">Catch the Heater</h2>
        
        <div 
          onClick={handleClick}
          className={`h-64 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-75 border-4 ${
            gameState === 'waiting' ? 'bg-rose-950 border-rose-900 shadow-[inset_0_0_50px_rgba(244,63,94,0.1)]' : 
            gameState === 'ready' ? 'bg-emerald-600 border-emerald-400 scale-105 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 
            'bg-slate-800 border-slate-700'
          }`}
        >
          {gameState === 'waiting' && (
            <div className="text-rose-200">
              <p className="text-4xl font-black uppercase mb-2">Steady...</p>
              <p className="text-[10px] font-bold tracking-widest opacity-60">WAIT FOR GREEN</p>
            </div>
          )}
          {gameState === 'ready' && (
            <div className="text-white animate-pulse">
              <p className="text-7xl font-black uppercase tracking-tighter">HIT!</p>
            </div>
          )}
          {gameState === 'result' && (
            <div className="text-white">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">REACTION TIME</p>
              <p className="text-7xl font-black italic text-indigo-400">{result}ms</p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 text-slate-600 font-bold hover:text-rose-500 transition uppercase text-[10px] tracking-widest"
        >
          Exit Challenge
        </button>
      </div>
    </div>
  );
};

export default ReactionGame;
