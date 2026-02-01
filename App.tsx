import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChatRoom, AppState } from './types';
import { ADMIN_EMAIL, INITIAL_CHAT_ROOM } from './constants';
import { getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';
import Gun from 'gun';

// Diversified peer network to ensure connection regardless of individual relay downtime
const peers = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://peer.wall.org/gun',
  'https://relay.peer.ooo/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gun-eu.herokuapp.com/gun',
  'https://dletta.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://mg-gun-manhattan.herokuapp.com/gun'
];

// Initialize Gun as a singleton with optimized browser settings
const gun = Gun({
  peers: peers,
  localStorage: true,
  radisk: false, // Prevents certain locking issues in mobile Safari/Chrome
  retry: 500 // Faster reconnection attempts
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatRoom, setChatRoom] = useState<ChatRoom>(INITIAL_CHAT_ROOM);
  const [view, setView] = useState<AppState>(AppState.AUTH);
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const roomNodeRef = useRef<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Monitor peer health and count
    const interval = setInterval(() => {
      const peerList = (gun as any)._?.opt?.peers || {};
      const activePeers = Object.values(peerList).filter((p: any) => p.wire && p.wire.readyState === 1);
      setPeerCount(activePeers.length);
      setIsConnected(activePeers.length > 0);
    }, 2000);

    return () => clearInterval(interval);
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

  const syncRoom = useCallback((code: string) => {
    if (!gun) return;
    
    // Clear previous room node listeners
    if (roomNodeRef.current) {
      roomNodeRef.current.off();
    }

    const cleanCode = code.toUpperCase().trim();
    // Unique key for the latest stable sync version
    const roomKey = `mlb_dugout_v10_final_${cleanCode}`;
    roomNodeRef.current = gun.get(roomKey);

    // Initial state cleanup
    setChatRoom(prev => ({ ...prev, code: cleanCode, messages: [], members: [] }));

    // Force-sync (Poke) nodes across the mesh network
    ['messages', 'members', 'leaderboard', 'metadata'].forEach(node => {
        roomNodeRef.current.get(node).once(() => {});
    });

    // Sub-listeners for real-time updates
    roomNodeRef.current.get('messages').map().on((msg: any, id: string) => {
      if (!msg) return;
      setChatRoom(prev => {
        if (prev.messages.some(m => m.id === id)) return prev;
        const newMessages = [...prev.messages, { ...msg, id }]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-150); // Increased buffer for better chat history
        return { ...prev, messages: newMessages };
      });
    });

    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      setChatRoom(prev => {
        if (!member) return { ...prev, members: prev.members.filter(m => m.id !== id) };
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    ['derby', 'heat', 'stealer'].forEach(game => {
      roomNodeRef.current.get('leaderboard').get(game).map().on((entry: any, id: string) => {
        if (!entry) return;
        setChatRoom(prev => {
          const currentList = [...prev.leaderboard[game as keyof typeof prev.leaderboard]];
          const existingIndex = currentList.findIndex(e => e.userId === entry.userId);
          
          if (existingIndex > -1) {
            const isBetter = game === 'heat' ? entry.score < currentList[existingIndex].score : entry.score > currentList[existingIndex].score;
            if (isBetter) currentList[existingIndex] = entry;
            else return prev;
          } else {
            currentList.push(entry);
          }

          const sorted = currentList.sort((a, b) => game === 'heat' ? a.score - b.score : b.score - a.score).slice(0, 10);
          return { ...prev, leaderboard: { ...prev.leaderboard, [game]: sorted } };
        });
      });
    });

    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (meta && meta.name) {
        setChatRoom(prev => ({ ...prev, name: meta.name }));
      }
    });
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
      // Announce presence in the room roster
      roomNodeRef.current.get('members').get(currentUser.id).put({
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        id: currentUser.id,
        lastSeen: Date.now()
      });
      setView(AppState.CHAT);
    }
  };

  const updateUserName = (newName: string) => {
    if (!currentUser || !roomNodeRef.current) return;
    const updatedUser = { ...currentUser, name: newName.trim() };
    setCurrentUser(updatedUser);
    saveCurrentUser(updatedUser);
    roomNodeRef.current.get('members').get(currentUser.id).put({ name: newName.trim() });
  };

  const saveScore = (game: 'derby' | 'heat' | 'stealer', score: number) => {
    if (!currentUser || !roomNodeRef.current) return;
    roomNodeRef.current.get('leaderboard').get(game).get(currentUser.id).put({
      userId: currentUser.id,
      userName: currentUser.name,
      score,
      timestamp: Date.now()
    });
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 md:p-6 overflow-hidden safe-pb">
      {view === AppState.CHAT && (
        <div className="fixed top-4 right-4 z-[150] flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-xl pointer-events-none transition-all duration-300">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isConnected ? `Live (${peerCount})` : 'Mesh Syncing...'}
          </span>
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