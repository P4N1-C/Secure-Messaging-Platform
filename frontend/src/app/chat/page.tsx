'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Subtract the left nav strip width (64px)
      let newWidth = e.clientX - 64;
      
      // Snap logic
      if (newWidth < 200) {
        newWidth = 80;
      } else if (newWidth > 500) {
        newWidth = 500;
      }
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto'; // Re-enable selection
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isCollapsed = sidebarWidth < 120;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900">
      {/* App Navigation Strip */}
      <nav className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200 shrink-0">
        <div className="h-10 w-10 rounded-full bg-gray-300 mb-6"></div>
        <div className="flex-1"></div>
        <button 
          onClick={handleLogout}
          className="h-10 w-10 rounded-xl hover:bg-gray-200 flex items-center justify-center mb-4 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </nav>

      {/* Chats Sidebar */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className="bg-gray-50 flex flex-col relative shrink-0 transition-[width] duration-0"
      >
        {isCollapsed ? (
          <div className="pt-5 pb-2 flex flex-col items-center space-y-4">
             <button className="text-gray-600 hover:bg-gray-200 p-1.5 rounded-md">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </button>
             <button className="text-gray-600 hover:bg-gray-200 p-1.5 rounded-md">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
             </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between px-4 shrink-0">
            <h1 className="text-xl font-bold truncate">Chats</h1>
            <div className="flex space-x-1 text-gray-600 shrink-0">
               <button className="p-1 hover:bg-gray-200 rounded-md">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </button>
               <button className="p-1 hover:bg-gray-200 rounded-md">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
               </button>
            </div>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="px-4 py-2 shrink-0">
            <div className="h-9 bg-gray-200/60 rounded-full w-full flex items-center px-3">
               <svg className="w-4 h-4 text-gray-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <span className="text-sm text-gray-500">Search</span>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mt-2">
          {/* Dummy chat item 1 */}
          <div className={`flex items-center cursor-pointer ${isCollapsed ? 'p-2 mx-auto w-[60px] h-[60px] justify-center rounded-2xl bg-gray-200 mb-2' : 'p-3 mx-2 rounded-lg bg-gray-200 mb-1'}`}>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
               <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            
            {!isCollapsed && (
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <span className="text-[15px] font-semibold truncate text-gray-900">Test</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">23m</span>
                </div>
                <p className="text-[13px] text-gray-500 truncate mt-0.5">You: Hello</p>
              </div>
            )}
          </div>

          {/* Dummy chat item 2 */}
          <div className={`flex items-center cursor-pointer ${isCollapsed ? 'p-2 mx-auto w-[60px] h-[60px] justify-center rounded-full hover:bg-gray-200 mb-2 transition-colors' : 'p-3 mx-2 rounded-lg hover:bg-gray-200 transition-colors'}`}>
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 text-gray-600 font-medium text-lg">
               r
            </div>
            
            {!isCollapsed && (
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <span className="text-[15px] font-semibold truncate text-gray-900">raturisl61</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">29m</span>
                </div>
                <p className="text-[13px] text-gray-500 truncate mt-0.5">.</p>
              </div>
            )}
          </div>
        </div>

        {/* Resizer Handle */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-gray-300 active:bg-gray-400 z-10 border-r border-gray-200 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection while dragging
          }}
        />
      </aside>

      {/* Main Chat Pane */}
      <main className="flex-1 flex flex-col bg-white min-w-0">
        <header className="h-16 border-b border-gray-100 flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center min-w-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 shrink-0">
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 truncate">Test</h2>
          </div>
          <div className="flex space-x-4 text-gray-500 shrink-0 ml-4">
             <button><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 00-2-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
             <button><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end">
           {/* Dummy message */}
           <div className="flex justify-end mb-2">
             <div className="bg-blue-600 text-white py-2 px-3 rounded-3xl rounded-br-sm max-w-[70%]">
               <p className="text-[15px]">Hello</p>
             </div>
           </div>
        </div>
        
        <footer className="p-4 shrink-0">
           <div className="bg-gray-100 rounded-full h-11 w-full flex items-center px-4">
             <svg className="w-5 h-5 text-gray-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <input type="text" placeholder="Message" className="flex-1 bg-transparent outline-none text-sm text-gray-900" />
           </div>
        </footer>
      </main>
    </div>
  );
}
