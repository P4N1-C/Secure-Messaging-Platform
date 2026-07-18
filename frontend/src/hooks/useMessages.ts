import { useState, useEffect } from 'react';
import type { Message, Conversation, User } from '@/types';
import { fetchMessages, sendMessage as apiSendMessage } from '@/lib/api/messages';

export function useMessages(
  selectedConversation: Conversation | null,
  currentUser: User | null,
  updateConversationLastMessage: (conversationId: number, lastMessage: Message) => void
) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
        .then(setMessages)
        .catch(err => console.error('Failed to fetch messages', err));
    }
  }, [selectedConversation]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || !currentUser) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const savedMessage = await apiSendMessage(selectedConversation.id, content);
      
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? savedMessage : msg)
      );
      
      updateConversationLastMessage(selectedConversation.id, savedMessage);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? { ...msg, isFailed: true } : msg)
      );
    }
  };

  return {
    messages,
    sendMessage,
  };
}
