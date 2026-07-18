import { useState, useEffect, useMemo } from 'react';
import type { Conversation, User } from '@/types';
import { fetchConversations } from '@/lib/api/conversations';

export function useConversations(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchConversations()
        .then(setConversations)
        .catch(err => console.error('Failed to fetch conversations', err));
    }
  }, [currentUser]);

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    const otherMember = conv.members.find(m => m.user.id !== currentUser?.id);
    return otherMember?.user.display_name || otherMember?.user.username || otherMember?.user.phone || 'Unknown User';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name ? conv.name[0].toUpperCase() : 'G';
    const otherMember = conv.members.find(m => m.user.id !== currentUser?.id);
    const name = otherMember?.user.display_name || otherMember?.user.username || 'U';
    return name[0].toUpperCase();
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => 
      getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery, currentUser]);

  const updateConversationLastMessage = (conversationId: number, lastMessage: any) => {
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId 
          ? { ...c, last_message: lastMessage }
          : c
      )
    );
  };

  return {
    conversations,
    filteredConversations,
    searchQuery,
    setSearchQuery,
    getConversationName,
    getConversationAvatar,
    updateConversationLastMessage,
  };
}
