
export const ADMIN_EMAIL = 'sportssquareauthor@gmail.com';
export const DEFAULT_CHAT_CODE = 'JOIN';
export const STORAGE_KEY = 'ss_app_storage_v3';

export const INITIAL_CHAT_ROOM = {
  id: 'room-1',
  name: 'Community Chat',
  code: DEFAULT_CHAT_CODE,
  adminId: '',
  members: [],
  messages: [],
  leaderboard: {
    derby: [],
    heat: [],
    stealer: []
  }
};
