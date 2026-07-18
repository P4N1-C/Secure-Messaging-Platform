import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex justify-start mt-2 mb-2">
      <div className="bg-gray-200 rounded-3xl py-3 px-4 flex items-center space-x-1.5 w-16">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
