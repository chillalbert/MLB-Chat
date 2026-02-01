import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChatRoom, AppState } from './types';
import { ADMIN_EMAIL, INITIAL_CHAT_ROOM } from './constants';
import { getCurrentUser, saveCurrentUser, clearAppData } from './services/storage';
import AuthForm from './components/AuthForm';
import JoinForm from './components/JoinForm';
import ChatRoomComponent from './components/ChatRoom';
import Gun from 'gun';

// Simplified stable peer list - removed failing heroku nodes
const peers = [
  'https://relay.peer.ooo/gun',
  'https://peer.wall.org/gun',
  'https://gun-us.herokuapp.com/gun'
];

// Initialize Gun once at the top level
const gun = Gun({
  peers: peers,
  localStorage: true,
  radisk: false,
  axe: false,
  retry: 3000
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

    const interval = setInterval(() => {
      const peerList = (gun as any)._?.opt?.peers || {};
      const activePeers = Object.values(peerList).filter((p: any) => p.wire && p.wire.readyState === 1);
      setPeerCount(activePeers.length);
      setIsConnected(activePeers.length > 0);
    }, 3000);

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
    
    if (roomNodeRef.current) {
      roomNodeRef.current.off();
    }

    const cleanCode = code.toUpperCase().trim();
    
    /**
     * CRITICAL: Using a fixed production-ready key to avoid room fragmentation.
     * If two users have different versions of this string, they will NEVER see each other.
     */
    const roomKey = `mlb_chat_prod_v50_${cleanCode}`;
    roomNodeRef.current = gun.get(roomKey);

    setChatRoom(prev => ({ ...prev, code: cleanCode, messages: [], members: [] }));

    // Force network fetch for each sub-node
    ['messages', 'members', 'metadata', 'leaderboard'].forEach(node => {
      roomNodeRef.current.get(node).once(() => {
        console.debug(`Synced node: ${node}`);
      });
    });

    // Real-time Message Sync
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

    // Real-time Member Roster Sync
    roomNodeRef.current.get('members').map().on((member: any, id: string) => {
      setChatRoom(prev => {
        if (!member) return { ...prev, members: prev.members.filter(m => m.id !== id) };
        const others = prev.members.filter(m => m.id !== id);
        return { ...prev, members: [...others, { ...member, id }] };
      });
    });

    // Real-time Metadata Sync
    roomNodeRef.current.get('metadata').on((meta: any) => {
      if (meta && meta.name) {
        setChatRoom(prev => ({ ...prev, name: meta.name }));
      }
    });

    // Leaderboard Sync logic
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
      
      // Upsert presence in the mesh
      roomNodeRef.current.get('members').get(currentUser.id).put({
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
        <div className="fixed top-4 right-4 z-[150] flex flex-col items-end space-y-2 pointer-events-none">
          <div className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 shadow-xl">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {isConnected ? `MESH LIVE (${peerCount})` : 'MESH SEARCHING...'}
            </span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-800/50">
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">NODE: 5.0-{chatRoom.code}</span>
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