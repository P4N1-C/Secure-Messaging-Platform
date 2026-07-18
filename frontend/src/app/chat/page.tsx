'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { User, Conversation } from '@/types';
import { fetchCurrentUser } from '@/lib/api/auth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useWebSocket } from '@/hooks/useWebSocket';

import { ConversationList } from '@/components/chat/ConversationList';
import { ChatPane } from '@/components/chat/ChatPane';

export default function Home() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const {
    conversations,
    filteredConversations,
    searchQuery,
    setSearchQuery,
    getConversationName,
    getConversationAvatar,
    updateConversationLastMessage,
  } = useConversations(currentUser);

  const { messages, sendMessage } = useMessages(
    selectedConversation, 
    currentUser, 
    updateConversationLastMessage
  );

  // Initialize placeholder for step 5.6
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  useWebSocket(token);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX - 64;
      if (newWidth < 200) {
        newWidth = 80;
      } else if (newWidth > 500) {
        newWidth = 500;
      }
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      fetchCurrentUser()
        .then(setCurrentUser)
        .catch(err => {
           console.error('Failed to fetch user', err);
           if (err.message.includes('401') || err.message.includes('403')) {
              localStorage.removeItem('token');
              router.push('/login');
           }
        });
    }
  }, [router, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isCollapsed = sidebarWidth < 120;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900">
      {/* App Navigation Strip */}
      <nav className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200 shrink-0">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 font-bold text-lg">
           {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1"></div>
        <button 
          onClick={handleLogout}
          className="h-10 w-10 rounded-xl hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>

      {/* Chats Sidebar */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className="bg-gray-50 flex flex-col relative shrink-0 transition-[width] duration-0 border-r border-gray-200"
      >
        <ConversationList
          conversations={filteredConversations}
          currentUser={currentUser}
          selectedConversation={selectedConversation}
          isCollapsed={isCollapsed}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={setSelectedConversation}
          getConversationName={getConversationName}
          getConversationAvatar={getConversationAvatar}
        />

        {/* Resizer Handle */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-gray-300 active:bg-gray-400 z-10 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />
      </aside>

      {/* Main Chat Pane */}
      <main className="flex-1 flex flex-col bg-white min-w-0">
        <ChatPane
          selectedConversation={selectedConversation}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={sendMessage}
          getConversationName={getConversationName}
          getConversationAvatar={getConversationAvatar}
        />
      </main>
    </div>
  );
}

