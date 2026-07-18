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
    const otherMember = conv.members.find(m => m.user && m.user.id !== currentUser?.id);
    return otherMember?.user?.display_name || otherMember?.user?.username || otherMember?.user?.phone || 'Unknown User';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name ? conv.name[0].toUpperCase() : 'G';
    const otherMember = conv.members.find(m => m.user && m.user.id !== currentUser?.id);
    const name = otherMember?.user?.display_name || otherMember?.user?.username || 'U';
    return name[0].toUpperCase();
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => 
      getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery, currentUser]);

  const updateConversationLastMessage = (conversationId: number, lastMessage: any, incrementUnread: boolean = false) => {
    const exists = conversations.some(c => c.id === conversationId);
    if (!exists) {
      fetchConversations()
        .then(setConversations)
        .catch(err => console.error('Failed to refetch conversations for new message', err));
      return;
    }

    setConversations(prev => {
      const next = prev.map(c => 
        c.id === conversationId 
          ? { 
              ...c, 
              last_message: lastMessage,
              unread_count: incrementUnread ? (c.unread_count || 0) + 1 : c.unread_count
            }
          : c
      );
      return next.sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
        return bTime - aTime;
      });
    });
  };

  const markConversationAsRead = (conversationId: number) => {
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId 
          ? { ...c, unread_count: 0 }
          : c
      )
    );
  };

  const handleCreateGroup = async (name: string, userIds: number[]) => {
    const { createGroup } = await import('@/lib/api/conversations');
    const newGroup = await createGroup(name, userIds);
    setConversations(prev => [newGroup, ...prev]);
    return newGroup;
  };

  const handleCreateDirectConversation = async (userId: number) => {
    const { createDirectConversation } = await import('@/lib/api/conversations');
    const newConv = await createDirectConversation(userId);
    setConversations(prev => [newConv, ...prev]);
    return newConv;
  };


  const handleAddMember = async (conversationId: number, userId: number) => {
    const { addMember } = await import('@/lib/api/conversations');
    const newMember = await addMember(conversationId, userId);
    setConversations(prev => 
      prev.map(c => {
        if (c.id === conversationId) {
          return { ...c, members: [...c.members, newMember] };
        }
        return c;
      })
    );
    return newMember;
  };

  const handleRemoveMember = async (conversationId: number, userId: number) => {
    const { removeMember } = await import('@/lib/api/conversations');
    await removeMember(conversationId, userId);
    setConversations(prev => 
      prev.map(c => {
        if (c.id === conversationId) {
          return { ...c, members: c.members.filter(m => m.user?.id !== userId) };
        }
        return c;
      })
    );
  };

  const removeConversation = (conversationId: number) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
  };

  return {
    conversations,
    filteredConversations,
    searchQuery,
    setSearchQuery,
    getConversationName,
    getConversationAvatar,
    updateConversationLastMessage,
    markConversationAsRead,
    handleCreateGroup,
    handleCreateDirectConversation,
    handleAddMember,
    handleRemoveMember,
    removeConversation,
  };
}
