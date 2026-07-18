import React, { useState, useEffect } from 'react';
import type { Conversation, User, Contact } from '@/types';
import { MemberRow } from './MemberRow';
import { fetchContacts } from '@/lib/api/contacts';

interface GroupInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User | null;
  onAddMember: (userId: number) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
  onOpenUserInfo: (user: User) => void;
}

export function GroupInfoPanel({ isOpen, onClose, conversation, currentUser, onAddMember, onRemoveMember, onOpenUserInfo }: GroupInfoPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdding) {
      setLoading(true);
      fetchContacts()
        .then(setContacts)
        .finally(() => setLoading(false));
    } else {
      setSelectedId(null);
    }
  }, [isAdding]);

  if (!isOpen) return null;

  const currentMember = conversation.members.find(m => m.user.id === currentUser?.id);
  const isAdmin = currentMember?.role === 'admin';

  // Filter out contacts who are already members
  const availableContacts = contacts.filter(c => 
    !conversation.members.some(m => m.user.id === c.contact_user.id)
  );

  const handleAdd = async () => {
    if (selectedId) {
      await onAddMember(selectedId);
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isAdding ? 'Add Member' : 'Group Info'}</h2>
          <button onClick={() => isAdding ? setIsAdding(false) : onClose()} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAdding ? "M15 19l-7-7 7-7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {isAdding ? (
            <div>
              {loading ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading contacts...</div>
              ) : availableContacts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No available contacts to add.</div>
              ) : (
                <div className="space-y-2">
                  {availableContacts.map(c => (
                    <label key={c.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="radio"
                        name="contact"
                        checked={selectedId === c.contact_user.id}
                        onChange={() => setSelectedId(c.contact_user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 ml-3 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0 overflow-hidden text-sm">
                        {c.contact_user.avatar_url ? (
                          <img src={c.contact_user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          (c.contact_user.display_name?.[0] || c.contact_user.username?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900 truncate">
                        {c.contact_user.display_name || c.contact_user.username || c.contact_user.phone}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {availableContacts.length > 0 && (
                <button 
                  onClick={handleAdd}
                  disabled={!selectedId}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Add Selected
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{conversation.members.length} Members</h3>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {/* Ensure admin/current user is near top if we wanted, but we can just render */}
                {conversation.members.map(member => (
                  <MemberRow 
                    key={member.id} 
                    member={member} 
                    currentUser={currentUser} 
                    isAdmin={isAdmin} 
                    onRemove={onRemoveMember}
                    onOpenUserInfo={onOpenUserInfo} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
