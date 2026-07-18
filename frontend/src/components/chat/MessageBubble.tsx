import React from 'react';
import type { Message, Conversation, User } from '@/types';

interface MessageBubbleProps {
  message: Message;
  selectedConversation: Conversation;
  currentUser: User | null;
  isConsecutiveWithPrev: boolean;
  isConsecutiveWithNext: boolean;
}

const getSenderColor = (senderId: number) => {
  const colors = [
    'text-green-600',
    'text-blue-600',
    'text-purple-600',
    'text-pink-600',
    'text-orange-600',
    'text-indigo-600',
    'text-red-600',
    'text-teal-600',
  ];
  return colors[senderId % colors.length];
};

export function MessageBubble({
  message,
  selectedConversation,
  currentUser,
  isConsecutiveWithPrev,
  isConsecutiveWithNext,
}: MessageBubbleProps) {
  const isSent = message.sender_id === currentUser?.id;
  const showSender = selectedConversation.type === 'group' && !isSent;
  const senderMember = selectedConversation.members.find(m => m.user.id === message.sender_id);
  const senderName = senderMember?.user.display_name || senderMember?.user.username || senderMember?.user.phone || 'Unknown';
  const senderAvatar = senderMember?.user.avatar_url;
  const senderInitial = senderName[0].toUpperCase();
  
  const marginClass = isConsecutiveWithPrev ? 'mt-1' : 'mt-4';
  const showTime = !isConsecutiveWithNext;

  let roundnessClass = 'rounded-3xl';
  if (isSent) {
    if (isConsecutiveWithPrev && isConsecutiveWithNext) {
      roundnessClass = 'rounded-l-3xl rounded-r-[6px]';
    } else if (isConsecutiveWithPrev && !isConsecutiveWithNext) {
      roundnessClass = 'rounded-3xl rounded-tr-[6px]';
    } else if (!isConsecutiveWithPrev && isConsecutiveWithNext) {
      roundnessClass = 'rounded-3xl rounded-br-[6px]';
    }
  } else {
    if (isConsecutiveWithPrev && isConsecutiveWithNext) {
      roundnessClass = 'rounded-r-3xl rounded-l-[6px]';
    } else if (isConsecutiveWithPrev && !isConsecutiveWithNext) {
      roundnessClass = 'rounded-3xl rounded-tl-[6px]';
    } else if (!isConsecutiveWithPrev && isConsecutiveWithNext) {
      roundnessClass = 'rounded-3xl rounded-bl-[6px]';
    }
  }

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${marginClass}`}>
      {showSender && !isConsecutiveWithPrev && (
        <div className="w-10 h-10 rounded-full bg-gray-300 mr-2 shrink-0 flex items-center justify-center overflow-hidden">
          {senderAvatar ? (
             <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
          ) : (
             <span className="text-gray-600 font-medium">{senderInitial}</span>
          )}
        </div>
      )}
      {showSender && isConsecutiveWithPrev && (
        <div className="w-10 mr-2 shrink-0"></div>
      )}
      
      <div className={`max-w-[70%] flex flex-col ${isSent ? 'items-end' : 'items-start'} min-w-0`}>
        {showTime ? (
          <div 
            className={`py-2.5 pl-4 pr-3.5 text-[15px] flex flex-col max-w-full min-w-0 ${
              isSent 
                ? `bg-blue-600 text-white ${roundnessClass}` 
                : `bg-gray-200 text-gray-900 ${roundnessClass}`
            }`}
          >
            {!isSent && selectedConversation.type === 'group' && !isConsecutiveWithPrev && (
              <span className={`text-[13px] font-semibold mb-1 ${getSenderColor(message.sender_id)}`}>
                {senderName}
              </span>
            )}
            <div className="flex items-end gap-3 w-full min-w-0">
              <span className="break-words whitespace-pre-wrap leading-tight flex-1 min-w-0">{message.content}</span>
              <span className={`text-[10px] shrink-0 select-none pb-0.5 ml-auto ${isSent ? 'text-blue-200' : 'text-gray-500'}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isSent && !message.isFailed && typeof message.id === 'number' && (
                <div className="relative w-[22px] h-[14px] flex items-center shrink-0">
                  {/* Left check circle */}
                  <div className="absolute left-0 w-3.5 h-3.5 rounded-full border border-blue-200/80 flex items-center justify-center bg-blue-600 z-0">
                    <svg className="w-2 h-2 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* Right check circle */}
                  <div className="absolute left-[7px] w-3.5 h-3.5 rounded-full border border-blue-200/80 flex items-center justify-center bg-blue-600 z-10">
                    <svg className="w-2 h-2 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
              {isSent && !message.isFailed && typeof message.id === 'string' && (
                 <div className="w-[14px] h-[14px] shrink-0 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
              )}
              {message.isFailed && (
                 <div className="flex items-center text-red-300 gap-1 ml-1" title="Failed to send">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div 
            className={`py-2.5 px-4 text-[15px] flex flex-col max-w-full min-w-0 ${
              isSent 
                ? `bg-blue-600 text-white ${roundnessClass}` 
                : `bg-gray-200 text-gray-900 ${roundnessClass}`
            }`}
          >
            {!isSent && selectedConversation.type === 'group' && !isConsecutiveWithPrev && (
              <span className={`text-[13px] font-semibold mb-1 ${getSenderColor(message.sender_id)}`}>
                {senderName}
              </span>
            )}
            <span className="break-words whitespace-pre-wrap leading-tight w-full min-w-0">{message.content}</span>
          </div>
        )}
      </div>
    </div>
  );
}
