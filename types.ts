
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

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: User[];
  messages: Message[];
}

export enum AppState {
  AUTH = 'AUTH',
  JOIN = 'JOIN',
  CHAT = 'CHAT'
}
