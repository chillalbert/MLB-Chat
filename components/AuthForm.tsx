
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
    <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-[#002D72] tracking-tight uppercase italic">MLB Chat</h2>
        <p className="text-slate-400 font-medium mt-3">
          {isLogin ? 'Sign in with your email' : 'Register your player name'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Screen Name</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition bg-slate-50 font-medium text-slate-700"
              placeholder="e.g. Ace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition bg-slate-50 font-medium text-slate-700"
            placeholder="player@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full mlb-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-900/20 transition duration-200 transform active:scale-[0.98] uppercase tracking-widest text-xs"
        >
          {isLogin ? 'Enter Dugout' : 'Join the Roster'}
        </button>
      </form>
      
      <div className="mt-10 text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition uppercase tracking-widest"
        >
          {isLogin ? "New here? Sign up instead" : "Existing user? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
