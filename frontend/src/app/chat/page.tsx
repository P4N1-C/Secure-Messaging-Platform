'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { User, Conversation } from '@/types';
import { fetchCurrentUser } from '@/lib/api/auth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useWebSocket } from '@/hooks/useWebSocket';

import { ConversationList } from '@/components/chat/ConversationList';
import { ChatPane } from '@/components/chat/ChatPane';
import { GroupCreateModal } from '@/components/chat/GroupCreateModal';
import { GroupInfoPanel } from '@/components/chat/GroupInfoPanel';
import { UserInfoModal } from '@/components/chat/UserInfoModal';
import SearchUsersModal from '@/components/chat/SearchUsersModal';
import { Toast, ToastProps } from '@/components/ui/Toast';
import { SettingsPlaceholder } from '@/components/ui/SettingsPlaceholder';

export default function Home() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [selectedUserForInfo, setSelectedUserForInfo] = useState<User | null>(null);
  const [isSearchUsersOpen, setIsSearchUsersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const addToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, onDismiss: (id) => setToasts(t => t.filter(toast => toast.id !== id)) }]);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Typing state: { [conversationId]: timeoutId }
  const [typingState, setTypingState] = useState<Record<number, NodeJS.Timeout>>({});
  const typingRef = useRef(typingState);
  useEffect(() => { typingRef.current = typingState; }, [typingState]);

  const {
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
  } = useConversations(currentUser);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Forward declarations for WS callbacks
  const handleWsNewMessage = useCallback((message: any) => {
    updateConversationLastMessage(message.conversation_id, message);
    if (selectedConversation && selectedConversation.id === message.conversation_id) {
       // Handled by handleIncomingMessage passed down below via effect, but since we can't easily 
       // access handleIncomingMessage inside here without dependency cycles, we'll expose a ref or 
       // just pass it down in useEffect. Wait, we can just call it if we use a ref.
    }
  }, [updateConversationLastMessage, selectedConversation]);

  const handleWsTyping = useCallback((conversationId: number, userId: number) => {
    if (userId === currentUser?.id) return;
    
    // Clear existing timeout
    if (typingRef.current[conversationId]) {
      clearTimeout(typingRef.current[conversationId]);
    }
    
    const timeoutId = setTimeout(() => {
      setTypingState(prev => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    }, 3000);
    
    setTypingState(prev => ({ ...prev, [conversationId]: timeoutId }));
  }, [currentUser]);

  const handleWsReadReceipt = useCallback((messageId: number, userId: number, status: string, conversationId: number) => {
    // This is a dummy callback to initialize useWebSocket.
    // The actual handling is done by actualHandleReadReceipt and patched later.
  }, []);

  // Define refs for use in callbacks to avoid circular dependencies
  const handleIncomingMessageRef = useRef<any>(null);
  const updateMessageStatusRef = useRef<any>(null);
  const selectedConversationRef = useRef<Conversation | null>(selectedConversation);
  const sendMarkReadViaWsRef = useRef<any>(null);

  const actualHandleNewMessage = useCallback((msg: any) => {
    const isSelected = selectedConversationRef.current?.id === msg.conversation_id;
    const isFromMe = msg.sender_id === currentUser?.id;
    
    updateConversationLastMessage(msg.conversation_id, msg, !isSelected && !isFromMe);
    
    if (isSelected) {
      if (handleIncomingMessageRef.current) handleIncomingMessageRef.current(msg);
      
      // If we are currently viewing this conversation, mark it as read
      if (!isFromMe && sendMarkReadViaWsRef.current) {
         sendMarkReadViaWsRef.current(msg.id);
      }
    } else if (!isFromMe) {
      addToast('New message received', 'info');
    }
  }, [updateConversationLastMessage, currentUser]);

  const actualHandleReadReceipt = useCallback((messageId: number, userId: number, status: any, conversationId: number) => {
    if (selectedConversationRef.current?.id === conversationId && updateMessageStatusRef.current) {
      updateMessageStatusRef.current(messageId, status);
    }
  }, []);

  const handleRemovedFromGroup = useCallback((conversationId: number) => {
    removeConversation(conversationId);
    if (selectedConversationRef.current?.id === conversationId) {
       setSelectedConversation(null);
       addToast('You were removed from the group', 'error');
    }
  }, [removeConversation]);

  const { isConnected, sendMessageViaWs, sendTypingViaWs, sendMarkReadViaWs } = useWebSocket({
    token,
    onNewMessage: actualHandleNewMessage,
    onTyping: handleWsTyping,
    onReadReceipt: actualHandleReadReceipt,
    onRemovedFromGroup: handleRemovedFromGroup
  });
  
  useEffect(() => { sendMarkReadViaWsRef.current = sendMarkReadViaWs; }, [sendMarkReadViaWs]);

  const { messages, sendMessage, handleIncomingMessage, updateMessageStatus } = useMessages(
    selectedConversation, 
    currentUser, 
    updateConversationLastMessage,
    sendMessageViaWs,
    () => addToast('Message failed to send', 'error')
  );

  useEffect(() => {
    handleIncomingMessageRef.current = handleIncomingMessage;
    updateMessageStatusRef.current = updateMessageStatus;
    selectedConversationRef.current = selectedConversation;
  }, [handleIncomingMessage, updateMessageStatus, selectedConversation]);

  // Handle Mark Read on conversation open
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.sender_id !== currentUser?.id && m.status !== 'read');
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(m => {
          if (typeof m.id === 'number') {
            sendMarkReadViaWs(m.id);
            if (updateMessageStatusRef.current) {
               updateMessageStatusRef.current(m.id, 'read');
            }
          }
        });
        markConversationAsRead(selectedConversation.id);
        setSelectedConversation(prev => prev ? { ...prev, unread_count: 0 } : prev);
      } else if (selectedConversation.unread_count > 0) {
        markConversationAsRead(selectedConversation.id);
        setSelectedConversation(prev => prev ? { ...prev, unread_count: 0 } : prev);
      }
    } else if (selectedConversation && selectedConversation.unread_count > 0) {
        markConversationAsRead(selectedConversation.id);
        setSelectedConversation(prev => prev ? { ...prev, unread_count: 0 } : prev);
    }
  }, [selectedConversation, messages, currentUser, sendMarkReadViaWs, markConversationAsRead]);

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
  
  const isTyping = selectedConversation ? !!typingState[selectedConversation.id] : false;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* App Navigation Strip */}
      <nav className="w-16 bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-4 border-r border-gray-200 dark:border-gray-800 shrink-0 hidden md:flex">
        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 font-bold text-lg">
           {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1"></div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-10 w-10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center mb-4 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
        <button 
          onClick={handleLogout}
          className="h-10 w-10 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center mb-4 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>

      {/* Chats Sidebar */}
      <aside 
        style={{ width: isCollapsed ? '80px' : `${sidebarWidth}px` }}
        className={`bg-gray-50 dark:bg-[#111] flex flex-col relative shrink-0 transition-[width] duration-0 border-r border-gray-200 dark:border-gray-800 ${selectedConversation ? 'hidden md:flex' : 'w-full md:w-auto flex-1 md:flex-none'}`}
      >
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
               {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="font-semibold">{currentUser?.display_name || currentUser?.username}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
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
          onNewGroup={() => setIsCreateGroupOpen(true)}
          onNewChat={() => setIsSearchUsersOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onStoriesClick={() => alert('Stories: Coming Soon')}
        />

        {/* Resizer Handle */}
        <div 
          className="hidden md:block absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-gray-300 dark:hover:bg-gray-700 active:bg-gray-400 dark:active:bg-gray-600 z-10 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />
      </aside>

      {/* Main Chat Pane */}
      <main className={`flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <ChatPane
          selectedConversation={selectedConversation}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={sendMessage}
          getConversationName={getConversationName}
          getConversationAvatar={getConversationAvatar}
          isTyping={isTyping}
          onTyping={() => selectedConversation && sendTypingViaWs(selectedConversation.id)}
          onOpenInfo={() => {
            if (selectedConversation) {
              if (selectedConversation.type === 'direct') {
                const otherUser = selectedConversation.members.find(m => m.user.id !== currentUser?.id)?.user;
                if (otherUser) setSelectedUserForInfo(otherUser);
              } else {
                setIsGroupInfoOpen(true);
              }
            }
          }}
          onBack={() => setSelectedConversation(null)}
          onToast={addToast}
          onOpenUserInfo={setSelectedUserForInfo}
        />
      </main>

      <GroupCreateModal 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)} 
        onCreate={async (name, userIds) => {
          const newGroup = await handleCreateGroup(name, userIds);
          setSelectedConversation(newGroup);
          setIsCreateGroupOpen(false);
        }}
      />

      <SearchUsersModal
        isOpen={isSearchUsersOpen}
        onClose={() => setIsSearchUsersOpen(false)}
        onUserSelect={async (userId) => {
          // Check if conversation exists
          const existingConv = filteredConversations.find(c => c.type === 'direct' && c.members.some(m => m.user.id === userId));
          if (existingConv) {
            setSelectedConversation(existingConv);
            setIsSearchUsersOpen(false);
            return;
          }
          // If not, create it
          try {
            const newConv = await handleCreateDirectConversation(userId);
            setSelectedConversation(newConv);
            setIsSearchUsersOpen(false);
          } catch (err) {
            console.error("Failed to create direct conversation", err);
          }
        }}
      />

      {selectedConversation && (
        <GroupInfoPanel 
          isOpen={isGroupInfoOpen} 
          onClose={() => setIsGroupInfoOpen(false)} 
          conversation={selectedConversation} 
          currentUser={currentUser} 
          onAddMember={async (userId) => {
            const newMember = await handleAddMember(selectedConversation.id, userId);
            setSelectedConversation(prev => {
               if (!prev) return prev;
               return { ...prev, members: [...prev.members, newMember] };
            });
            addToast('Added to group', 'success');
          }} 
          onRemoveMember={async (userId) => {
            await handleRemoveMember(selectedConversation.id, userId);
            setSelectedConversation(prev => {
               if (!prev) return prev;
               return { ...prev, members: prev.members.filter(m => m.user?.id !== userId) };
            });
            addToast('Removed from group', 'success');
          }} 
          onOpenUserInfo={setSelectedUserForInfo}
        />
      )}

      <SettingsPlaceholder isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <UserInfoModal
        isOpen={!!selectedUserForInfo}
        onClose={() => setSelectedUserForInfo(null)}
        user={selectedUserForInfo}
        sharedGroups={selectedUserForInfo ? conversations.filter(c => c.type === 'group' && c.members.some(m => m.user.id === selectedUserForInfo.id)).map(c => c.name || 'Unnamed Group') : []}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={toast.onDismiss} />
        ))}
      </div>
    </div>
  );
}

