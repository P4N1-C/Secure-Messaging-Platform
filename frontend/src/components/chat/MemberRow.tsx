import React from 'react';
import type { User, Member } from '@/types';

interface MemberRowProps {
  member: Member;
  currentUser: User | null;
  isAdmin: boolean;
  onRemove: (userId: number) => void;
}

export function MemberRow({ member, currentUser, isAdmin, onRemove }: MemberRowProps) {
  const isMe = member.user.id === currentUser?.id;
  const displayName = isMe 
    ? 'You' 
    : member.user.display_name || member.user.username || member.user.phone;

  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
      <div className="flex items-center min-w-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0 overflow-hidden">
          {member.user.avatar_url ? (
            <img src={member.user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            displayName[0].toUpperCase()
          )}
        </div>
        <div className="ml-3 truncate">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
        </div>
      </div>
      
      {isAdmin && !isMe && member.role !== 'admin' && (
        <button 
          onClick={() => onRemove(member.user.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Remove Member"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
    </div>
  );
}
