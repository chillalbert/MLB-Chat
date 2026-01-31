
import { STORAGE_KEY, INITIAL_CHAT_ROOM } from '../constants';
import { ChatRoom, User } from '../types';

export const saveChatData = (room: ChatRoom) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
  } catch (e) {
    console.error('Failed to save chat data', e);
  }
};

export const getChatData = (): ChatRoom => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_CHAT_ROOM;
    
    const parsed = JSON.parse(data);
    
    // Merge with INITIAL_CHAT_ROOM to ensure all fields exist
    return {
      ...INITIAL_CHAT_ROOM,
      ...parsed,
      id: parsed.id || INITIAL_CHAT_ROOM.id,
      name: parsed.name || INITIAL_CHAT_ROOM.name,
      code: parsed.code || INITIAL_CHAT_ROOM.code,
      members: Array.isArray(parsed.members) ? parsed.members : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : []
    };
  } catch (e) {
    console.error('Failed to load chat data, resetting to default', e);
    return INITIAL_CHAT_ROOM;
  }
};

export const saveCurrentUser = (user: User) => {
  try {
    localStorage.setItem('sports_square_auth_user', JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user session', e);
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem('sports_square_auth_user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearAppData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('sports_square_auth_user');
};
