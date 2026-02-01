
import React, { useState, useEffect, useRef } from 'react';

interface HomeRunGameProps {
  onGameOver: (distance: number) => void;
  onClose: () => void;
}

const HomeRunGame: React.FC<HomeRunGameProps> = ({ onGameOver, onClose }) => {
  const [gameState, setGameState] = useState<'idle' | 'pitching' | 'hit' | 'miss'>('idle');
  const [ballPos, setBallPos] = useState(0); // 0 to 100
  const [distance, setDistance] = useState(0);
  const [message, setMessage] = useState('Get Ready!');
  const ballInterval = useRef<number | null>(null);

  const startPitch = () => {
    setGameState('pitching');
    setBallPos(0);
    setMessage('Here comes the pitch!');
    
    ballInterval.current = window.setInterval(() => {
      setBallPos(prev => {
        if (prev >= 100) {
          handleMiss();
          return 100;
        }
        return prev + 2;
      });
    }, 20);
  };

  const handleSwing = () => {
    if (gameState !== 'pitching') return;
    if (ballInterval.current) clearInterval(ballInterval.current);

    // Sweet spot is around 85-92
    if (ballPos >= 80 && ballPos <= 95) {
      const accuracy = 1 - Math.abs(88 - ballPos) / 10;
      const hitDistance = Math.floor(accuracy * 450 + Math.random() * 50);
      setDistance(hitDistance);
      setGameState('hit');
      setMessage(`CRACK! ${hitDistance}ft HOME RUN!`);
      setTimeout(() => onGameOver(hitDistance), 2000);
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
      setMessage('Try again?');
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (ballInterval.current) clearInterval(ballInterval.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="h-2 mlb-gradient w-full"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-[#002D72] uppercase italic mb-2">Home Run Derby</h2>
          <p className="text-sm font-bold text-gray-500 mb-8">{message}</p>

          <div className="relative h-64 bg-green-100 rounded-2xl border-4 border-green-200 overflow-hidden mb-8 flex flex-col justify-end pb-12">
            {/* Pitcher */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-800 rounded-full mb-1"></div>
              <div className="w-12 h-16 bg-blue-700 rounded-t-lg"></div>
            </div>

            {/* Ball */}
            {gameState === 'pitching' && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-gray-300 rounded-full shadow-md z-10 transition-all duration-75"
                style={{ top: `${12 + (ballPos / 100) * 70}%`, transform: `translateX(-50%) scale(${0.5 + ballPos/100})` }}
              ></div>
            )}

            {/* Home Plate Area */}
            <div className="w-full h-12 bg-orange-100 flex items-center justify-center">
              <div className="w-16 h-4 bg-white shadow-sm rounded-sm"></div>
            </div>

            {/* Swing Zone indicator */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-red-400 border-dashed rounded-lg opacity-50"></div>
          </div>

          <div className="flex flex-col space-y-4">
            {gameState === 'idle' ? (
              <button 
                onClick={startPitch}
                className="w-full py-4 mlb-gradient text-white font-black rounded-2xl shadow-xl uppercase tracking-widest hover:scale-[1.02] transition"
              >
                Start Pitch
              </button>
            ) : (
              <button 
                onClick={handleSwing}
                disabled={gameState !== 'pitching'}
                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest active:bg-black transition disabled:opacity-50"
              >
                Swing!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeRunGame;
