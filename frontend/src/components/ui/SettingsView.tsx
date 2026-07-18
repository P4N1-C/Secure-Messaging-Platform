import React, { useState } from 'react';
import type { User } from '@/types';

interface SettingsViewProps {
  currentUser: User | null;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export function SettingsView({ currentUser, isDarkMode, setIsDarkMode }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('profile');

  // The sidebar nav links
  const links = [
    { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'appearance', label: 'Appearance', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    { id: 'chats', label: 'Chats', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'calls', label: 'Calls', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'privacy', label: 'Privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'data_usage', label: 'Data usage', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    { id: 'backups', label: 'Backups', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'donate', label: 'Donate to Signal', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
  ];

  return (
    <div className="flex-1 flex min-w-0">
      {/* Settings Sidebar */}
      <aside className="w-[320px] bg-gray-50 dark:bg-[#202020] flex flex-col shrink-0 border-r border-gray-200 dark:border-[#2d2d2d]">
        <div className="h-16 flex items-center px-6 shrink-0">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="px-4 mb-2">
            <div 
              onClick={() => setActiveTab('profile')}
              className={`p-3 rounded-2xl flex items-center gap-4 cursor-pointer transition-colors ${activeTab === 'profile' ? 'bg-gray-200 dark:bg-gray-800' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0 text-xl">
                {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {currentUser?.display_name || currentUser?.username}
                </span>
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                  {currentUser?.phone || `@${currentUser?.username}`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="px-2 mt-4 space-y-0.5">
            {links.map(link => (
              <div 
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg mx-2 cursor-pointer transition-colors ${activeTab === link.id ? 'bg-gray-200 dark:bg-gray-800' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {link.icon.split(' M').map((path, i) => (
                    <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={i > 0 ? 'M' + path : path} />
                  ))}
                </svg>
                <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">{link.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Pane */}
      <main className="flex-1 bg-white dark:bg-[#111111] flex justify-center overflow-y-auto">
        <div className="w-full max-w-2xl py-12 px-8 flex flex-col">
          {activeTab === 'profile' ? (
            <div className="flex flex-col">
              <h2 className="text-[15px] font-medium text-gray-900 dark:text-white text-center mb-10">Profile</h2>
              
              <div className="flex flex-col items-center mb-12">
                <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-4xl font-bold mb-4">
                  {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <button className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[13px] font-medium text-gray-900 dark:text-gray-100 rounded-full transition-colors">
                  Edit photo
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                      {currentUser?.display_name || currentUser?.username}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1">
                      About
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      Your profile and changes to it will be visible to people you message, contacts and groups.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="text-[15px] font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {currentUser?.username}
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      People can now message you using your optional username so you don't have to give out your phone number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'appearance' ? (
            <div className="flex flex-col">
              <h2 className="text-[15px] font-medium text-gray-900 dark:text-white text-center mb-10">Appearance</h2>
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[15px] text-gray-900 dark:text-gray-100">Theme</span>
                <select
                  value={isDarkMode ? 'dark' : 'light'}
                  onChange={(e) => setIsDarkMode(e.target.value === 'dark')}
                  className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-[15px] text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <h2 className="text-xl font-medium text-gray-500">
                {links.find(l => l.id === activeTab)?.label} Settings
              </h2>
              <p className="text-sm text-gray-400 mt-2">Coming Soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
