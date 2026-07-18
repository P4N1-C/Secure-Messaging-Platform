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
  getConversationAvatar
}: ConversationListProps) {
  return (
    <>
      {isCollapsed ? (
        <div className="pt-5 pb-2 flex flex-col items-center space-y-4">
          <button className="text-gray-600 hover:bg-gray-200 p-1.5 rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          <h1 className="text-xl font-bold truncate">Chats</h1>
          <div className="flex space-x-1 text-gray-600 shrink-0">
            <button className="p-1 hover:bg-gray-200 rounded-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          </div>
        </div>
      )}
      
      {!isCollapsed && (
        <div className="px-4 py-2 shrink-0">
          <div className="h-9 bg-gray-200/60 rounded-full w-full flex items-center px-3">
            <svg className="w-4 h-4 text-gray-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder-gray-500" 
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
