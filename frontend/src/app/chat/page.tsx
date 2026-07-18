'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

interface User {
  id: number;
  phone: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface Member {
  id: number;
  user: User;
}

interface Message {
  id: number | string;
  content: string;
  created_at: string;
  sender_id: number;
  isFailed?: boolean;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  members: Member[];
  last_message?: Message;
  unread_count: number;
}

const getSenderColor = (senderId: number) => {
  const colors = [
    'text-green-600',
    'text-blue-600',
    'text-purple-600',
    'text-pink-600',
    'text-orange-600',
    'text-indigo-600',
    'text-red-600',
    'text-teal-600',
  ];
  return colors[senderId % colors.length];
};

export default function Home() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || !currentUser) return;
    
    const content = inputValue.trim();
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      created_at: new Date().toISOString(),
      sender_id: currentUser.id,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      const res = await fetchWithAuth(`/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      const savedMessage = await res.json();
      
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? savedMessage : msg)
      );
      
      // Update the conversation's last message optimistically too
      setConversations(prev => 
        prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, last_message: savedMessage }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? { ...msg, isFailed: true } : msg)
      );
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX - 64;
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
        document.body.style.userSelect = 'auto';
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchWithAuth('/users/me')
        .then(res => res.json())
        .then(data => setCurrentUser(data))
        .catch(err => {
           console.error('Failed to fetch user', err);
           if (err.message.includes('401')) {
              localStorage.removeItem('token');
              router.push('/login');
           }
        });
        
      fetchWithAuth('/conversations')
        .then(res => res.json())
        .then(data => setConversations(data))
        .catch(err => console.error('Failed to fetch conversations', err));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    const otherMember = conv.members.find(m => m.user.id !== currentUser?.id);
    return otherMember?.user.display_name || otherMember?.user.username || otherMember?.user.phone || 'Unknown User';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name ? conv.name[0].toUpperCase() : 'G';
    const otherMember = conv.members.find(m => m.user.id !== currentUser?.id);
    const name = otherMember?.user.display_name || otherMember?.user.username || 'U';
    return name[0].toUpperCase();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchWithAuth(`/conversations/${conv.id}/messages`)
      .then(res => res.json())
      .then(data => {
         // Backend returns newest first, so we reverse for chronological order
         if (Array.isArray(data)) {
           setMessages(data.reverse());
         }
      })
      .catch(err => console.error('Failed to fetch messages', err));
  };

  const filteredConversations = conversations.filter(conv => 
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCollapsed = sidebarWidth < 120;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900">
      {/* App Navigation Strip */}
      <nav className="w-16 bg-gray-50 flex flex-col items-center py-4 border-r border-gray-200 shrink-0">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 font-bold text-lg">
           {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || 'U'}
        </div>
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
        className="bg-gray-50 flex flex-col relative shrink-0 transition-[width] duration-0 border-r border-gray-200"
      >
        {isCollapsed ? (
          <div className="pt-5 pb-2 flex flex-col items-center space-y-4">
             <button className="text-gray-600 hover:bg-gray-200 p-1.5 rounded-md">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between px-4 shrink-0">
            <h1 className="text-xl font-bold truncate">Chats</h1>
            <div className="flex space-x-1 text-gray-600 shrink-0">
               <button className="p-1 hover:bg-gray-200 rounded-md">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </button>
            </div>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="px-4 py-2 shrink-0">
            <div className="h-9 bg-gray-200/60 rounded-full w-full flex items-center px-3">
               <svg className="w-4 h-4 text-gray-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input 
                 type="text" 
                 placeholder="Search" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm w-full text-gray-900 placeholder-gray-500" 
               />
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mt-2">
          {filteredConversations.map((conv) => (
            <div key={conv.id} onClick={() => handleSelectConversation(conv)} className={`flex items-center cursor-pointer ${isCollapsed ? `p-2 mx-auto w-[60px] h-[60px] justify-center rounded-2xl mb-2 transition-colors ${selectedConversation?.id === conv.id ? 'bg-gray-200' : 'hover:bg-gray-200'}` : `p-3 mx-2 rounded-lg mb-1 transition-colors ${selectedConversation?.id === conv.id ? 'bg-gray-200' : 'hover:bg-gray-200'}`}`}>
              <div className="relative h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-medium text-lg">
                 {getConversationAvatar(conv)}
                 {conv.unread_count > 0 && isCollapsed && (
                   <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-600 ring-2 ring-gray-50" />
                 )}
              </div>
              
              {!isCollapsed && (
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-semibold truncate text-gray-900">{getConversationName(conv)}</span>
                    {conv.last_message && (
                       <span className="text-xs text-gray-500 shrink-0 ml-2">{formatTime(conv.last_message.created_at)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-[13px] text-gray-500 truncate pr-2">
                       {conv.last_message ? (
                         conv.last_message.sender_id === currentUser?.id ? `You: ${conv.last_message.content}` : conv.last_message.content
                       ) : 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredConversations.length === 0 && !isCollapsed && (
             <div className="text-center p-4 text-sm text-gray-500">
                No conversations found.
             </div>
          )}
        </div>

        {/* Resizer Handle */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-gray-300 active:bg-gray-400 z-10 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />
      </aside>

      {/* Main Chat Pane */}
      <main className="flex-1 flex flex-col bg-white min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className="h-16 flex items-center px-4 border-b border-gray-200 shrink-0 bg-white">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg shrink-0">
                {getConversationAvatar(selectedConversation)}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                  {getConversationName(selectedConversation)}
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  {selectedConversation.type === 'group' 
                    ? `${selectedConversation.members.length} members` 
                    : 'Direct message'}
                </p>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-white">
              {/* Profile/Group Info Card */}
              <div className="flex flex-col items-center mt-10 mb-4">
                <div className="relative border border-gray-200 rounded-[28px] min-w-[260px] pt-10 pb-5 px-6 flex flex-col items-center bg-white">
                  <div className="absolute -top-10 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-3xl shrink-0 overflow-hidden border-4 border-white">
                    {(() => {
                      if (selectedConversation.type === 'direct') {
                        const otherMember = selectedConversation.members.find(m => m.user.id !== currentUser?.id);
                        if (otherMember?.user.avatar_url) {
                          return <img src={otherMember.user.avatar_url} alt="avatar" className="w-full h-full object-cover" />;
                        }
                      }
                      return getConversationAvatar(selectedConversation);
                    })()}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 cursor-pointer hover:underline">
                    <h2 className="text-[16px] font-medium text-gray-900 text-center">
                      {getConversationName(selectedConversation)}
                    </h2>
                    {selectedConversation.type === 'direct' && (
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    )}
                  </div>
                  
                  {selectedConversation.type === 'group' && (
                    <div className="text-[13px] text-gray-500 mt-2 flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      {(() => {
                        const othersCount = selectedConversation.members.length - 1;
                        if (othersCount === 0) return 'Just you';
                        const firstOther = selectedConversation.members.find(m => m.user.id !== currentUser?.id);
                        const firstName = firstOther?.user.display_name || firstOther?.user.username || firstOther?.user.phone;
                        if (othersCount === 1) return `${firstName} and you`;
                        return `${firstName} and ${othersCount - 1} others`;
                      })()}
                    </div>
                  )}
                </div>
                
                {messages.length > 0 && (
                  <div className="text-[12px] text-gray-400 mt-8 mb-2">
                     {new Date(messages[0].created_at).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(messages[0].created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>

              {messages.map((msg, index) => {
                const isSent = msg.sender_id === currentUser?.id;
                const showSender = selectedConversation.type === 'group' && !isSent;
                const senderMember = selectedConversation.members.find(m => m.user.id === msg.sender_id);
                const senderName = senderMember?.user.display_name || senderMember?.user.username || senderMember?.user.phone || 'Unknown';
                const senderAvatar = senderMember?.user.avatar_url;
                const senderInitial = senderName[0].toUpperCase();
                
                const isConsecutiveWithPrev = index > 0 && messages[index - 1].sender_id === msg.sender_id;
                const isConsecutiveWithNext = index < messages.length - 1 && messages[index + 1].sender_id === msg.sender_id;
                const marginClass = isConsecutiveWithPrev ? 'mt-1' : 'mt-4';
                const showTime = !isConsecutiveWithNext;

                let roundnessClass = 'rounded-3xl';
                if (isSent) {
                  if (isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundnessClass = 'rounded-l-3xl rounded-r-[6px]';
                  } else if (isConsecutiveWithPrev && !isConsecutiveWithNext) {
                    roundnessClass = 'rounded-3xl rounded-tr-[6px]';
                  } else if (!isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundnessClass = 'rounded-3xl rounded-br-[6px]';
                  }
                } else {
                  if (isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundnessClass = 'rounded-r-3xl rounded-l-[6px]';
                  } else if (isConsecutiveWithPrev && !isConsecutiveWithNext) {
                    roundnessClass = 'rounded-3xl rounded-tl-[6px]';
                  } else if (!isConsecutiveWithPrev && isConsecutiveWithNext) {
                    roundnessClass = 'rounded-3xl rounded-bl-[6px]';
                  }
                }

                return (
                  <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${marginClass}`}>
                    {showSender && !isConsecutiveWithPrev && (
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-2 shrink-0 flex items-center justify-center overflow-hidden">
                        {senderAvatar ? (
                           <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-gray-600 font-medium">{senderInitial}</span>
                        )}
                      </div>
                    )}
                    {showSender && isConsecutiveWithPrev && (
                      <div className="w-10 mr-2 shrink-0"></div>
                    )}
                    
                    <div className={`max-w-[70%] flex flex-col ${isSent ? 'items-end' : 'items-start'} min-w-0`}>
                      {showTime ? (
                        <div 
                          className={`py-2.5 pl-4 pr-3.5 text-[15px] flex flex-col max-w-full min-w-0 ${
                            isSent 
                              ? `bg-blue-600 text-white ${roundnessClass}` 
                              : `bg-gray-200 text-gray-900 ${roundnessClass}`
                          }`}
                        >
                          {!isSent && selectedConversation.type === 'group' && !isConsecutiveWithPrev && (
                            <span className={`text-[13px] font-semibold mb-1 ${getSenderColor(msg.sender_id)}`}>
                              {senderName}
                            </span>
                          )}
                          <div className="flex items-end gap-3 w-full min-w-0">
                            <span className="break-words whitespace-pre-wrap leading-tight flex-1 min-w-0">{msg.content}</span>
                            <span className={`text-[10px] shrink-0 select-none pb-0.5 ml-auto ${isSent ? 'text-blue-200' : 'text-gray-500'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isSent && !msg.isFailed && typeof msg.id === 'number' && (
                              <div className="relative w-[22px] h-[14px] flex items-center shrink-0">
                                {/* Left check circle */}
                                <div className="absolute left-0 w-3.5 h-3.5 rounded-full border border-blue-200/80 flex items-center justify-center bg-blue-600 z-0">
                                  <svg className="w-2 h-2 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                {/* Right check circle */}
                                <div className="absolute left-[7px] w-3.5 h-3.5 rounded-full border border-blue-200/80 flex items-center justify-center bg-blue-600 z-10">
                                  <svg className="w-2 h-2 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            {isSent && !msg.isFailed && typeof msg.id === 'string' && (
                               <div className="w-[14px] h-[14px] shrink-0 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                            )}
                            {msg.isFailed && (
                               <div className="flex items-center text-red-300 gap-1 ml-1" title="Failed to send">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`py-2.5 px-4 text-[15px] flex flex-col max-w-full min-w-0 ${
                            isSent 
                              ? `bg-blue-600 text-white ${roundnessClass}` 
                              : `bg-gray-200 text-gray-900 ${roundnessClass}`
                          }`}
                        >
                          {!isSent && selectedConversation.type === 'group' && !isConsecutiveWithPrev && (
                            <span className={`text-[13px] font-semibold mb-1 ${getSenderColor(msg.sender_id)}`}>
                              {senderName}
                            </span>
                          )}
                          <span className="break-words whitespace-pre-wrap leading-tight w-full min-w-0">{msg.content}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
               <div className="bg-gray-100 rounded-[20px] min-h-[40px] flex items-end px-2 py-1 relative">
                  <button className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-200 flex items-center justify-center shrink-0 mb-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Message"
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder-gray-500 px-2 py-1.5 min-w-0 resize-none max-h-[120px] mb-0.5 leading-relaxed"
                    style={{ minHeight: '30px' }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${inputValue.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-transparent text-gray-400'}`}
                  >
                    <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Your Messages</h2>
              <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar or start a new one.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
