
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatRoom, Message, LeaderboardEntry } from '../types';
import HomeRunGame from './HomeRunGame';
import ReactionGame from './ReactionGame';
import BaseStealer from './BaseStealer';

interface ChatRoomProps {
  user: User;
  room: ChatRoom;
  onSendMessage: (content: string) => void;
  onUpdateRoomName: (newName: string) => void;
  onUpdateUserName: (newName: string) => void;
  onSaveScore: (game: 'derby' | 'heat' | 'stealer', score: number) => void;
  onRemoveMember: (userId: string) => void;
  onLogout: () => void;
  installPrompt?: () => void;
}

const ChatRoomComponent: React.FC<ChatRoomProps> = ({
  user,
  room,
  onSendMessage,
  onUpdateRoomName,
  onUpdateUserName,
  onSaveScore,
  onRemoveMember,
  onLogout,
  installPrompt
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newRoomName, setNewRoomName] = useState(room.name);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserName, setNewUserName] = useState(user.name);
  const [sidebarTab, setSidebarTab] = useState<'lineup' | 'hall'>('lineup');
  const [showMembers, setShowMembers] = useState(false);
  const [activeGame, setActiveGame] = useState<'derby' | 'heat' | 'stealer' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleSaveRoomName = () => {
    if (newRoomName.trim() && newRoomName !== room.name) onUpdateRoomName(newRoomName);
    setIsEditingName(false);
  };

  const handleSaveUserName = () => {
    if (newUserName.trim() && newUserName !== user.name) onUpdateUserName(newUserName);
    setIsEditingUser(false);
  };

  const onGameOver = (game: 'derby' | 'heat' | 'stealer', score: number) => {
    onSaveScore(game, score);
    const msgs = {
      derby: `⚾ CRACKED A ${score}FT HOME RUN!`,
      heat: `🔥 CAUGHT HEAT AT ${score}MS!`,
      stealer: `🏃 STOLE SECOND IN ${score}S!`
    };
    onSendMessage(msgs[game]);
    setActiveGame(null);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="w-full max-w-6xl h-screen md:h-[90vh] flex flex-col md:flex-row bg-slate-900 rounded-none md:rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800">
      
      {activeGame === 'derby' && <HomeRunGame onGameOver={(d) => onGameOver('derby', d)} onClose={() => setActiveGame(null)} />}
      {activeGame === 'heat' && <ReactionGame onGameOver={(ms) => onGameOver('heat', ms)} onClose={() => setActiveGame(null)} />}
      {activeGame === 'stealer' && <BaseStealer onGameOver={(s) => onGameOver('stealer', s)} onClose={() => setActiveGame(null)} />}

      {/* Sidebar */}
      <div className={`
        ${showMembers ? 'fixed inset-0 flex' : 'hidden md:flex'} 
        w-full md:w-80 flex-col bg-slate-950 border-r border-slate-800 z-[120] md:relative md:z-10
      `}>
        <div className="p-4 safe-pt border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex bg-slate-900 p-1 rounded-xl w-full mr-2">
            <button onClick={() => setSidebarTab('lineup')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'lineup' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}>Lineup</button>
            <button onClick={() => setSidebarTab('hall')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'hall' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}>Records</button>
          </div>
          <button onClick={() => setShowMembers(false)} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {sidebarTab === 'lineup' ? (
            room.members.map((member) => {
              const isMe = member.id === user.id;
              return (
                <div key={member.id} className={`flex items-center justify-between p-3 rounded-2xl bg-slate-900 border ${isMe ? 'border-indigo-900 ring-2 ring-indigo-900/50' : 'border-slate-800'} shadow-sm`}>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${member.role === 'admin' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40' : 'bg-slate-700'}`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      {isMe && isEditingUser ? (
                        <input className="text-sm font-bold text-slate-100 bg-slate-950 border-b-2 border-indigo-500 outline-none w-24" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} onBlur={handleSaveUserName} onKeyDown={(e) => e.key === 'Enter' && handleSaveUserName()} autoFocus />
                      ) : (
                        <div className="flex items-center space-x-1">
                          <div className="text-sm font-bold text-slate-100 truncate">{isMe ? user.name : member.name}</div>
                          {isMe && <button onClick={() => setIsEditingUser(true)} className="p-0.5 text-slate-500 hover:text-indigo-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
                        </div>
                      )}
                      {member.role === 'admin' && <div className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest">Admin</div>}
                    </div>
                  </div>
                  {isAdmin && !isMe && (
                    <button onClick={() => confirm(`Remove ${member.name}?`) && onRemoveMember(member.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="space-y-6">
              {['derby', 'heat', 'stealer'].map(game => (
                <div key={game}>
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">{game === 'derby' ? 'Home Run Derby (ft)' : game === 'heat' ? 'Heater (ms)' : 'Stealing (s)'}</h4>
                  <div className="space-y-1.5">
                    {room.leaderboard[game as keyof typeof room.leaderboard].map((entry, idx) => (
                      <div key={entry.userId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-lg text-[10px] font-black ${idx === 0 ? 'bg-amber-900/30 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">{entry.userName}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-400">{entry.score}</span>
                      </div>
                    ))}
                    {room.leaderboard[game as keyof typeof room.leaderboard].length === 0 && <div className="text-[10px] text-slate-600 italic p-2">Empty Dugout</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {installPrompt && (
            <button onClick={installPrompt} className="w-full bg-slate-900 text-slate-100 font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest text-center transition hover:bg-slate-800 border border-slate-800">📥 Save to Home</button>
          )}
          <button onClick={onLogout} className="w-full text-slate-600 hover:text-rose-500 font-bold py-2 text-[10px] uppercase tracking-[0.2em] text-center transition">Sign Out</button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        <header className="px-6 py-5 safe-pt border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center space-x-4 overflow-hidden">
            <button onClick={() => setShowMembers(true)} className="md:hidden p-2 text-slate-400 bg-slate-800 rounded-xl hover:text-white transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            <div className="flex-1 overflow-hidden">
              {isEditingName ? (
                <input className="text-xl font-bold text-slate-100 bg-slate-950 border-2 border-indigo-900 rounded-xl px-3 py-1 outline-none w-full" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} onBlur={handleSaveRoomName} onKeyDown={(e) => e.key === 'Enter' && handleSaveRoomName()} autoFocus />
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h1 className="text-2xl font-extrabold text-slate-100 truncate tracking-tight">{room.name}</h1>
                  {isAdmin && <button onClick={() => setIsEditingName(true)} className="p-1.5 text-slate-600 hover:text-indigo-400 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setActiveGame('derby')} className="hidden sm:flex items-center space-x-2 bg-slate-950 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition border border-slate-800"><span>⚾ Derby</span></button>
            <button onClick={() => setActiveGame('heat')} className="hidden sm:flex items-center space-x-2 mlb-gradient text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition"><span>🔥 Heat</span></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-950/50 custom-scrollbar">
          {room.messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.content.includes('⚾') || msg.content.includes('🔥') || msg.content.includes('🏃');
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-600 mb-1 ml-1">{msg.senderName}</span>}
                  <div className={`px-5 py-3 rounded-2xl text-[14px] shadow-lg break-words ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : isSystem ? 'bg-slate-900 border-2 border-indigo-900 text-indigo-400 font-black italic rounded-xl' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>{msg.content}</div>
                  <span className="text-[8px] text-slate-700 mt-1 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 bg-slate-900 border-t border-slate-800 safe-pb">
          <form onSubmit={handleSend} className="flex space-x-3 max-w-5xl mx-auto">
            <input type="text" className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-2xl px-6 py-4 text-sm font-medium focus:bg-slate-900 focus:border-indigo-600 text-slate-100 outline-none transition-all shadow-inner" placeholder="Message the dugout..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
            <button type="submit" disabled={!inputMessage.trim()} className="bg-indigo-600 text-white px-8 rounded-2xl hover:bg-indigo-700 transition shadow-xl active:scale-95 disabled:opacity-30"><svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatRoomComponent;
