
import React, { useState, useEffect, useCallback } from 'react';
import { User, ChatRoom, AppState, Message, GameRecord } from './types';
import { ADMIN_EMAIL } from './constants';
import { getChatData, saveChatData, getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom>(getChatData());
  const [view, setView] = useState<AppState>(AppState.AUTH);
  
  // Sync state to localStorage whenever chatRoom changes
  useEffect(() => {
    saveChatData(chatRoom);
  }, [chatRoom]);

  // Handle Session Recovery on Mount
  useEffect(() => {
    const savedUser = getCurrentUser();
    const currentRoom = getChatData();
    setChatRoom(currentRoom);

    if (savedUser) {
      const email = savedUser.email.toLowerCase();
      // Check if this user is a registered member of the dugout
      const memberMatch = currentRoom.members.find(m => m.email.toLowerCase() === email);
      
      if (memberMatch) {
        // User already has access to the chat - update local user state with room's version
        setCurrentUser(memberMatch);
        saveCurrentUser(memberMatch);
        setView(AppState.CHAT);
      } else {
        // Logged in but needs to join the room with code
        setCurrentUser(savedUser);
        setView(AppState.JOIN);
      }
    }
  }, []);

  const handleAuth = (email: string, name: string) => {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    
    // Look for existing player record to preserve stats/role
    const existingPlayer = chatRoom.members.find(m => m.email.toLowerCase() === normalizedEmail);

    const playerProfile: User = existingPlayer ? { ...existingPlayer } : {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name: existingPlayer ? existingPlayer.name : (name || 'Player'),
      role: isAdmin ? 'admin' : 'member',
      joinedAt: Date.now()
    };

    setCurrentUser(playerProfile);
    saveCurrentUser(playerProfile);
    
    if (existingPlayer) {
      setView(AppState.CHAT);
    } else {
      setView(AppState.JOIN);
    }
  };

  const handleJoinChat = (code: string) => {
    if (code.toUpperCase() === chatRoom.code.toUpperCase()) {
      if (currentUser) {
        const isMember = chatRoom.members.some(m => m.email.toLowerCase() === currentUser.email.toLowerCase());
        
        if (!isMember) {
          setChatRoom(prev => ({
            ...prev,
            members: [...prev.members, currentUser],
            adminId: currentUser.role === 'admin' ? currentUser.id : prev.adminId
          }));
        }
        setView(AppState.CHAT);
      }
    } else {
      alert('Invalid Access Code. Please see the Coach for entry.');
    }
  };

  const sendMessage = useCallback((content: string, isSystem = false) => {
    if (!currentUser && !isSystem) return;
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: isSystem ? 'system' : currentUser!.id,
      senderName: isSystem ? 'Ballpark' : currentUser!.name,
      content,
      timestamp: Date.now(),
      readBy: isSystem ? [] : [currentUser!.id]
    };

    setChatRoom(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, [currentUser]);

  const submitGameScore = useCallback((record: GameRecord) => {
    setChatRoom(prev => {
      const updatedLeaderboard = [...prev.leaderboard, record].sort((a, b) => {
        if (record.type === 'reaction') return a.score - b.score;
        return b.score - a.score;
      }).slice(0, 10);

      return {
        ...prev,
        leaderboard: updatedLeaderboard
      };
    });
    
    const msg = record.type === 'reaction' 
      ? `⚡️ ${record.userName} just clocked a ${record.score}ms reaction!`
      : `⚾️ ${record.userName} blasted a ${record.score}ft shot!`;
    
    sendMessage(msg, true);
  }, [sendMessage]);

  const markMessagesRead = useCallback((userId: string) => {
    setChatRoom(prev => {
      let changed = false;
      const updatedMessages = prev.messages.map(msg => {
        if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
          changed = true;
          return { ...msg, readBy: [...(msg.readBy || []), userId] };
        }
        return msg;
      });

      if (!changed) return prev;
      return { ...prev, messages: updatedMessages };
    });
  }, []);

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin') return;
    setChatRoom(prev => ({ ...prev, name: newName }));
  };

  const adminUpdateRoomCode = (newCode: string) => {
    if (currentUser?.role !== 'admin') return;
    setChatRoom(prev => ({ ...prev, code: newCode.toUpperCase() }));
  };

  const adminRemoveMember = (userId: string) => {
    if (currentUser?.role !== 'admin') return;
    setChatRoom(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== userId)
    }));
  };

  const handleLogout = () => {
    clearAppData();
    setCurrentUser(null);
    setChatRoom(getChatData());
    setView(AppState.AUTH);
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
          onMarkRead={() => markMessagesRead(currentUser.id)}
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
