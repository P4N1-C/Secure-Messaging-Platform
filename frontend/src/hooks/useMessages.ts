import { useState, useEffect, useCallback } from 'react';
import type { Message, Conversation, User } from '@/types';
import { fetchMessages, sendMessage as apiSendMessage } from '@/lib/api/messages';

export function useMessages(
  selectedConversation: Conversation | null,
  currentUser: User | null,
  updateConversationLastMessage: (conversationId: number, lastMessage: Message) => void,
  wsSendMessage?: (conversationId: number, content: string) => boolean,
  onMessageFailed?: () => void
) {
  const [messages, setMessages] = useState<Message[]>([]);

  const selectedConversationId = selectedConversation?.id;
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
        .then(setMessages)
        .catch(err => console.error('Failed to fetch messages', err));
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || !currentUser) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
      status: 'sent',
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Try WS first
    if (wsSendMessage && wsSendMessage(selectedConversation.id, content)) {
       // Wait for reconciliation from WS echo
       return;
    }
    
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
      if (onMessageFailed) onMessageFailed();
    }
  };

  const handleIncomingMessage = useCallback((newMsg: Message) => {
    setMessages(prev => {
      if (newMsg.sender_id === currentUser?.id) {
         // Reconcile optimistic message
         const tempMsgIndex = prev.findIndex(m => typeof m.id === 'string' && m.id.startsWith('temp-') && m.content === newMsg.content);
         if (tempMsgIndex !== -1) {
           const next = [...prev];
           next[tempMsgIndex] = { ...newMsg, status: next[tempMsgIndex].status || 'sent' };
           return next;
         }
      }
      
      // Prevent duplicates if already exists
      if (prev.some(m => m.id === newMsg.id)) {
         return prev;
      }
      
      return [...prev, newMsg];
    });
  }, [currentUser]);

  const updateMessageStatus = useCallback((messageId: number, status: 'sent' | 'delivered' | 'read') => {
    setMessages(prev => 
       prev.map(msg => msg.id === messageId ? { ...msg, status } : msg)
    );
  }, []);

  return {
    messages,
    sendMessage,
    handleIncomingMessage,
    updateMessageStatus,
  };
}
