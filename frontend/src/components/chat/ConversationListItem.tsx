import React from 'react';
import type { Conversation, User } from '@/types';

interface ConversationListItemProps {
  conversation: Conversation;
  currentUser: User | null;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: (conv: Conversation) => void;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
}

export function ConversationListItem({
  conversation,
  currentUser,
  isSelected,
  isCollapsed,
  onSelect,
  getConversationName,
  getConversationAvatar
}: ConversationListItemProps) {
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const name = getConversationName(conversation);
  const avatar = getConversationAvatar(conversation);
  const { unread_count, last_message } = conversation;

  return (
    <div 
      onClick={() => onSelect(conversation)} 
      className={`flex items-center cursor-pointer ${
        isCollapsed 
          ? `p-2 mx-auto w-[60px] h-[60px] justify-center rounded-2xl mb-2 transition-colors ${isSelected ? 'bg-gray-200 dark:bg-[#2d2d2d]' : 'hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}` 
          : `p-3 mx-2 rounded-lg mb-1 transition-colors ${isSelected ? 'bg-gray-200 dark:bg-[#2d2d2d]' : 'hover:bg-gray-200 dark:hover:bg-[#2d2d2d]'}`
      }`}
    >
      <div className={`relative h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 font-medium text-lg ${conversation.is_group ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
        {avatar}
        {unread_count > 0 && isCollapsed && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-600 ring-2 ring-gray-50 dark:ring-[#202020]" />
        )}
      </div>
      
      {!isCollapsed && (
        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <span className="text-[15px] font-semibold truncate text-gray-900 dark:text-gray-100">{name}</span>
            {last_message && (
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">{formatTime(last_message.created_at)}</span>
            )}
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate pr-2">
              {last_message ? (
                last_message.sender_id === currentUser?.id ? `You: ${last_message.content}` : last_message.content
              ) : 'No messages yet'}
            </p>
            {unread_count > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                {unread_count}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
