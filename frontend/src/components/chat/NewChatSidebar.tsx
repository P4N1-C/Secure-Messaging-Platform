import React, { useState, useEffect } from 'react';
import type { Conversation, User } from '@/types';
import { searchUsers } from '@/lib/api/users';

interface NewChatSidebarProps {
  view: 'new_chat' | 'find_username' | 'find_phone';
  setView: (view: 'chats' | 'new_chat' | 'find_username' | 'find_phone') => void;
  conversations: Conversation[];
  currentUser: User | null;
  onNewGroup: () => void;
  onUserSelect: (userId: number) => void;
  getConversationName: (conv: Conversation) => string;
  getConversationAvatar: (conv: Conversation) => string;
  onSelectConversation: (conv: Conversation) => void;
  onToast: (msg: string, type: 'info'|'error'|'success') => void;
  isNavVisible: boolean;
  onToggleNav: () => void;
}

export function NewChatSidebar({
  view,
  setView,
  conversations,
  currentUser,
  onNewGroup,
  onUserSelect,
  getConversationName,
  getConversationAvatar,
  onSelectConversation,
  onToast,
  isNavVisible,
  onToggleNav
}: NewChatSidebarProps) {
  const [localSearch, setLocalSearch] = useState('');
  
  const [usernameQuery, setUsernameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const countryCode = '+91';
  const [isSearching, setIsSearching] = useState(false);

  const directConversations = conversations.filter(c => c.type === 'direct');
  const groupConversations = conversations.filter(c => c.type === 'group');

  const filteredDirect = directConversations.filter(c => getConversationName(c).toLowerCase().includes(localSearch.toLowerCase()));
  const filteredGroups = groupConversations.filter(c => getConversationName(c).toLowerCase().includes(localSearch.toLowerCase()));

  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    let activeQuery = '';
    if (view === 'find_username') {
      activeQuery = usernameQuery;
    } else if (view === 'find_phone') {
      activeQuery = phoneQuery ? countryCode + phoneQuery : '';
    }

    if (!activeQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(activeQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameQuery, phoneQuery, view]);

  const renderHeader = (title: string, onBack: () => void) => (
    <div className="h-16 flex items-center px-4 shrink-0 gap-2">
      {!isNavVisible && (
        <button onClick={onToggleNav} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-900 dark:text-gray-100 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}
      <button onClick={onBack} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 className="text-[17px] font-bold text-gray-900 dark:text-white truncate ml-2">{title}</h1>
    </div>
  );

  if (view === 'find_username') {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-[#111]">
        {renderHeader('Find by username', () => {
           setView('new_chat');
           setSearchResults([]);
           setUsernameQuery('');
        })}
        <div className="px-4 py-2 shrink-0">
          <div className="h-10 bg-gray-200/80 dark:bg-[#2d2d2d] rounded-lg flex items-center px-3 mb-2">
            <input 
              type="text" 
              placeholder="Username" 
              value={usernameQuery}
              onChange={(e) => setUsernameQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[15px] w-full text-gray-900 dark:text-gray-100 placeholder-gray-500" 
              autoFocus
            />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">
            Enter a username followed by a dot and its set of numbers.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto mt-2">
           {isSearching ? (
             <div className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">Searching...</div>
           ) : searchResults.length > 0 ? (
             <div className="px-2">
               {searchResults.map(user => (
                 <div 
                   key={user.id}
                   onClick={() => onUserSelect(user.id)}
                   className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
                 >
                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                     {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || 'U'}
                   </div>
                   <div className="flex flex-col min-w-0">
                     <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                       {user.display_name || user.username}
                     </span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                       @{user.username}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : usernameQuery.trim() ? (
             <div className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">No users found</div>
           ) : null}
        </div>
      </div>
    );
  }

  if (view === 'find_phone') {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-[#111]">
        {renderHeader('Find by phone number', () => {
           setView('new_chat');
           setSearchResults([]);
           setPhoneQuery('');
        })}
        <div className="px-4 py-2 shrink-0 flex flex-col gap-3">
          <div className="h-10 bg-gray-200/80 dark:bg-[#2d2d2d] rounded-lg flex items-center px-3">
            <span className="text-gray-500 dark:text-gray-400 mr-2 text-[15px]">Country code</span>
            <div className="bg-transparent border-none outline-none text-[15px] flex-1 text-right text-gray-900 dark:text-gray-100 pr-1">
              +91
            </div>
          </div>
          <div className="h-10 bg-gray-200/80 dark:bg-[#2d2d2d] rounded-lg flex items-center px-3">
            <input 
              type="text" 
              placeholder="Phone number" 
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="bg-transparent border-none outline-none text-[15px] w-full text-gray-900 dark:text-gray-100 placeholder-gray-500" 
              autoFocus
              maxLength={10}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto mt-2">
           {isSearching ? (
             <div className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">Searching...</div>
           ) : searchResults.length > 0 ? (
             <div className="px-2">
               {searchResults.map(user => (
                 <div 
                   key={user.id}
                   onClick={() => onUserSelect(user.id)}
                   className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
                 >
                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                     {user.display_name?.[0]?.toUpperCase() || user.username[0]?.toUpperCase() || 'U'}
                   </div>
                   <div className="flex flex-col min-w-0">
                     <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                       {user.display_name || user.username}
                     </span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                       {user.phone || `@${user.username}`}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : phoneQuery.trim() ? (
             <div className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">No users found</div>
           ) : null}
        </div>
      </div>
    );
  }

  // view === 'new_chat'
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#111]">
      {renderHeader('New chat', () => setView('chats'))}
      
      <div className="px-4 py-2 shrink-0 flex items-center gap-3">
        <div className="h-9 bg-gray-200/80 dark:bg-[#2d2d2d] rounded-lg flex-1 flex items-center px-3">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Name, username, or number" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[15px] w-full text-gray-900 dark:text-gray-100 placeholder-gray-500" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pb-4">
        <div className="px-2">
          <div 
            onClick={onNewGroup}
            className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2d2d2d] flex items-center justify-center mr-3 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">New group</span>
          </div>
          
          <div 
            onClick={() => setView('find_username')}
            className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2d2d2d] flex items-center justify-center mr-3 text-gray-900 dark:text-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
            </div>
            <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">Find by username</span>
          </div>

          <div 
            onClick={() => setView('find_phone')}
            className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#2d2d2d] flex items-center justify-center mr-3 text-gray-900 dark:text-gray-100">
              <span className="text-xl leading-none">#</span>
            </div>
            <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">Find by phone number</span>
          </div>
        </div>

        {filteredDirect.length > 0 && (
          <div className="mt-4">
            <h2 className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white">Contacts</h2>
            <div className="px-2">
              {filteredDirect.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    {getConversationAvatar(conv)}
                  </div>
                  <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getConversationName(conv)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredGroups.length > 0 && (
          <div className="mt-4">
            <h2 className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white">Groups</h2>
            <div className="px-2">
              {filteredGroups.map(conv => (
                <div 
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="flex items-center px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer rounded-lg mx-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400 font-bold shrink-0">
                    {getConversationAvatar(conv)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getConversationName(conv)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conv.members.length} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
