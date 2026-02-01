import React, { useState, useEffect, useRef } from 'react';

interface BaseStealerProps {
  onGameOver: (seconds: number) => void;
  onClose: () => void;
}

const BaseStealer: React.FC<BaseStealerProps> = ({ onGameOver, onClose }) => {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [progress, setProgress] = useState(0); 
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
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative p-10 border border-slate-800">
        <h2 className="text-2xl font-black text-white uppercase italic text-center mb-2">90FT SPRINT</h2>
        <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">ALTERNATE LEFT AND RIGHT!</p>
        
        <div className="text-center mb-8">
            <span className="text-6xl font-black italic text-indigo-500 shadow-indigo-500/20 drop-shadow-md">{timer.toFixed(2)}s</span>
        </div>

        {/* Track */}
        <div className="h-4 bg-slate-950 rounded-full mb-12 relative overflow-hidden border border-slate-800 shadow-inner">
            <div 
                className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-100 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                style={{ width: `${progress}%` }}
            ></div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-8 bg-amber-500 rounded-sm"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                onMouseDown={() => handleStep('L')}
                className={`py-8 rounded-3xl font-black text-xl transition-all active:scale-90 ${lastSide === 'L' ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40'}`}
            >
                LEFT
            </button>
            <button 
                onMouseDown={() => handleStep('R')}
                className={`py-8 rounded-3xl font-black text-xl transition-all active:scale-90 ${lastSide === 'R' ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40'}`}
            >
                RIGHT
            </button>
        </div>

        <button 
            onClick={onClose}
            className="w-full mt-8 text-slate-600 font-bold hover:text-rose-500 transition text-[10px] uppercase tracking-widest"
        >
            Abandon Sprint
        </button>
      </div>
    </div>
  );
};

export default BaseStealer;