
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Persistence listener for chatRoom changes
  useEffect(() => {
    saveChatData(chatRoom);
  }, [chatRoom]);

  // Initial Load & Session Recovery
  useEffect(() => {
    const savedUser = getCurrentUser();
    const room = getChatData();
    setChatRoom(room);

    if (savedUser) {
      const normalizedEmail = savedUser.email.toLowerCase();
      // Important: Prioritize the data from the room's member list (source of truth)
      const memberInRoom = room.members.find(m => m.email.toLowerCase() === normalizedEmail);
      
      if (memberInRoom) {
        setCurrentUser(memberInRoom);
        setView(AppState.CHAT);
      } else {
        // User is logged in globally but not a member of this room yet
        setCurrentUser(savedUser);
        setView(AppState.JOIN);
      }
    }
  }, []);

  const handleAuth = (email: string, name: string) => {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    
    // Check existing members list for this email
    const existingMember = chatRoom.members.find(m => m.email.toLowerCase() === normalizedEmail);

    const user: User = existingMember ? { ...existingMember } : {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name: existingMember ? existingMember.name : (name || 'Rookie'),
      role: isAdmin ? 'admin' : 'member',
      joinedAt: Date.now()
    };

    setCurrentUser(user);
    saveCurrentUser(user);
    
    if (existingMember) {
      setView(AppState.CHAT);
    } else {
      setView(AppState.JOIN);
    }
  };

  const handleJoinChat = (code: string) => {
    if (code.toUpperCase() === chatRoom.code.toUpperCase()) {
      if (currentUser) {
        setChatRoom(prev => {
          const alreadyMember = prev.members.some(m => m.email.toLowerCase() === currentUser.email.toLowerCase());
          if (alreadyMember) return prev;

          const updatedMembers = [...prev.members, currentUser];
          return {
            ...prev,
            members: updatedMembers,
            adminId: currentUser.role === 'admin' ? currentUser.id : prev.adminId
          };
        });
        setView(AppState.CHAT);
      }
    } else {
      alert('Invalid dugout access code. Please check with your Coach.');
    }
  };

  const sendMessage = useCallback((content: string, isSystem = false) => {
    if (!currentUser && !isSystem) return;
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: isSystem ? 'system' : currentUser!.id,
      senderName: isSystem ? 'Ballpark Announcer' : currentUser!.name,
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
      ? `⚡️ NEW HEAT RECORD: ${record.userName} clocked a ${record.score}ms reaction!`
      : `🚨 STATCAST: ${record.userName} just blasted a ${record.score}ft moonshot!`;
    
    sendMessage(msg, true);
  }, [sendMessage]);

  const markMessagesRead = useCallback((userId: string) => {
    setChatRoom(prev => {
      let hasChanges = false;
      const updatedMessages = prev.messages.map(msg => {
        if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
          hasChanges = true;
          return { ...msg, readBy: [...(msg.readBy || []), userId] };
        }
        return msg;
      });

      if (!hasChanges) return prev;
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
