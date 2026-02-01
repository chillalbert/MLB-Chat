import React, { useState } from 'react';

interface AuthFormProps {
  onAuth: (email: string, name: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth(email, name);
  };

  return (
    <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-800">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight uppercase italic leading-none">MLB Chat</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">
          {isLogin ? 'Sign in to dugout' : 'Register for roster'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isLogin && (
          <div>
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-1">Player Name</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-800 focus:border-indigo-500 focus:bg-slate-950 outline-none transition bg-slate-950 font-bold text-slate-100"
              placeholder="e.g. Ace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 ml-1">Email ID</label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-800 focus:border-indigo-500 focus:bg-slate-950 outline-none transition bg-slate-950 font-bold text-slate-100"
            placeholder="player@pro.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full mlb-gradient text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-950/40 transition transform active:scale-[0.98] uppercase tracking-widest text-xs"
        >
          {isLogin ? 'Enter Field' : 'Join Team'}
        </button>
      </form>
      
      <div className="mt-10 text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition uppercase tracking-widest"
        >
          {isLogin ? "New Player? Sign Up" : "Returning Player? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;