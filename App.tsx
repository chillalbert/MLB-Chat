
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
  
  // Gun instance
  const gunRef = useRef<any>(null);
  const roomNodeRef = useRef<any>(null);

  // Initialize Gun on mount
  useEffect(() => {
    // Public Gun relays for peer-to-peer sync
    gunRef.current = Gun([
      'https://gun-manhattan.herokuapp.com/gun',
      'https://peer.wall.org/gun'
    ]);
  }, []);

  // Handle Session Recovery on Mount
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setView(AppState.JOIN); // Force them to enter code again for security or we could auto-join
    }
  }, []);

  // Sync with Gun when a room is joined
  const syncRoom = useCallback((code: string) => {
    if (!gunRef.current) return;
    
    const roomKey = `sports_square_room_${code.toUpperCase()}`;
    roomNodeRef.current = gunRef.current.get(roomKey);

    // Sync Messages
    roomNodeRef.current.get('messages').map().on((msg: any, id: string) => {
      if (!msg) return;
      setChatRoom(prev => {
        if (prev.messages.some(m => m.id === id)) return prev;
        const newMsg = { ...msg, id };
        return {
          ...prev,
          messages: [...prev.messages, newMsg].sort((a, b) => a.timestamp - b.timestamp)
        };
      });
    });

    // Sync Members
    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      if (!member) return;
      setChatRoom(prev => {
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    // Sync Room Metadata
    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (!meta) return;
      setChatRoom(prev => ({
        ...prev,
        name: meta.name || prev.name,
        code: meta.code || prev.code
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
    const normalizedEmail = email.toLowerCase();
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
    // In this multi-user version, we check the code against the global Gun state
    // But for the initial "creation", we allow any code that matches DEFAULT or user entered
    // For simplicity, we just sync to whatever code they enter.
    if (currentUser) {
      syncRoom(code);
      
      // Register self as member in Gun
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
    
    const msgId = Math.random().toString(36).substr(2, 9);
    roomNodeRef.current.get('messages').get(msgId).put({
      senderId: isSystem ? 'system' : currentUser!.id,
      senderName: isSystem ? 'Ballpark' : currentUser!.name,
      content,
      timestamp: Date.now()
    });
  }, [currentUser]);

  const submitGameScore = useCallback((record: GameRecord) => {
    if (!roomNodeRef.current) return;
    const scoreId = `score_${Date.now()}`;
    roomNodeRef.current.get('leaderboard').get(scoreId).put(record);
    
    const msg = record.type === 'reaction' 
      ? `⚡️ ${record.userName} just clocked a ${record.score}ms reaction!`
      : `⚾️ ${record.userName} blasted a ${record.score}ft shot!`;
    
    sendMessage(msg, true);
  }, [sendMessage]);

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    roomNodeRef.current.get('metadata').get('name').put(newName);
  };

  const adminUpdateRoomCode = (newCode: string) => {
    if (currentUser?.role !== 'admin' || !roomNodeRef.current) return;
    roomNodeRef.current.get('metadata').get('code').put(newCode.toUpperCase());
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
          onMarkRead={() => {}} // Mark read is local only in this simple sync version
          onUpdateRoomName={adminUpdateRoomName}
          onUpdateRoomCode={adminUpdateRoomCode}
          onRemoveMember={adminRemoveMember}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
