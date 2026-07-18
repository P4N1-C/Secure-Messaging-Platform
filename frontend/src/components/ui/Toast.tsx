import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'error' | 'success';
  duration?: number;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type = 'info', duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300); // Wait for transition
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const baseClasses = "fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-300 z-50 flex items-center gap-2";
  const typeClasses = {
    info: "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900",
    error: "bg-red-600 text-white dark:bg-red-700",
    success: "bg-green-600 text-white dark:bg-green-700"
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <span>{message}</span>
      <button 
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(id), 300);
        }}
        className="ml-2 hover:opacity-75 focus:outline-none"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}
