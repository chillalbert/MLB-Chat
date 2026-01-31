
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChatRoom, AppState, Message, GameRecord } from './types';
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

  // Initialize Gun with a more resilient set of peers
  useEffect(() => {
    // These are public community relays. Some might fail, Gun will skip them automatically.
    gunRef.current = Gun({
      peers: [
        'https://gun-manhattan.herokuapp.com/gun',
        'https://peer.wall.org/gun',
        'https://gunjs.herokuapp.com/gun',
        'https://dletta.herokuapp.com/gun'
      ],
      localStorage: true
    });

    // Check if we are connected to at least one peer
    const checkConnection = setInterval(() => {
      const peers = (gunRef.current as any)._?.opt?.peers || {};
      const active = Object.values(peers).some((p: any) => p.wire && p.wire.readyState === 1);
      setIsConnected(active);
    }, 3000);

    return () => clearInterval(checkConnection);
  }, []);

  // Session Recovery & Admin Enforcement
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      const isActuallyAdmin = savedUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
      const userWithProperRole = {
        ...savedUser,
        role: isActuallyAdmin ? 'admin' : 'member'
      } as User;
      
      setCurrentUser(userWithProperRole);
      setView(AppState.JOIN);
    }
  }, []);

  const syncRoom = useCallback((code: string) => {
    if (!gunRef.current) return;
    
    const cleanCode = code.toUpperCase().trim();
    // Unique key for this specific chat room on the global Gun network
    const roomKey = `mlb_pro_sync_v5_${cleanCode}`;
    roomNodeRef.current = gunRef.current.get(roomKey);

    setChatRoom(prev => ({ ...prev, code: cleanCode, messages: [], members: [] }));

    // Listen for Messages
    roomNodeRef.current.get('messages').map().on((msg: any, id: string) => {
      if (!msg) return;
      setChatRoom(prev => {
        // Prevent duplicates
        if (prev.messages.some(m => m.id === id)) return prev;
        const newMessages = [...prev.messages, { ...msg, id }]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-100); // Only keep last 100 for performance
        return { ...prev, messages: newMessages };
      });
    });

    // Listen for Members
    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      setChatRoom(prev => {
        if (!member) {
          return { ...prev, members: prev.members.filter(m => m.id !== id) };
        }
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    // Listen for Room Metadata (Name changes)
    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (meta && meta.name) {
        setChatRoom(prev => ({ ...prev, name: meta.name }));
      }
    });

    // Listen for Leaderboard
    roomNodeRef.current.get('leaderboard').map().on((rec: any, id: string) => {
      if (!rec) return;
      setChatRoom(prev => {
        if (prev.leaderboard.some(r => r.timestamp === rec.timestamp)) return prev;
        const updated = [...prev.leaderboard, rec].sort((a, b) => {
          if (rec.type === 'reaction') return a.score - b.score;
          return b.score - a.score;
        }).slice(0, 10);
        return { ...prev, leaderboard: updated };
      });
    });
  }, []);

  const handleAuth = (email: string, name: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    const isActuallyAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase().trim();
    
    const playerProfile: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: normalizedEmail,
      name: name || 'Rookie',
      role: isActuallyAdmin ? 'admin' : 'member',
      joinedAt: Date.now()
    };

    setCurrentUser(playerProfile);
    saveCurrentUser(playerProfile);
    setView(AppState.JOIN);
  };

  const handleJoinChat = (code: string) => {
    if (currentUser) {
      const roomCode = code.toUpperCase().trim();
      syncRoom(roomCode);
      
      // Add self to the global member list for this room
      roomNodeRef.current.get('members').get(currentUser.id).put({
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        joinedAt: currentUser.joinedAt
      });

      setView(AppState.CHAT);
    }
  };

  const sendMessage = useCallback((content: string, isSystem = false) => {
    if (!currentUser && !isSystem) return;
    if (!roomNodeRef.current) return;
    
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    roomNodeRef.current.get('messages').get(msgId).put({
      senderId: isSystem ? 'system' : currentUser!.id,
      senderName: isSystem ? 'Stadium' : currentUser!.name,
      content,
      timestamp: Date.now()
    });
  }, [currentUser]);

  const submitGameScore = useCallback((record: GameRecord) => {
    if (!roomNodeRef.current) return;
    const scoreId = `score_${Date.now()}`;
    roomNodeRef.current.get('leaderboard').get(scoreId).put(record);
    
    const msg = record.type === 'reaction' 
      ? `⚡️ ${record.userName} clocked a ${record.score}ms heat!`
      : `⚾️ ${record.userName} crushed a ${record.score}ft homer!`;
    
    sendMessage(msg, true);
  }, [sendMessage]);

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    roomNodeRef.current.get('metadata').put({ name: newName });
  };

  const adminRemoveMember = (userId: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    // Set to null in Gun to remove from graph
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-0 md:p-4">
      {/* Global Connection Status */}
      {view === AppState.CHAT && (
        <div className="fixed top-3 right-3 z-[60] flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 shadow-sm pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
            {isConnected ? 'Online & Synced' : 'Connecting...'}
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
          onSendMessage={(content) => sendMessage(content)}
          onSystemMessage={(content) => sendMessage(content, true)}
          onGameScore={submitGameScore}
          onMarkRead={() => {}} 
          onUpdateRoomName={adminUpdateRoomName}
          onUpdateRoomCode={() => {}} 
          onRemoveMember={adminRemoveMember}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
