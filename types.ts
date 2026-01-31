
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: User[];
  messages: Message[];
  leaderboard: {
    derby: LeaderboardEntry[];
    heat: LeaderboardEntry[];
    stealer: LeaderboardEntry[];
  };
}

export enum AppState {
  AUTH = 'AUTH',
  JOIN = 'JOIN',
  CHAT = 'CHAT'
}
