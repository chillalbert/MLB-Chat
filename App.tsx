import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChatRoom, AppState, Message, LeaderboardEntry } from './types';
import { ADMIN_EMAIL, INITIAL_CHAT_ROOM } from './constants';
import { getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, onChildAdded, off, remove, query, limitToLast, orderByChild } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAxFzCWywLPK0BWuUk8yhmONhfoo_FYuGk",
  authDomain: "mailbagchatsportssquare.firebaseapp.com",
  projectId: "mailbagchatsportssquare",
  databaseURL: "https://mailbagchatsportssquare-default-rtdb.firebaseio.com",
  storageBucket: "mailbagchatsportssquare.firebasestorage.app",
  messagingSenderId: "621911267037",
  appId: "1:621911267037:web:3c66a200cbcd9765542d34",
  measurementId: "G-868BEL032N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom>(INITIAL_CHAT_ROOM);
  const [view, setView] = useState<AppState>(AppState.AUTH);
  const [isConnected, setIsConnected] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const lastSentTime = useRef<number>(0);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Monitor Firebase connection state
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      const val = snap.val();
      setIsConnected(val === true);
    });

    return () => {
      unsubscribe();
      listenersRef.current.forEach(offFn => offFn());
    };
  }, []);

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

  const clearListeners = () => {
    listenersRef.current.forEach(offFn => offFn());
    listenersRef.current = [];
  };

  const syncRoom = useCallback((code: string) => {
    clearListeners();
    const cleanCode = code.toUpperCase().trim();
    
    setChatRoom(prev => ({ ...prev, code: cleanCode, messages: [], members: [] }));

    const messagesRef = query(ref(db, `rooms/${cleanCode}/messages`), limitToLast(100));
    const membersRef = ref(db, `rooms/${cleanCode}/members`);
    const metaRef = ref(db, `rooms/${cleanCode}/metadata`);
    const leaderboardRef = ref(db, `rooms/${cleanCode}/leaderboard`);

    // Sync Messages
    const msgRef = ref(db, `rooms/${cleanCode}/messages`);
    onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        })).sort((a, b) => a.timestamp - b.timestamp);
        setChatRoom(prev => ({ ...prev, messages: messageList }));
      }
    });
    
    // Sync Roster
    onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const memberList = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        }));
        setChatRoom(prev => ({ ...prev, members: memberList }));
      } else {
        setChatRoom(prev => ({ ...prev, members: [] }));
      }
    });

    // Sync Metadata (Room Name)
    onValue(metaRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.name) {
        setChatRoom(prev => ({ ...prev, name: data.name }));
      }
    });

    // Sync Leaderboards
    onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val() || {};
      setChatRoom(prev => {
        const newLB = { ...prev.leaderboard };
        ['derby', 'heat', 'stealer'].forEach(game => {
          if (data[game]) {
            newLB[game as keyof typeof newLB] = Object.values(data[game])
              .sort((a: any, b: any) => game === 'heat' ? a.score - b.score : b.score - a.score)
              .slice(0, 10) as LeaderboardEntry[];
          }
        });
        return { ...prev, leaderboard: newLB };
      });
    });

    // Store unsubs for cleanup
    listenersRef.current = [
      () => off(msgRef),
      () => off(membersRef),
      () => off(metaRef),
      () => off(leaderboardRef)
    ];
  }, []);

  const handleAuth = (email: string, name: string) => {
    const emailClean = email.toLowerCase().trim();
    const isAdmin = emailClean === ADMIN_EMAIL.toLowerCase().trim();
    const userId = `u_${btoa(emailClean).replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`;
    
    const profile: User = {
      id: userId,
      email: emailClean,
      name: name || (isAdmin ? 'Admin' : 'Player'),
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
      
      // Add to roster
      set(ref(db, `rooms/${cleanCode}/members/${currentUser.id}`), {
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        id: currentUser.id,
        online: true,
        lastSeen: Date.now()
      });
      
      setView(AppState.CHAT);
    }
  };

  const updateUserName = (newName: string) => {
    if (!currentUser || !chatRoom.code) return;
    const updatedUser = { ...currentUser, name: newName.trim() };
    setCurrentUser(updatedUser);
    saveCurrentUser(updatedUser);
    set(ref(db, `rooms/${chatRoom.code}/members/${currentUser.id}/name`), newName.trim());
  };

  const saveScore = (game: 'derby' | 'heat' | 'stealer', score: number) => {
    if (!currentUser || !chatRoom.code) return;
    set(ref(db, `rooms/${chatRoom.code}/leaderboard/${game}/${currentUser.id}`), {
      userId: currentUser.id,
      userName: currentUser.name,
      score,
      timestamp: Date.now()
    });
  };

  const sendMessage = useCallback((content: string) => {
    if (!currentUser || !chatRoom.code) return;
    
    const now = Date.now();
    if (now - lastSentTime.current < 400) return; 
    lastSentTime.current = now;

    const messagesRef = ref(db, `rooms/${chatRoom.code}/messages`);
    push(messagesRef, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: content.trim().slice(0, 1000),
      timestamp: now
    });
  }, [currentUser, chatRoom.code]);

  const updateRoomName = (newName: string) => {
    if (currentUser?.role !== 'admin' || !chatRoom.code) return;
    set(ref(db, `rooms/${chatRoom.code}/metadata/name`), newName);
  };

  const removeMember = (userId: string) => {
    if (currentUser?.role !== 'admin' || !chatRoom.code) return;
    remove(ref(db, `rooms/${chatRoom.code}/members/${userId}`));
  };

  const handleLogout = () => {
    if (currentUser && chatRoom.code) {
      remove(ref(db, `rooms/${chatRoom.code}/members/${currentUser.id}`));
    }
    clearAppData();
    setCurrentUser(null);
    setChatRoom(INITIAL_CHAT_ROOM);
    setView(AppState.AUTH);
    clearListeners();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 md:p-6 overflow-hidden safe-pb">
      {view === AppState.CHAT && (
        <div className="fixed top-4 right-4 z-[150] flex flex-col items-end space-y-2 pointer-events-none transition-all duration-300">
          <div className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-2xl">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-rose-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {isConnected ? 'FIREBASE LIVE' : 'CONNECTING...'}
            </span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-800/50">
             <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">CLOUD-SYNC: {chatRoom.code}</span>
          </div>
        </div>
      )}

      {view === AppState.AUTH && <AuthForm onAuth={handleAuth} />}
      {view === AppState.JOIN && currentUser && <JoinForm userName={currentUser.name} onJoin={handleJoinChat} onLogout={handleLogout} />}
      {view === AppState.CHAT && currentUser && (
        <ChatRoomComponent
          user={currentUser}
          room={chatRoom}
          onSendMessage={sendMessage}
          onUpdateRoomName={updateRoomName}
          onUpdateUserName={updateUserName}
          onSaveScore={saveScore}
          onRemoveMember={removeMember}
          onLogout={handleLogout}
          installPrompt={deferredPrompt ? () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choice: any) => {
               if (choice.outcome === 'accepted') setDeferredPrompt(null);
            });
          } : undefined}
        />
      )}
    </div>
  );
};

export default App;