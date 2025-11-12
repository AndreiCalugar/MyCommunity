import { 
  getOrCreateDirectConversation, 
  sendMessageToConversation,
  markConversationAsRead,
  getUnreadCount,
} from '../conversations';
import { supabase } from '../../supabase';

// Mock supabase
jest.mock('../../supabase');

describe('Conversations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateDirectConversation', () => {
    it('should call RPC function with correct user IDs', async () => {
      const mockConversationId = 'conv-123';
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockConversationId,
        error: null,
      });

      const result = await getOrCreateDirectConversation('user-1', 'user-2');

      expect(supabase.rpc).toHaveBeenCalledWith('get_or_create_direct_conversation', {
        user1_id: 'user-1',
        user2_id: 'user-2',
      });
      expect(result).toBe(mockConversationId);
    });

    it('should throw error if RPC fails', async () => {
      const mockError = new Error('RPC failed');
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        getOrCreateDirectConversation('user-1', 'user-2')
      ).rejects.toThrow();
    });

    it('should handle empty user IDs', async () => {
      await expect(
        getOrCreateDirectConversation('', '')
      ).rejects.toThrow();
    });
  });

  describe('sendMessageToConversation', () => {
    it('should insert message with correct data structure', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        user_id: 'user-1',
        message: 'Hello!',
        created_at: new Date().toISOString(),
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockMessage,
        error: null,
      });

      const mockFrom = jest.fn(() => ({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }));

      (supabase.from as jest.Mock) = mockFrom;

      const result = await sendMessageToConversation('conv-1', 'user-1', 'Hello!');

      expect(mockInsert).toHaveBeenCalledWith({
        conversation_id: 'conv-1',
        user_id: 'user-1',
        message: 'Hello!',
        community_id: null, // DMs have null community_id
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('message', 'Hello!');
    });

    it('should handle empty message text', async () => {
      await expect(
        sendMessageToConversation('conv-1', 'user-1', '')
      ).resolves.toBeDefined();
    });

    it('should throw error if insert fails', async () => {
      const mockError = new Error('Insert failed');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      await expect(
        sendMessageToConversation('conv-1', 'user-1', 'Hello')
      ).rejects.toThrow();
    });
  });

  describe('markConversationAsRead', () => {
    it('should update last_read_at timestamp for user', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      });

      await markConversationAsRead('conv-1', 'user-1');

      expect(supabase.from).toHaveBeenCalledWith('conversation_participants');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('conversation_id', 'conv-1');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should not throw error if conversation not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      });

      await expect(
        markConversationAsRead('non-existent', 'user-1')
      ).resolves.not.toThrow();
    });
  });

  describe('getUnreadCount', () => {
    it('should return 0 for user with no conversations', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const count = await getUnreadCount('user-1');
      expect(count).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('DB error'),
        }),
      });

      const count = await getUnreadCount('user-1');
      expect(count).toBe(0); // Should return 0 on error
    });
  });
});

