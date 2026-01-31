
import { STORAGE_KEY, INITIAL_CHAT_ROOM } from '../constants';
import { ChatRoom, User } from '../types';

const USER_SESSION_KEY = 'sports_square_active_session';

export const saveChatData = (room: ChatRoom) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
  } catch (e) {
    console.error('Persistence Error: Failed to save chat data', e);
  }
};

export const getChatData = (): ChatRoom => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_CHAT_ROOM;
    
    const parsed = JSON.parse(data);
    
    // Merge with INITIAL_CHAT_ROOM to ensure no missing properties cause crashes
    return {
      ...INITIAL_CHAT_ROOM,
      ...parsed,
      members: Array.isArray(parsed.members) ? parsed.members : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : []
    };
  } catch (e) {
    console.warn('Storage Warning: Resetting room data due to corruption');
    return INITIAL_CHAT_ROOM;
  }
};

export const saveCurrentUser = (user: User) => {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Persistence Error: Failed to save user session', e);
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(USER_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearAppData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
};
