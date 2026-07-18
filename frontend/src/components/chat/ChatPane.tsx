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
}

export function ChatPane({
  selectedConversation,
  currentUser,
  messages,
  onSendMessage,
  getConversationName,
  getConversationAvatar,
}: ChatPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-gray-400 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Your Messages</h2>
          <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar or start a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0 bg-white">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg shrink-0">
          {getConversationAvatar(selectedConversation)}
        </div>
        <div className="ml-3 flex-1 overflow-hidden">
          <h2 className="text-[15px] font-semibold text-gray-900 truncate">
            {getConversationName(selectedConversation)}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {selectedConversation.type === 'group' 
              ? `${selectedConversation.members.length} members` 
              : 'Direct message'}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-white">
        <ChatHeaderCard
          selectedConversation={selectedConversation}
          currentUser={currentUser}
          getConversationName={getConversationName}
          getConversationAvatar={getConversationAvatar}
          firstMessage={messages.length > 0 ? messages[0] : undefined}
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
            />
          );
        })}
        <TypingIndicator />
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={onSendMessage} />
    </>
  );
}
