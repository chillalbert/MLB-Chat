import React, { useState, useEffect, useRef } from 'react';

interface HomeRunGameProps {
  onGameOver: (distance: number) => void;
  onClose: () => void;
}

const HomeRunGame: React.FC<HomeRunGameProps> = ({ onGameOver, onClose }) => {
  const [gameState, setGameState] = useState<'idle' | 'pitching' | 'hit' | 'miss'>('idle');
  const [ballPos, setBallPos] = useState(0); 
  const [distance, setDistance] = useState(0);
  const [message, setMessage] = useState('GET READY!');
  const ballInterval = useRef<number | null>(null);

  const startPitch = () => {
    setGameState('pitching');
    setBallPos(0);
    setMessage('HERE COMES THE HEAT!');
    
    ballInterval.current = window.setInterval(() => {
      setBallPos(prev => {
        if (prev >= 100) {
          handleMiss();
          return 100;
        }
        return prev + 2.5;
      });
    }, 20);
  };

  const handleSwing = () => {
    if (gameState !== 'pitching') return;
    if (ballInterval.current) clearInterval(ballInterval.current);

    if (ballPos >= 82 && ballPos <= 94) {
      const accuracy = 1 - Math.abs(88 - ballPos) / 10;
      const hitDistance = Math.floor(accuracy * 450 + Math.random() * 50);
      setDistance(hitDistance);
      setGameState('hit');
      setMessage(`CRACK! ${hitDistance}FT!`);
      setTimeout(() => onGameOver(hitDistance), 1500);
    } else {
      handleMiss();
    }
  };

  const handleMiss = () => {
    if (ballInterval.current) clearInterval(ballInterval.current);
    setGameState('miss');
    setMessage('STRIKE!');
    setTimeout(() => {
      setGameState('idle');
      setMessage('TRY AGAIN?');
    }, 1200);
  };

  useEffect(() => {
    return () => { if (ballInterval.current) clearInterval(ballInterval.current); };
  }, []);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-3xl border border-slate-800 relative">
        <div className="h-2 mlb-gradient w-full"></div>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-10 text-center">
          <h2 className="text-3xl font-black text-white uppercase italic mb-1">HOME RUN DERBY</h2>
          <p className="text-xs font-black text-indigo-400 mb-8 tracking-[0.2em] uppercase">{message}</p>

          <div className="relative h-72 bg-slate-950 rounded-3xl border-4 border-slate-800 overflow-hidden mb-8 flex flex-col justify-end pb-12 shadow-inner">
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 bg-indigo-500 rounded-full mb-1"></div>
              <div className="w-12 h-20 bg-indigo-600 rounded-t-xl"></div>
            </div>

            {gameState === 'pitching' && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10 transition-all duration-75"
                style={{ top: `${12 + (ballPos / 100) * 70}%`, transform: `translateX(-50%) scale(${0.5 + ballPos/100})` }}
              ></div>
            )}

            <div className="w-full h-1 bg-slate-800/50"></div>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-indigo-500/20 border-dashed rounded-2xl"></div>
          </div>

          <button 
            onClick={gameState === 'idle' ? startPitch : handleSwing}
            disabled={gameState === 'hit' || gameState === 'miss'}
            className={`w-full py-5 font-black rounded-2xl shadow-2xl uppercase tracking-widest transition-all active:scale-95 ${gameState === 'idle' ? 'mlb-gradient text-white' : 'bg-white text-slate-950'}`}
          >
            {gameState === 'idle' ? 'Start Pitch' : 'Swing!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeRunGame;