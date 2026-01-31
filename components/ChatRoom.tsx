
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatRoom, Message, GameRecord } from '../types';
import HomeRunGame from './HomeRunGame';
import ReactionGame from './ReactionGame';

interface ChatRoomProps {
  user: User;
  room: ChatRoom;
  onSendMessage: (content: string) => void;
  onSystemMessage: (content: string) => void;
  onGameScore: (record: GameRecord) => void;
  onMarkRead: () => void;
  onUpdateRoomName: (newName: string) => void;
  onUpdateRoomCode: (newCode: string) => void;
  onRemoveMember: (userId: string) => void;
  onLogout: () => void;
}

const ChatRoomComponent: React.FC<ChatRoomProps> = ({
  user,
  room,
  onSendMessage,
  onSystemMessage,
  onGameScore,
  onMarkRead,
  onUpdateRoomName,
  onUpdateRoomCode,
  onRemoveMember,
  onLogout
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newRoomName, setNewRoomName] = useState(room.name);
  const [newRoomCode, setNewRoomCode] = useState(room.code);
  const [showMembers, setShowMembers] = useState(false);
  const [activeGame, setActiveGame] = useState<'none' | 'homerun' | 'reaction'>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (room.messages.length > 0) onMarkRead();
  }, [room.messages, onMarkRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  // Fix: Added handleUpdateName to persist room name changes
  const handleUpdateName = () => {
    if (newRoomName.trim()) {
      onUpdateRoomName(newRoomName);
      setIsEditingName(false);
    }
  };

  // Fix: Added handleUpdateCode to resolve "Cannot find name 'handleUpdateCode'" error
  const handleUpdateCode = () => {
    if (newRoomCode.trim()) {
      onUpdateRoomCode(newRoomCode);
      setIsEditingCode(false);
    }
  };

  const handleHRGameOver = (distance: number) => {
    setActiveGame('none');
    onGameScore({
      userName: user.name,
      score: distance,
      type: 'homerun',
      timestamp: Date.now()
    });
  };

  const handleReactionGameOver = (ms: number) => {
    setActiveGame('none');
    onGameScore({
      userName: user.name,
      score: ms,
      type: 'reaction',
      timestamp: Date.now()
    });
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="w-full max-w-6xl h-[100vh] md:h-[90vh] flex flex-col md:flex-row bg-white rounded-none md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {activeGame === 'homerun' && <HomeRunGame onClose={() => setActiveGame('none')} onGameOver={handleHRGameOver} />}
      {activeGame === 'reaction' && <ReactionGame onClose={() => setActiveGame('none')} onGameOver={handleReactionGameOver} />}

      {/* Sidebar - Members List & Leaderboard */}
      <div className={`
        ${showMembers ? 'fixed inset-0 flex' : 'hidden md:flex'} 
        w-full md:w-80 flex-col bg-gray-50 border-r border-gray-200 z-50 md:relative md:z-10
      `}>
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-gray-900 uppercase tracking-tighter">Lineup</h3>
              <span className="bg-[#BA0C2F] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Live</span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Currently in the dugout</p>
          </div>
          <button onClick={() => setShowMembers(false)} className="md:hidden p-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <div className="flex items-center space-x-2 px-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</h4>
            </div>
            <div className="space-y-2">
              {room.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-white transition duration-200 border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm ${member.role === 'admin' ? 'mlb-gradient' : 'bg-gray-300'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-gray-900 truncate">{member.name}</div>
                      {member.role === 'admin' && <div className="text-[8px] text-blue-600 font-black uppercase">Coach</div>}
                    </div>
                  </div>
                  {isAdmin && member.id !== user.id && (
                    <button onClick={() => onRemoveMember(member.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center space-x-2 px-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-orange-600">League Records</h4>
            </div>
            <div className="space-y-2">
              {room.leaderboard.length === 0 ? (
                <div className="text-[10px] font-bold text-gray-400 italic px-2">No stats recorded yet this season...</div>
              ) : (
                room.leaderboard.map((rec, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-gray-900 uppercase truncate">{rec.userName}</div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase">{rec.type === 'reaction' ? 'Heat Challenge' : 'Derby Distance'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-blue-700 italic">{rec.score}{rec.type === 'reaction' ? 'ms' : 'ft'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white space-y-2">
           <div className="grid grid-cols-2 gap-2">
             <button onClick={() => setActiveGame('homerun')} className="bg-orange-50 text-orange-700 font-black py-2.5 px-2 rounded-xl border border-orange-100 text-[10px] uppercase hover:bg-orange-100 transition">⚾️ Derby</button>
             <button onClick={() => setActiveGame('reaction')} className="bg-blue-50 text-blue-700 font-black py-2.5 px-2 rounded-xl border border-blue-100 text-[10px] uppercase hover:bg-blue-100 transition">⚡️ Heat</button>
           </div>
           {isAdmin && (
             <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
               <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Dugout Entry Code</label>
               {isEditingCode ? (
                 <div className="flex items-center space-x-2">
                   <input className="flex-1 text-xs font-black bg-white border border-gray-300 rounded px-2 py-1 outline-none uppercase" value={newRoomCode} onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())} />
                   <button onClick={handleUpdateCode} className="text-blue-700 font-black text-[10px] uppercase">OK</button>
                 </div>
               ) : (
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-black text-[#002D72]">{room.code}</span>
                   <button onClick={() => setIsEditingCode(true)} className="text-[8px] font-black text-blue-600 uppercase">Edit</button>
                 </div>
               )}
             </div>
           )}
           <button onClick={onLogout} className="w-full text-gray-400 hover:text-red-600 font-black py-2 text-[10px] uppercase tracking-widest">Sign Out</button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowMembers(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
               <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2 group">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} autoFocus />
                    <button onClick={handleUpdateName} className="text-blue-700 font-black text-xs uppercase">Save</button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{room.name}</h1>
                    {isAdmin && <button onClick={() => setIsEditingName(true)} className="p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-0.5"><span className="flex h-1.5 w-1.5"><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Stadium Feed Live</span></div>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
             <div className="text-right">
               <div className="text-xs font-black text-gray-900 uppercase">{user.name}</div>
               <div className="text-[8px] text-[#BA0C2F] font-black uppercase tracking-widest">{user.role}</div>
             </div>
             <div className="w-10 h-10 rounded-xl mlb-gradient flex items-center justify-center text-white font-black shadow-lg border-2 border-white">{user.name.charAt(0)}</div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white">
          {room.messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.senderId === 'system';
            const readCount = (msg.readBy?.filter(id => id !== msg.senderId).length || 0);
            const isRead = readCount > 0;
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-6">
                  <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl uppercase tracking-widest text-center max-w-sm shadow-sm leading-relaxed">
                    📢 {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-sm mt-1 ${isMe ? 'ml-3 bg-[#BA0C2F]' : 'mr-3 bg-[#002D72]'}`}>{msg.senderName.charAt(0)}</div>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <div className="text-[9px] font-black text-gray-400 mb-1 ml-1 uppercase tracking-wider">{msg.senderName}</div>}
                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isMe ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-100'}`}>{msg.content}</div>
                    <div className={`flex items-center space-x-1.5 mt-1.5 font-bold uppercase tracking-widest ${isMe ? 'mr-1' : 'ml-1'}`}>
                      <span className="text-[8px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && (
                        <div className={`flex -space-x-1 ${isRead ? 'text-blue-500' : 'text-gray-200'}`}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <footer className="p-4 md:p-6 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-center space-x-3 max-w-4xl mx-auto">
            <input type="text" className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:border-[#002D72] focus:ring-0 outline-none transition" placeholder="Message the dugout..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
            <button type="submit" disabled={!inputMessage.trim()} className="mlb-gradient text-white p-4 rounded-2xl hover:opacity-90 transition disabled:opacity-30 shadow-xl shadow-blue-900/10"><svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatRoomComponent;
