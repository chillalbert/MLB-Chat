
import React, { useState } from 'react';

interface AuthFormProps {
  onAuth: (email: string, name: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuth }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && (isLoginMode || name)) {
      onAuth(email, name || 'Returning User');
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-2 mlb-gradient"></div>
      
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
           <svg className="w-10 h-10 text-[#002D72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="12" cy="12" r="3" fill="#BA0C2F"/>
              <path d="M12 7v2M12 15v2M7 12h2M15 12h2" stroke="#002D72"/>
           </svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">MLB CHAT</h2>
        <p className="text-gray-500 mt-2 font-medium">
          {isLoginMode ? 'Welcome back to the dugout' : 'Create your player profile'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLoginMode && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Screen Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#002D72] focus:ring-0 outline-none transition font-medium text-gray-700"
              placeholder="e.g. HomeRunKing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 focus:border-[#002D72] focus:ring-0 outline-none transition font-medium text-gray-700"
            placeholder="scout@mlb.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full mlb-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest text-sm"
        >
          {isLoginMode ? 'Enter Dugout' : 'Join League'}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-gray-50 text-center">
        <button 
          onClick={() => setIsLoginMode(!isLoginMode)}
          className="text-sm font-bold text-[#002D72] hover:text-[#BA0C2F] transition"
        >
          {isLoginMode ? "Don't have an account? Sign up" : "Already a member? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
