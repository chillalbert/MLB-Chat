
import React, { useState, useEffect, useRef } from 'react';

interface BaseStealerProps {
  onGameOver: (seconds: number) => void;
  onClose: () => void;
}

const BaseStealer: React.FC<BaseStealerProps> = ({ onGameOver, onClose }) => {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [lastSide, setLastSide] = useState<'L' | 'R' | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState === 'running') {
      timerRef.current = window.setInterval(() => {
        setTimer((Date.now() - startTime) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, startTime]);

  const handleStep = (side: 'L' | 'R') => {
    if (gameState === 'idle') {
      setGameState('running');
      setStartTime(Date.now());
      setProgress(1);
      setLastSide(side);
      return;
    }

    if (gameState === 'running') {
      if (side !== lastSide) {
        const nextProgress = progress + 4;
        setProgress(nextProgress);
        setLastSide(side);
        
        if (nextProgress >= 100) {
          const finalTime = Number(((Date.now() - startTime) / 1000).toFixed(2));
          setGameState('finished');
          setTimer(finalTime);
          setTimeout(() => onGameOver(finalTime), 1500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-indigo-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative p-8">
        <h2 className="text-2xl font-black text-indigo-900 uppercase italic text-center mb-2">90ft Sprint</h2>
        <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Alternate LEFT and RIGHT to steal second!</p>
        
        <div className="text-center mb-8">
            <span className="text-6xl font-black italic text-indigo-600">{timer.toFixed(2)}s</span>
        </div>

        {/* Track */}
        <div className="h-4 bg-slate-100 rounded-full mb-12 relative overflow-hidden">
            <div 
                className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-100"
                style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-8 bg-amber-400 rounded-sm"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onMouseDown={() => handleStep('L')}
                className={`py-8 rounded-3xl font-black text-xl transition-all active:scale-95 ${lastSide === 'L' ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}
            >
                LEFT
            </button>
            <button 
                onMouseDown={() => handleStep('R')}
                className={`py-8 rounded-3xl font-black text-xl transition-all active:scale-95 ${lastSide === 'R' ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}
            >
                RIGHT
            </button>
        </div>

        <button 
            onClick={onClose}
            className="w-full mt-8 text-slate-300 font-bold hover:text-rose-500 transition text-[10px] uppercase tracking-widest"
        >
            Quit Sprint
        </button>
      </div>
    </div>
  );
};

export default BaseStealer;
