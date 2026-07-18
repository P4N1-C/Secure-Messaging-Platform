import React, { useState, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping?: () => void;
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Throttle/debounce typing event to max once per second
  const lastTypingTime = useRef<number>(0);
  const handleTyping = () => {
    if (!onTyping) return;
    const now = Date.now();
    if (now - lastTypingTime.current > 1000) {
      onTyping();
      lastTypingTime.current = now;
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-[20px] min-h-[40px] flex items-end px-2 py-1 relative">
        <button className="h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center shrink-0 mb-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleTyping();
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message"
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-2 py-1.5 min-w-0 resize-none max-h-[120px] mb-0.5 leading-relaxed"
          style={{ minHeight: '30px' }}
        />
        <button 
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${inputValue.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-gray-400'}`}
        >
          <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  );
}
