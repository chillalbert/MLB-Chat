
import { User } from '../types';

const USER_SESSION_KEY = 'sports_square_active_session_v2';

export const saveCurrentUser = (user: User) => {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user session', e);
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
  localStorage.removeItem(USER_SESSION_KEY);
};
