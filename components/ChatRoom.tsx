
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatRoom, Message } from '../types';

interface ChatRoomProps {
  user: User;
  room: ChatRoom;
  onSendMessage: (content: string) => void;
  onUpdateRoomName: (newName: string) => void;
  onRemoveMember: (userId: string) => void;
  onLogout: () => void;
}

const ChatRoomComponent: React.FC<ChatRoomProps> = ({
  user,
  room,
  onSendMessage,
  onUpdateRoomName,
  onRemoveMember,
  onLogout
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newRoomName, setNewRoomName] = useState(room.name);
  const [showMembers, setShowMembers] = useState(false);
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

  const handleSaveName = () => {
    if (newRoomName.trim() && newRoomName !== room.name) {
      onUpdateRoomName(newRoomName);
    }
    setIsEditingName(false);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="w-full max-w-6xl h-screen md:h-[85vh] flex flex-col md:flex-row bg-white rounded-none md:rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
      
      {/* Sidebar - Lineup */}
      <div className={`
        ${showMembers ? 'fixed inset-0 flex' : 'hidden md:flex'} 
        w-full md:w-80 flex-col bg-slate-50 border-r border-slate-200 z-[120] md:relative md:z-10
      `}>
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
          <h3 className="font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">Active Lineup</h3>
          <button onClick={() => setShowMembers(false)} className="md:hidden p-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {room.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${member.role === 'admin' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-slate-700 truncate">{member.name}</div>
                  {member.role === 'admin' && <div className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-widest">Admin</div>}
                </div>
              </div>
              {isAdmin && member.id !== user.id && (
                <button 
                  onClick={() => confirm(`Remove ${member.name}?`) && onRemoveMember(member.id)} 
                  className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                  title="Kick Member"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white">
          <button onClick={onLogout} className="w-full text-slate-400 hover:text-rose-600 font-bold py-2 text-[10px] uppercase tracking-[0.2em] text-center transition">Logout</button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <header className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
          <div className="flex items-center space-x-4 overflow-hidden">
            <button onClick={() => setShowMembers(true)} className="md:hidden p-2 text-slate-600 bg-slate-100 rounded-xl">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1 overflow-hidden">
              {isEditingName ? (
                <input 
                  className="text-xl font-bold text-slate-800 bg-slate-50 border-2 border-indigo-200 rounded-xl px-3 py-1 outline-none w-full" 
                  value={newRoomName} 
                  onChange={(e) => setNewRoomName(e.target.value)} 
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus 
                />
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h1 className="text-2xl font-extrabold text-slate-800 truncate tracking-tight">{room.name}</h1>
                  {isAdmin && (
                    <button onClick={() => setIsEditingName(true)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                </div>
              )}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code: {room.code}</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-3">
             <div className="text-right">
               <div className="text-sm font-bold text-slate-900">{user.name}</div>
               <div className="text-[9px] text-indigo-600 font-extrabold uppercase">{isAdmin ? 'Manager' : 'Player'}</div>
             </div>
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/20 custom-scrollbar">
          {room.messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.senderName}</span>}
                  <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm break-words ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] text-slate-300 mt-1 font-bold uppercase tracking-tighter">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 md:p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex space-x-3 max-w-5xl mx-auto">
            <input 
              type="text" 
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
              placeholder="Message the lineup..." 
              value={inputMessage} 
              onChange={(e) => setInputMessage(e.target.value)} 
            />
            <button 
              type="submit" 
              disabled={!inputMessage.trim()} 
              className="bg-indigo-600 text-white px-6 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-100 active:scale-95"
            >
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatRoomComponent;
