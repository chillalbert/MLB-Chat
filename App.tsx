
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

  // Initialize Gun with more robust public relays
  useEffect(() => {
    gunRef.current = Gun([
      'https://gun-manhattan.herokuapp.com/gun',
      'https://gunjs.herokuapp.com/gun',
      'https://peer.wall.org/gun',
      'https://www.raygun.live/gun'
    ]);

    // Check connection status
    const mesh = (gunRef.current as any)._?.opt?.mesh;
    if (mesh) {
      const checkConn = setInterval(() => {
        // Basic check if we have active peers
        const peers = Object.values((gunRef.current as any)._?.opt?.peers || {});
        const active = peers.some((p: any) => p.wire && p.wire.readyState === 1);
        setIsConnected(active);
      }, 3000);
      return () => clearInterval(checkConn);
    }
  }, []);

  // Session Recovery
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      // Force admin status if email matches yours
      const isAdmin = savedUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const updatedUser = { ...savedUser, role: isAdmin ? 'admin' : 'member' } as User;
      
      setCurrentUser(updatedUser);
      setView(AppState.JOIN);
    }
  }, []);

  const syncRoom = useCallback((code: string) => {
    if (!gunRef.current) return;
    
    // Clear current messages before syncing new room
    setChatRoom(prev => ({ ...prev, messages: [], members: [] }));

    const roomKey = `sports_square_v3_${code.toUpperCase().trim()}`;
    roomNodeRef.current = gunRef.current.get(roomKey);

    // Sync Messages - limit to last 50 for performance
    roomNodeRef.current.get('messages').map().on((msg: any, id: string) => {
      if (!msg) return;
      setChatRoom(prev => {
        if (prev.messages.some(m => m.id === id)) return prev;
        const newMessages = [...prev.messages, { ...msg, id }]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-100); // Keep last 100
        return { ...prev, messages: newMessages };
      });
    });

    // Sync Members
    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      if (!member) {
        setChatRoom(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
        return;
      }
      setChatRoom(prev => {
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    // Sync Room Metadata (Name)
    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (!meta) return;
      setChatRoom(prev => ({
        ...prev,
        name: meta.name || prev.name
      }));
    });

    // Sync Leaderboard
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
    const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    
    const playerProfile: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name: name || 'Player',
      role: isAdmin ? 'admin' : 'member',
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
      
      // Register self
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
      senderName: isSystem ? 'Ballpark' : currentUser!.name,
      content,
      timestamp: Date.now()
    });
  }, [currentUser]);

  const submitGameScore = useCallback((record: GameRecord) => {
    if (!roomNodeRef.current) return;
    const scoreId = `score_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    roomNodeRef.current.get('leaderboard').get(scoreId).put(record);
    
    const msg = record.type === 'reaction' 
      ? `⚡️ ${record.userName} clocked ${record.score}ms!`
      : `⚾️ ${record.userName} hit it ${record.score}ft!`;
    
    sendMessage(msg, true);
  }, [sendMessage]);

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    roomNodeRef.current.get('metadata').put({ name: newName });
  };

  const adminRemoveMember = (userId: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
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
      {/* Real-time Connection Status Indicator */}
      {view === AppState.CHAT && (
        <div className="fixed top-2 right-2 z-[60] flex items-center space-x-2 bg-white/80 backdrop-blur px-2 py-1 rounded-full border border-gray-200 shadow-sm pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
            {isConnected ? 'Sync Active' : 'Connecting...'}
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
          onUpdateRoomCode={() => {}} // Code is derived from join
          onRemoveMember={adminRemoveMember}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
