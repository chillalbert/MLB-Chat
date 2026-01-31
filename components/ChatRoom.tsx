
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatRoom, Message } from '../types';

interface ChatRoomProps {
  user: User;
  room: ChatRoom;
  onSendMessage: (content: string) => void;
  onUpdateRoomName: (newName: string) => void;
  onUpdateRoomCode: (newCode: string) => void;
  onRemoveMember: (userId: string) => void;
  onLogout: () => void;
}

const ChatRoomComponent: React.FC<ChatRoomProps> = ({
  user,
  room,
  onSendMessage,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCount = useRef(room.messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Notification setup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    
    // Notification logic
    if (room.messages.length > prevMessagesCount.current) {
      const latestMsg = room.messages[room.messages.length - 1];
      if (latestMsg.senderId !== user.id && latestMsg.senderId !== 'system') {
        if (Notification.permission === 'granted' && document.hidden) {
          new Notification(`New message from ${latestMsg.senderName}`, {
            body: latestMsg.content,
            icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
          });
        }
      }
    }
    prevMessagesCount.current = room.messages.length;
  }, [room.messages, user.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleUpdateName = () => {
    onUpdateRoomName(newRoomName);
    setIsEditingName(false);
  };

  const handleUpdateCode = () => {
    onUpdateRoomCode(newRoomCode);
    setIsEditingCode(false);
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="w-full max-w-6xl h-[100vh] md:h-[90vh] flex flex-col md:flex-row bg-white rounded-none md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Sidebar - Members List */}
      <div className={`
        ${showMembers ? 'fixed inset-0 flex' : 'hidden md:flex'} 
        w-full md:w-80 flex-col bg-gray-50 border-r border-gray-200 z-50 md:relative md:z-10
      `}>
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-gray-900 uppercase tracking-tighter">Lineup</h3>
              <span className="bg-[#BA0C2F] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium">Currently in the dugout</p>
          </div>
          <button onClick={() => setShowMembers(false)} className="md:hidden p-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {room.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition duration-200">
              <div className="flex items-center space-x-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg
                  ${member.role === 'admin' ? 'mlb-gradient' : 'bg-gray-300'}`}>
                  {member.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-gray-900 flex items-center">
                    {member.name}
                    {member.role === 'admin' && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-blue-50 text-[10px] text-blue-700 font-black rounded uppercase">Admin</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">{member.email}</div>
                </div>
              </div>
              
              {isAdmin && member.id !== user.id && (
                <button 
                  onClick={() => onRemoveMember(member.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Remove Member"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
           {isAdmin && (
             <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
               <label className="block text-[10px] font-black text-blue-900 uppercase mb-1">Room Code</label>
               {isEditingCode ? (
                 <div className="flex items-center space-x-2">
                   <input
                    className="flex-1 text-sm font-mono font-bold bg-white border border-blue-200 rounded px-2 py-1 outline-none uppercase"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                   />
                   <button onClick={handleUpdateCode} className="text-blue-700 font-bold text-xs uppercase">Save</button>
                 </div>
               ) : (
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-mono font-bold text-blue-900">{room.code}</span>
                   <button onClick={() => setIsEditingCode(true)} className="text-[10px] font-bold text-blue-700 uppercase hover:underline">Change</button>
                 </div>
               )}
             </div>
           )}
           <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 text-gray-500 hover:text-red-600 font-bold py-3 px-4 rounded-xl transition hover:bg-red-50 text-sm uppercase tracking-wider"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
             <span>Leave Dugout</span>
           </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowMembers(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl">
               <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16" />
               </svg>
            </button>
            
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    className="text-xl font-black border-b-2 border-[#BA0C2F] outline-none px-1 uppercase tracking-tight"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{room.name}</h1>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditingName(true)} 
                      className="p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Ballpark Feed</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
             <div className="text-right">
               <div className="text-sm font-black text-gray-900 uppercase">{user.name}</div>
               <div className="text-[9px] text-[#BA0C2F] font-black uppercase tracking-[0.2em]">{user.role}</div>
             </div>
             <div className="w-11 h-11 rounded-2xl mlb-gradient flex items-center justify-center text-white font-black shadow-xl shadow-blue-100 border-2 border-white">
               {user.name.charAt(0)}
             </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white">
          {room.messages.map((msg, index) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.senderId === 'system';
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm mt-1
                    ${isMe ? 'ml-3 bg-[#BA0C2F]' : 'mr-3 bg-[#002D72]'}`}>
                    {msg.senderName.charAt(0)}
                  </div>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <div className="text-[10px] font-black text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">{msg.senderName}</div>}
                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-gray-900 text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`text-[9px] mt-1.5 font-bold text-gray-400 uppercase tracking-widest ${isMe ? 'mr-1' : 'ml-1'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:bg-white focus:border-[#002D72] focus:ring-0 outline-none transition"
                placeholder="Message the dugout..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="mlb-gradient text-white p-4 rounded-2xl hover:opacity-90 transition disabled:opacity-30 disabled:grayscale shadow-xl shadow-blue-900/10"
            >
              <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatRoomComponent;
