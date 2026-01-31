
import { STORAGE_KEY, INITIAL_CHAT_ROOM } from '../constants';
import { ChatRoom, User } from '../types';

export const saveChatData = (room: ChatRoom) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
};

export const getChatData = (): ChatRoom => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return INITIAL_CHAT_ROOM;
  return JSON.parse(data);
};

export const clearAppData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('current_user');
};

export const saveCurrentUser = (user: User) => {
  localStorage.setItem('current_user', JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem('current_user');
  return data ? JSON.parse(data) : null;
};
