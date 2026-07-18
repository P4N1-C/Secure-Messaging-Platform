import React, { useState, useEffect } from 'react';
import type { Conversation, User, Message } from '@/types';
import { fetchContacts, addContact } from '@/lib/api/contacts';

interface ChatHeaderCardProps {
  selectedConversation: Conversation;
  currentUser: User | null;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
  firstMessage?: Message;
  onOpenInfo?: () => void;
  onToast?: (message: string, type: 'info' | 'error' | 'success') => void;
}

export function ChatHeaderCard({
  selectedConversation,
  currentUser,
  getConversationName,
  getConversationAvatar,
  firstMessage,
  onOpenInfo,
  onToast
}: ChatHeaderCardProps) {
  const [isContact, setIsContact] = useState<boolean | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const otherMember = selectedConversation.type === 'direct' 
    ? selectedConversation.members.find(m => m.user.id !== currentUser?.id)
    : undefined;

  useEffect(() => {
    if (selectedConversation.type === 'direct' && otherMember) {
      setIsContact(null);
      fetchContacts().then(contacts => {
        const found = contacts.some(c => c.contact_user_id === otherMember.user.id);
        setIsContact(found);
      }).catch(err => {
        console.error("Failed to fetch contacts", err);
      });
    }
  }, [selectedConversation.id, otherMember]);

  const handleAddContact = async () => {
    if (!otherMember) return;
    try {
      setIsAdding(true);
      await addContact(otherMember.user.id);
      setIsContact(true);
      if (onToast) onToast('Contact added', 'success');
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Failed to add contact', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-10 mb-4">
      <div className="relative border border-gray-200 dark:border-[#2d2d2d] rounded-[28px] min-w-[260px] pt-10 pb-5 px-6 flex flex-col items-center bg-white dark:bg-[#111111]">
        <div className="absolute -top-10 w-20 h-20 rounded-full flex items-center justify-center font-medium text-3xl shrink-0 overflow-hidden border-4 border-white dark:border-[#111111] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
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
        
        <div className="flex items-center gap-1 mt-1 cursor-pointer hover:underline" onClick={onOpenInfo}>
          <h2 className="text-[16px] font-medium text-gray-900 dark:text-gray-100 text-center">
            {getConversationName(selectedConversation)}
          </h2>
          {selectedConversation.type === 'direct' && (
            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          )}
        </div>
        
        {selectedConversation.type === 'direct' && isContact === false && (
          <button 
            onClick={handleAddContact}
            disabled={isAdding}
            className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[13px] font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add to Contact'}
          </button>
        )}
        
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
