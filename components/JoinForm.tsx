
import React, { useState } from 'react';

interface JoinFormProps {
  userName: string;
  onJoin: (code: string) => void;
  onLogout: () => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ userName, onJoin, onLogout }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'SQUARE1') {
      setError(null);
      onJoin(cleanCode);
    } else {
      setError("UNAUTHORIZED ACCESS CODE");
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 mlb-gradient"></div>
      
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">WELCOME, {userName.split(' ')[0]}!</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Dugout Verification Required</p>
        </div>
        <button onClick={onLogout} className="p-3 text-slate-500 hover:text-rose-500 transition hover:bg-slate-800 rounded-2xl border border-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-950 p-8 rounded-3xl border-2 border-dashed border-slate-800 shadow-inner">
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 text-center">DUGOUT PASSCODE</label>
          <input
            type="text"
            required
            className={`w-full bg-slate-900 px-4 py-5 rounded-2xl border-2 focus:ring-0 outline-none transition text-center text-4xl font-black tracking-[0.2em] uppercase ${error ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-slate-800 text-white focus:border-indigo-500'}`}
            placeholder="••••••"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
          />
          {error && (
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center mt-6">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full mlb-gradient text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-950/50 transition transform active:scale-[0.98] uppercase tracking-widest text-sm"
        >
          Verify & Enter
        </button>
      </form>

      <div className="mt-10 p-5 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-start space-x-4">
        <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">
          Restricted Roster: This dugout is only for authorized members with active project credentials.
        </p>
      </div>
    </div>
  );
};

export default JoinForm;
