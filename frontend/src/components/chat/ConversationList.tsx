import React from 'react';
import type { Conversation, User } from '@/types';
import { ConversationListItem } from './ConversationListItem';

interface ConversationListProps {
  conversations: Conversation[];
  currentUser: User | null;
  selectedConversation: Conversation | null;
  isCollapsed: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConversation: (conv: Conversation) => void;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
  onNewGroup: () => void;
  onNewChat: () => void;
  onSettingsClick?: () => void;
  onStoriesClick?: () => void;
}

export function ConversationList({
  conversations,
  currentUser,
  selectedConversation,
  isCollapsed,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  getConversationName,
  getConversationAvatar,
  onNewGroup,
  onNewChat,
  onSettingsClick,
  onStoriesClick
}: ConversationListProps) {
  return (
    <>
      {isCollapsed ? (
        <div className="pt-5 pb-2 flex flex-col items-center space-y-4">
          <button onClick={onSettingsClick} className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md" title="Settings (Coming Soon)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          <h1 className="text-xl font-bold truncate dark:text-white">Chats</h1>
          <div className="flex space-x-1 text-gray-600 dark:text-gray-400 shrink-0">
            <button onClick={onStoriesClick} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md" title="Stories (Coming Soon)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} strokeDasharray="3 3" /></svg>
            </button>
            <button onClick={onNewGroup} className="p-1 hover:bg-gray-200 rounded-md" title="New Group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button onClick={onNewChat} className="p-1 hover:bg-gray-200 rounded-md" title="New Chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>
        </div>

      )}
      
      {!isCollapsed && (
        <div className="px-4 py-2 shrink-0">
          <div className="h-9 bg-gray-200/60 dark:bg-gray-800 rounded-full w-full flex items-center px-3">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto mt-2">
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            currentUser={currentUser}
            isSelected={selectedConversation?.id === conv.id}
            isCollapsed={isCollapsed}
            onSelect={onSelectConversation}
            getConversationName={getConversationName}
            getConversationAvatar={getConversationAvatar}
          />
        ))}
        {conversations.length === 0 && !isCollapsed && (
          <div className="text-center p-4 text-sm text-gray-500">
            No conversations found.
          </div>
        )}
      </div>
    </>
  );
}
