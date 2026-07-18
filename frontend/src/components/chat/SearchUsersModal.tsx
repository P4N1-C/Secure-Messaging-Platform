import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import { searchUsers } from '@/lib/api/users';

interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (userId: number) => void;
}

export default function SearchUsersModal({ isOpen, onClose, onUserSelect }: SearchUsersModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      searchUsers(query.trim())
        .then(data => {
          setResults(data);
          setIsSearching(false);
        })
        .catch(err => {
          console.error("Search failed:", err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Chat</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search by username or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {isSearching && <div className="p-4 text-center text-gray-500">Searching...</div>}
          
          {!isSearching && query.trim().length > 0 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">No users found</div>
          )}

          {!isSearching && results.map(user => (
            <div 
              key={user.id} 
              onClick={() => onUserSelect(user.id)}
              className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.display_name ? user.display_name[0].toUpperCase() : 'U'
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.display_name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.username ? `@${user.username}` : user.phone}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
