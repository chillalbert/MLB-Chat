
export const ADMIN_EMAIL = 'sportssquareauthor@gmail.com';
export const DEFAULT_CHAT_CODE = 'SQUARE1';
export const STORAGE_KEY = 'sports_square_app_data';

export const INITIAL_CHAT_ROOM = {
  id: 'room-1',
  name: 'MLB Chat',
  code: DEFAULT_CHAT_CODE,
  adminId: '',
  members: [],
  messages: [
    {
      id: 'msg-1',
      senderId: 'system',
      senderName: 'System',
      content: 'Welcome to the MLB Chat Dugout! Please maintain professional sportsmanship.',
      timestamp: Date.now()
    }
  ],
  leaderboard: []
};
