
import React, { useState, useEffect } from 'react';
import { User, ChatRoom, AppState, Message } from './types';
import { ADMIN_EMAIL } from './constants';
import { getChatData, saveChatData, getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom>(getChatData());
  const [view, setView] = useState<AppState>(AppState.AUTH);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      const room = getChatData();
      const isMember = room.members.find(m => m.email === savedUser.email);
      if (isMember) {
        setView(AppState.CHAT);
      } else {
        setView(AppState.JOIN);
      }
    }
  }, []);

  const handleAuth = (email: string, name: string) => {
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const existingRoom = getChatData();
    const existingMember = existingRoom.members.find(m => m.email.toLowerCase() === email.toLowerCase());

    const user: User = existingMember || {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
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
        const updatedRoom = { ...chatRoom };
        const isAlreadyMember = updatedRoom.members.some(m => m.email === currentUser.email);
        
        if (!isAlreadyMember) {
          updatedRoom.members.push(currentUser);
          if (currentUser.role === 'admin') {
            updatedRoom.adminId = currentUser.id;
          }
        }
        
        setChatRoom(updatedRoom);
        saveChatData(updatedRoom);
        setView(AppState.CHAT);
      }
    } else {
      alert('Invalid room code. Please check with the admin.');
    }
  };

  const sendMessage = (content: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now()
    };
    const updatedRoom = {
      ...chatRoom,
      messages: [...chatRoom.messages, newMessage]
    };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const adminUpdateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin') return;
    const updatedRoom = { ...chatRoom, name: newName };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const adminUpdateRoomCode = (newCode: string) => {
    if (currentUser?.role !== 'admin') return;
    const updatedRoom = { ...chatRoom, code: newCode.toUpperCase() };
    setChatRoom(updatedRoom);
    saveChatData(updatedRoom);
  };

  const adminRemoveMember = (userId: string) => {
    if (currentUser?.role !== 'admin') return;
    if (userId === currentUser.id) return; 

    const updatedMembers = chatRoom.members.filter(m => m.id !== userId);
    const updatedRoom = { ...chatRoom, members: updatedMembers };
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
          onSendMessage={sendMessage}
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
