
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
  readBy?: string[]; // Array of user IDs who have seen the message
}

export interface GameRecord {
  userName: string;
  score: number;
  type: 'homerun' | 'reaction';
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: User[];
  messages: Message[];
  leaderboard: GameRecord[];
}

export enum AppState {
  AUTH = 'AUTH',
  JOIN = 'JOIN',
  CHAT = 'CHAT'
}
