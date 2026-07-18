import React from 'react';
import type { Conversation, User, Message } from '@/types';

interface ChatHeaderCardProps {
  selectedConversation: Conversation;
  currentUser: User | null;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
  firstMessage?: Message;
}

export function ChatHeaderCard({
  selectedConversation,
  currentUser,
  getConversationName,
  getConversationAvatar,
  firstMessage
}: ChatHeaderCardProps) {
  return (
    <div className="flex flex-col items-center mt-10 mb-4">
      <div className="relative border border-gray-200 rounded-[28px] min-w-[260px] pt-10 pb-5 px-6 flex flex-col items-center bg-white">
        <div className="absolute -top-10 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-3xl shrink-0 overflow-hidden border-4 border-white">
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
        
        <div className="flex items-center gap-1 mt-1 cursor-pointer hover:underline">
          <h2 className="text-[16px] font-medium text-gray-900 text-center">
            {getConversationName(selectedConversation)}
          </h2>
          {selectedConversation.type === 'direct' && (
            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          )}
        </div>
        
        {selectedConversation.type === 'group' && (
          <div className="text-[13px] text-gray-500 mt-2 flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {(() => {
              const othersCount = selectedConversation.members.length - 1;
              if (othersCount === 0) return 'Just you';
              const firstOther = selectedConversation.members.find(m => m.user.id !== currentUser?.id);
              const firstName = firstOther?.user.display_name || firstOther?.user.username || firstOther?.user.phone;
              if (othersCount === 1) return `${firstName} and you`;
              return `${firstName} and ${othersCount - 1} others`;
            })()}
          </div>
        )}
      </div>
      
      {firstMessage && (
        <div className="text-[12px] text-gray-400 mt-8 mb-2">
          {new Date(firstMessage.created_at).toDateString() === new Date().toDateString() 
            ? 'Today' 
            : new Date(firstMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}
