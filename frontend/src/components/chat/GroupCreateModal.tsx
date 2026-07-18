import React, { useState, useEffect } from 'react';
import type { Contact } from '@/types';
import { fetchContacts } from '@/lib/api/contacts';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, userIds: number[]) => void;
}

export function GroupCreateModal({ isOpen, onClose, onCreate }: GroupCreateModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchContacts()
        .then(setContacts)
        .finally(() => setLoading(false));
      setSelectedIds(new Set());
      setGroupName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedIds.size > 0) {
      onCreate(groupName.trim(), Array.from(selectedIds));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              placeholder="Enter group name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Members</label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="text-sm text-gray-500">No contacts available.</div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <label key={c.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(c.contact_user.id)}
                      onChange={() => handleToggle(c.contact_user.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg mr-2 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
