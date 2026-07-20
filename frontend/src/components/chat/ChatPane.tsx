import React, { useRef, useEffect } from 'react';
import type { Conversation, User, Message } from '@/types';
import { ChatHeaderCard } from './ChatHeaderCard';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

interface ChatPaneProps {
  selectedConversation: Conversation | null;
  currentUser: User | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
  isTyping?: boolean;
  onTyping?: () => void;
  onOpenInfo?: () => void;
  onBack?: () => void;
  onToast?: (message: string, type: 'info' | 'error' | 'success') => void;
  onOpenUserInfo?: (user: User) => void;
}

export function ChatPane({
  selectedConversation,
  currentUser,
  messages,
  onSendMessage,
  getConversationName,
  getConversationAvatar,
  isTyping = false,
  onTyping,
  onOpenInfo,
  onBack,
  onToast,
  onOpenUserInfo,
}: ChatPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#111111]">
        <div className="text-gray-400 dark:text-gray-600 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Your Messages</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">Select a conversation from the sidebar or start a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header 
        className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-[#2d2d2d] shrink-0 bg-white dark:bg-[#111111] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202020] transition-colors"
        onClick={onOpenInfo}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); if (onBack) onBack(); }}
          className="md:hidden mr-2 p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-lg shrink-0 overflow-hidden">
          {(() => {
            if (selectedConversation.type === 'direct') {
              const otherMember = selectedConversation.members.find(m => m.user.id !== currentUser?.id);
              if (otherMember?.user.avatar_url) {
                return <img src={otherMember.user.avatar_url} alt="avatar" className="w-full h-full object-cover" />;
              }
            }
            return getConversationAvatar(selectedConversation);
          })()}
        </div>
        <div className="ml-3 flex-1 overflow-hidden">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 truncate">
            {getConversationName(selectedConversation)}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {selectedConversation.type === 'group' 
              ? `${selectedConversation.members.length} members` 
              : 'Direct message'}
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0 text-gray-500 dark:text-gray-400">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" title="Video Call (Coming Soon)" onClick={(e) => { e.stopPropagation(); alert('Video Call: Coming Soon'); }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full" title="Voice Call (Coming Soon)" onClick={(e) => { e.stopPropagation(); alert('Voice Call: Coming Soon'); }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-white dark:bg-[#111111]">
        <ChatHeaderCard
          selectedConversation={selectedConversation}
          currentUser={currentUser}
          getConversationName={getConversationName}
          getConversationAvatar={getConversationAvatar}
          firstMessage={messages.length > 0 ? messages[0] : undefined}
          onOpenInfo={onOpenInfo}
          onToast={onToast}
        />

        {messages.map((msg, index) => {
          const isConsecutiveWithPrev = index > 0 && messages[index - 1].sender_id === msg.sender_id;
          const isConsecutiveWithNext = index < messages.length - 1 && messages[index + 1].sender_id === msg.sender_id;
          
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              selectedConversation={selectedConversation}
              currentUser={currentUser}
              isConsecutiveWithPrev={isConsecutiveWithPrev}
              isConsecutiveWithNext={isConsecutiveWithNext}
              onAvatarClick={onOpenUserInfo}
            />
          );
        })}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </>
  );
}
