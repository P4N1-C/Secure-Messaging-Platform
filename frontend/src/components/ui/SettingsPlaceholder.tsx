import React from 'react';

interface SettingsPlaceholderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPlaceholder({ isOpen, onClose }: SettingsPlaceholderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {['Privacy', 'Notifications', 'Appearance'].map((section) => (
            <div key={section} className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-not-allowed">
              <span className="font-medium text-gray-900 dark:text-gray-100">{section}</span>
              <span className="text-xs font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-1 rounded-full uppercase tracking-wider">Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
