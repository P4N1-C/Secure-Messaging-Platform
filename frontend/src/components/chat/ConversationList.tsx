import React, { useState } from 'react';
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
  isNavVisible: boolean;
  onToggleNav: () => void;
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
  onStoriesClick,
  isNavVisible,
  onToggleNav
}: ConversationListProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderMoreMenu = () => (
    <div className="relative">
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100" title="More options">
        <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className={`absolute ${isCollapsed ? 'left-full ml-4' : 'right-0'} top-full mt-1 w-56 bg-gray-100 dark:bg-[#202020] rounded-xl shadow-lg border border-gray-200 dark:border-[#2d2d2d] py-1.5 z-50`}>
            <button className="w-full text-left px-4 py-2 text-[15px] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              View Archive
            </button>
            <button className="w-full text-left px-4 py-2 text-[15px] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
              Add chat folder
            </button>
            <button className="w-full text-left px-4 py-2 text-[15px] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-between text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                Notification profile
              </div>
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {isCollapsed ? (
        <div className="pt-4 pb-2 flex flex-col items-center space-y-3">
          {!isNavVisible && (
            <button onClick={onToggleNav} className="text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md" title="Menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}
          <button onClick={onNewChat} className="text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 p-1.5 rounded-md" title="New Chat">
            <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {renderMoreMenu()}
        </div>
      ) : (
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            {!isNavVisible && (
              <button onClick={onToggleNav} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <h1 className="text-[22px] font-bold truncate dark:text-white">Chats</h1>
          </div>
          <div className="flex space-x-2 text-gray-900 dark:text-gray-100 shrink-0">
            <button onClick={onNewChat} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100" title="New Chat">
              <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {renderMoreMenu()}
          </div>
        </div>

      )}
      
      {!isCollapsed && (
        <div className="px-4 py-2 shrink-0 flex items-center gap-3">
          <div className="h-9 bg-gray-200/80 dark:bg-[#2d2d2d] rounded-lg flex-1 flex items-center px-3">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-[15px] w-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
            />
          </div>
          <button className="text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-[#2d2d2d] p-1.5 rounded-md">
            <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
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
