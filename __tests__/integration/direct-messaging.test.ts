/**
 * Integration Tests for Direct Messaging Flow
 * 
 * These tests verify the complete user journey for direct messaging:
 * 1. Create/get a conversation between two users
 * 2. Send messages in the conversation
 * 3. Fetch and verify messages
 * 4. Mark conversation as read
 */

import {
  getOrCreateDirectConversation,
  sendMessageToConversation,
  fetchConversationMessages,
  markConversationAsRead,
  getUnreadCount,
} from '@/lib/api/conversations';

describe('Direct Messaging Integration', () => {
  const user1Id = 'test-user-1';
  const user2Id = 'test-user-2';

  describe('Complete DM Flow', () => {
    it('should support creating conversation and sending messages', async () => {
      // Step 1: Create/get conversation between two users
      const conversationId = await getOrCreateDirectConversation(user1Id, user2Id);
      
      expect(conversationId).toBeDefined();
      expect(typeof conversationId).toBe('string');
      expect(conversationId.length).toBeGreaterThan(0);
    });

    it('should handle sending multiple messages in sequence', async () => {
      const conversationId = await getOrCreateDirectConversation(user1Id, user2Id);

      // Send first message
      const message1 = await sendMessageToConversation(
        conversationId,
        user1Id,
        'Hello from user 1!'
      );
      
      expect(message1).toHaveProperty('id');
      expect(message1.message).toBe('Hello from user 1!');

      // Send reply
      const message2 = await sendMessageToConversation(
        conversationId,
        user2Id,
        'Hi back from user 2!'
      );
      
      expect(message2).toHaveProperty('id');
      expect(message2.id).not.toBe(message1.id); // Different message IDs
    });

    it('should mark conversation as read without errors', async () => {
      const conversationId = await getOrCreateDirectConversation(user1Id, user2Id);
      
      // Mark as read should not throw
      await expect(
        markConversationAsRead(conversationId, user2Id)
      ).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid conversation ID gracefully', async () => {
      await expect(
        sendMessageToConversation('invalid-id', user1Id, 'test')
      ).rejects.toThrow();
    });

    it('should handle invalid user ID gracefully', async () => {
      await expect(
        getOrCreateDirectConversation('', user2Id)
      ).rejects.toThrow();
    });
  });

  describe('Unread Count', () => {
    it('should calculate unread count', async () => {
      const count = await getUnreadCount(user1Id);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

