
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

  // Core Session Recovery
  useEffect(() => {
    const savedUser = getCurrentUser();
    const room = getChatData();
    setChatRoom(room);

    if (savedUser) {
      // Check if user is a valid member of the dugout
      const memberInRoom = room.members.find(m => m.email.toLowerCase() === savedUser.email.toLowerCase());
      
      if (memberInRoom) {
        // User is a member, skip auth and join screens
        setCurrentUser(memberInRoom);
        setView(AppState.CHAT);
      } else {
        // User has an account but hasn't joined this room yet
        setCurrentUser(savedUser);
        setView(AppState.JOIN);
      }
    }
  }, []);

  const handleAuth = (email: string, name: string) => {
    const room = getChatData();
    const normalizedEmail = email.toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    
    // Check if this person is already in the global members list
    const existingMember = room.members.find(m => m.email.toLowerCase() === normalizedEmail);

    // If logging in, we take the name from the existing member record
    // If signing up, we use the provided name
    const finalName = existingMember ? existingMember.name : name;

    const user: User = existingMember ? { ...existingMember, name: finalName } : {
      id: Math.random().toString(36).substr(2, 9),
      email: normalizedEmail,
      name: finalName || 'Rookie',
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
    const room = getChatData();
    if (code.toUpperCase() === room.code.toUpperCase()) {
      if (currentUser) {
        const updatedRoom = { ...room };
        const memberIndex = updatedRoom.members.findIndex(m => m.email.toLowerCase() === currentUser.email.toLowerCase());
        
        if (memberIndex === -1) {
          updatedRoom.members.push(currentUser);
          if (currentUser.role === 'admin') {
            updatedRoom.adminId = currentUser.id;
          }
        } else {
          // Refresh member data
          updatedRoom.members[memberIndex] = currentUser;
        }
        
        setChatRoom(updatedRoom);
        saveChatData(updatedRoom);
        setView(AppState.CHAT);
      }
    } else {
      alert('Invalid dugout access code.');
    }
  };

  const sendMessage = (content: string, isSystem = false) => {
    if (!currentUser && !isSystem) return;
    
    // Always get fresh data from state/storage to prevent overwriting
    const room = getChatData();
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: isSystem ? 'system' : currentUser!.id,
      senderName: isSystem ? 'Ballpark Announcer' : currentUser!.name,
      content,
      timestamp: Date.now(),
      readBy: isSystem ? [] : [currentUser!.id]
    };

    const updatedRoom = {
      ...room,
      messages: [...room.messages, newMessage]
    };

    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const submitGameScore = (record: GameRecord) => {
    const room = getChatData();
    const updatedLeaderboard = [...room.leaderboard, record].sort((a, b) => {
      if (record.type === 'reaction') return a.score - b.score; // Lower is better for reaction
      return b.score - a.score; // Higher is better for home runs
    }).slice(0, 10);

    const updatedRoom = {
      ...room,
      leaderboard: updatedLeaderboard
    };

    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
    
    const msg = record.type === 'reaction' 
      ? `⚡️ NEW HEAT RECORD: ${record.userName} clocked a ${record.score}ms reaction!`
      : `🚨 STATCAST: ${record.userName} just blasted a ${record.score}ft moonshot!`;
    
    sendMessage(msg, true);
  };

  const markMessagesRead = useCallback((userId: string) => {
    const room = getChatData();
    let hasChanges = false;
    const updatedMessages = room.messages.map(msg => {
      if (msg.senderId !== userId && (!msg.readBy || !msg.readBy.includes(userId))) {
        hasChanges = true;
        return { ...msg, readBy: [...(msg.readBy || []), userId] };
      }
      return msg;
    });

    if (hasChanges) {
      const updatedRoom = { ...room, messages: updatedMessages };
      setChatRoom(updatedRoom);
      saveChatData(updatedRoom);
    }
  }, []);

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin') return;
    const room = getChatData();
    const updatedRoom = { ...room, name: newName };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const adminUpdateRoomCode = (newCode: string) => {
    if (currentUser?.role !== 'admin') return;
    const room = getChatData();
    const updatedRoom = { ...room, code: newCode.toUpperCase() };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const adminRemoveMember = (userId: string) => {
    if (currentUser?.role !== 'admin') return;
    const room = getChatData();
    const updatedMembers = room.members.filter(m => m.id !== userId);
    const updatedRoom = { ...room, members: updatedMembers };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
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
