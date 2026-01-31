
import React, { useState } from 'react';

interface JoinFormProps {
  userName: string;
  onJoin: (code: string) => void;
  onLogout: () => void;
}

const JoinForm: React.FC<JoinFormProps> = ({ userName, onJoin, onLogout }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      onJoin(code);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 mlb-gradient"></div>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Welcome, {userName.split(' ')[0]}!</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Authentication successful. Now enter the access code.</p>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition hover:bg-red-50 rounded-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Security Passcode</label>
          <input
            type="text"
            required
            className="w-full bg-white px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-[#002D72] focus:ring-0 outline-none transition text-center text-3xl font-black tracking-[0.3em] uppercase text-[#002D72]"
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="w-full mlb-gradient text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
        >
          Enter the Stadium
        </button>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <p className="text-xs text-blue-800 font-bold flex items-center leading-relaxed">
          <svg className="w-5 h-5 mr-3 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          This is a restricted area. Only members with the valid SQUARE1 passcode are permitted inside MLB Chat.
        </p>
      </div>
    </div>
  );
};

export default JoinForm;
