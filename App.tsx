
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChatRoom, AppState } from './types';
import { ADMIN_EMAIL, INITIAL_CHAT_ROOM } from './constants';
import { getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';
import Gun from 'gun';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom>(INITIAL_CHAT_ROOM);
  const [view, setView] = useState<AppState>(AppState.AUTH);
  const [isConnected, setIsConnected] = useState(false);
  
  const gunRef = useRef<any>(null);
  const roomNodeRef = useRef<any>(null);

  // Initialize Gun with more reliable global peers
  useEffect(() => {
    gunRef.current = Gun({
      peers: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://peer.wall.org/gun',
        'https://relay.peer.ooo/gun',
        'https://gunjs.herokuapp.com/gun'
      ],
      localStorage: true
    });

    const checkConn = setInterval(() => {
      const peers = (gunRef.current as any)._?.opt?.peers || {};
      const active = Object.values(peers).some((p: any) => p.wire && p.wire.readyState === 1);
      setIsConnected(active);
    }, 3000);

    return () => clearInterval(checkConn);
  }, []);

  // Restore user session - strictly enforce the ADMIN_EMAIL check
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      const emailLower = savedUser.email.toLowerCase().trim();
      const isAdmin = emailLower === ADMIN_EMAIL.toLowerCase().trim();
      const userWithRole = { ...savedUser, role: isAdmin ? 'admin' : 'member' } as User;
      setCurrentUser(userWithRole);
      setView(AppState.JOIN);
    }
  }, []);

  const syncRoom = useCallback((code: string) => {
    if (!gunRef.current) return;
    
    const cleanCode = code.toUpperCase().trim();
    // Use a unique key for the room data
    const roomKey = `v15_prod_chat_${cleanCode}`;
    roomNodeRef.current = gunRef.current.get(roomKey);

    setChatRoom(prev => ({ ...prev, code: cleanCode, messages: [], members: [] }));

    // Real-time Messages
    roomNodeRef.current.get('messages').map().on((msg: any, id: string) => {
      if (!msg) return;
      setChatRoom(prev => {
        if (prev.messages.some(m => m.id === id)) return prev;
        const newMessages = [...prev.messages, { ...msg, id }]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-100);
        return { ...prev, messages: newMessages };
      });
    });

    // Real-time Members
    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      setChatRoom(prev => {
        if (!member) return { ...prev, members: prev.members.filter(m => m.id !== id) };
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    // Room Metadata (Name changes)
    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (meta && meta.name) {
        setChatRoom(prev => ({ ...prev, name: meta.name }));
      }
    });
  }, []);

  const handleAuth = (email: string, name: string) => {
    const emailClean = email.toLowerCase().trim();
    const isAdmin = emailClean === ADMIN_EMAIL.toLowerCase().trim();
    
    // FIX: Instead of random ID, use email-based ID so users aren't duplicated
    const userId = `u_${btoa(emailClean).replace(/=/g, '').slice(0, 16)}`;
    
    const profile: User = {
      id: userId,
      email: emailClean,
      name: name || (isAdmin ? 'Admin' : 'User'),
      role: isAdmin ? 'admin' : 'member',
      joinedAt: Date.now()
    };

    setCurrentUser(profile);
    saveCurrentUser(profile);
    setView(AppState.JOIN);
  };

  const handleJoinChat = (code: string) => {
    if (currentUser) {
      const cleanCode = code.toUpperCase().trim();
      syncRoom(cleanCode);
      
      // Upsert presence in the room
      roomNodeRef.current.get('members').get(currentUser.id).put({
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      });

      setView(AppState.CHAT);
    }
  };

  const sendMessage = useCallback((content: string) => {
    if (!currentUser || !roomNodeRef.current) return;
    
    const msgId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    roomNodeRef.current.get('messages').get(msgId).put({
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: content.trim(),
      timestamp: Date.now()
    });
  }, [currentUser]);

  const updateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    roomNodeRef.current.get('metadata').put({ name: newName });
  };

  const removeMember = (userId: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    // Removing member from the node
    roomNodeRef.current.get('members').get(userId).put(null);
  };

  const handleLogout = () => {
    clearAppData();
    setCurrentUser(null);
    setChatRoom(INITIAL_CHAT_ROOM);
    setView(AppState.AUTH);
    if (roomNodeRef.current) roomNodeRef.current.off();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-6 overflow-hidden">
      {view === AppState.CHAT && (
        <div className="fixed top-4 right-4 z-[100] flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {isConnected ? 'Online' : 'Connecting'}
          </span>
        </div>
      )}

      {view === AppState.AUTH && <AuthForm onAuth={handleAuth} />}
      
      {view === AppState.JOIN && currentUser && (
        <JoinForm 
          userName={currentUser.name} 
          onJoin={handleJoinChat} 
          onLogout={handleLogout}
        />
      )}

      {view === AppState.CHAT && currentUser && (
        <ChatRoomComponent
          user={currentUser}
          room={chatRoom}
          onSendMessage={sendMessage}
          onUpdateRoomName={updateRoomName}
          onRemoveMember={removeMember}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
