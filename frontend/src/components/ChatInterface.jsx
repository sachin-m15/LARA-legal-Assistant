import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Scale, Sparkles, BookOpen, Gavel, MessageSquare, Shield, FileText, Users, Award, LogOut, History } from 'lucide-react';
import axios from 'axios';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import FloatingParticles from './FloatingParticles';
import FloatingImages from './FloatingImages';
import ChatHistorySidebar from './ChatHistorySidebar';
import { UserButton } from "@clerk/clerk-react";

function ChatInterface() {
  const [query, setQuery] = useState('');
  const [userRole, setUserRole] = useState('citizen');
  const [messages, setMessages] = useState([]);
  // Track loading state per-thread so switching threads/roles doesn't hide in-progress
  // requests for other threads. This array contains threadIds that are currently loading.
  const [loadingThreads, setLoadingThreads] = useState([]);
  // Cache messages per-thread so background results are available when returning
  // to a thread even if the UI wasn't active when the result arrived.
  const [threadsCache, setThreadsCache] = useState({});
  const [threadId, setThreadId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentThreadFilter, setCurrentThreadFilter] = useState(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  // Holds an optimistic thread object that has been created client-side but
  // not yet confirmed by the backend. This lets the History show the new
  // thread immediately while the engine processes the query.
  const [optimisticThread, setOptimisticThread] = useState(null);

  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    // On user change / first load, try to preload the latest saved thread from the backend.
    // If there is existing history, load the most-recent thread and its messages into UI and cache.
    // Otherwise, initialize a fresh welcome thread.
    const init = async () => {
      const welcomeText = `Welcome ${user?.firstName || 'back'} to L.A.R.A! I am your AI Legal Assistant. How can I help you today? Please select your role and ask a question below.`;

      if (!user) {
        // Not signed in yet — create a transient welcome thread until we have a user
        const newThreadId = crypto.randomUUID();
        setThreadId(newThreadId);
        const welcomeMsg = {
          id: crypto.randomUUID(),
          type: 'bot',
          content: welcomeText,
          timestamp: new Date()
        };
        setMessages([welcomeMsg]);
        setThreadsCache(prev => ({ ...prev, [newThreadId]: [welcomeMsg] }));
        return;
      }

      try {
        const resp = await axios.post('http://127.0.0.1:8000/get_chat_history', { user_id: user.id });
        const threads = resp.data.threads || [];
        if (threads.length > 0) {
          // Sort by updated_at desc and pick latest
          threads.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          const latest = threads[0];
          setThreadId(latest.thread_id);

          // Fetch messages for the latest thread
          try {
            const msgsResp = await axios.post('http://127.0.0.1:8000/get_thread_messages', { thread_id: latest.thread_id });
            const loadedMessages = msgsResp.data.messages.map(msg => ({
              id: crypto.randomUUID(),
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
            setThreadsCache(prev => ({ ...prev, [latest.thread_id]: loadedMessages }));
          } catch (err) {
            console.error('Failed to load messages for latest thread:', err);
            // Fallback to a welcome message if fetch fails
            const newThreadId = crypto.randomUUID();
            setThreadId(newThreadId);
            const welcomeMsg = { id: crypto.randomUUID(), type: 'bot', content: welcomeText, timestamp: new Date() };
            setMessages([welcomeMsg]);
            setThreadsCache(prev => ({ ...prev, [newThreadId]: [welcomeMsg] }));
          }
        } else {
          // No history — initialize welcome thread
          const newThreadId = crypto.randomUUID();
          setThreadId(newThreadId);
          const welcomeMsg = { id: crypto.randomUUID(), type: 'bot', content: welcomeText, timestamp: new Date() };
          setMessages([welcomeMsg]);
          setThreadsCache(prev => ({ ...prev, [newThreadId]: [welcomeMsg] }));
        }
      } catch (error) {
        console.error('Error loading chat history on init:', error);
        const newThreadId = crypto.randomUUID();
        setThreadId(newThreadId);
        const welcomeMsg = { id: crypto.randomUUID(), type: 'bot', content: welcomeText, timestamp: new Date() };
        setMessages([welcomeMsg]);
        setThreadsCache(prev => ({ ...prev, [newThreadId]: [welcomeMsg] }));
      }
    };
const savedCache = localStorage.getItem("LARA_CACHE");
if (savedCache) {
  setThreadsCache(JSON.parse(savedCache));
}
const savedLoading = localStorage.getItem("LARA_LOADING");
if (savedLoading) {
  setLoadingThreads(JSON.parse(savedLoading));
}

const savedThread = localStorage.getItem("LARA_CURRENT_THREAD");
if (savedThread) {
  setThreadId(savedThread);
}

    init();
  }, [user]);
useEffect(() => {
  localStorage.setItem("LARA_CACHE", JSON.stringify(threadsCache));
}, [threadsCache]);

useEffect(() => {
  localStorage.setItem("LARA_LOADING", JSON.stringify(loadingThreads));
}, [loadingThreads]);

useEffect(() => {
  if (threadId) {
    localStorage.setItem("LARA_CURRENT_THREAD", threadId);
  }
}, [threadId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };

  // Determine if this will be the first real user message in this thread
  const isFirstRealMessage = messages.length <= 1; // welcome msg counts as 1
  // capture thread and query for this submission
  const submissionThreadId = threadId;
  const currentQuery = query;

  // update UI for current thread immediately
  setMessages(prev => [...prev, userMessage]);
  // update thread cache for this thread
  setThreadsCache(prev => {
    const prevMsgs = prev[submissionThreadId] ?? [];
    return { ...prev, [submissionThreadId]: [...prevMsgs, userMessage] };
  });


  // Persist the thread optimistically when the user sends their first real message
  // so it appears in the history immediately while the engine is working.
  if (isFirstRealMessage && user) {
    const opt = {
      thread_id: submissionThreadId,
      title: currentQuery.length > 50 ? currentQuery.substring(0, 50) + '...' : currentQuery,
      updated_at: new Date().toISOString()
    };
    // show in sidebar immediately
    setOptimisticThread(opt);
    setSidebarRefreshTrigger(prev => prev + 1);

    // Fire-and-forget backend save. We don't await this so UI remains snappy.
    axios.post('http://127.0.0.1:8000/save_thread', {
      user_id: user.id,
      thread_id: submissionThreadId,
      title: opt.title
    }).then(() => {
      // once backend confirms, we can clear optimistic marker; the next
      // sidebar fetch will include the persisted thread so it's safe to clear.
      setOptimisticThread(null);
    }).catch((error) => {
      console.error('Error saving thread (optimistic):', error);
      // keep optimistic thread visible — optionally show an indicator in UI later
    });
  }

  setQuery('');
  // mark this thread as loading
  setLoadingThreads(prev => (prev.includes(submissionThreadId) ? prev : [...prev, submissionThreadId]));

    try {
      const result = await axios.post('http://127.0.0.1:8000/process_query', {
        user_query: currentQuery,
        role: userRole,
        thread_id: submissionThreadId,
      });

      const botMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: result.data.final_analysis,
        timestamp: new Date()
      };
      // Add bot response to thread cache so it is available when returning to the thread
      setThreadsCache(prev => {
        const prevMsgs = prev[submissionThreadId] ?? [];
        return { ...prev, [submissionThreadId]: [...prevMsgs, botMessage] };
      });
      // Only append the bot message to the current UI if the user is still
      // viewing the same thread. Otherwise, the backend will persist the
      // message and it will appear when the user re-opens that thread.
        if (submissionThreadId === threadId) { 
          setMessages(prev => [...prev, botMessage]); 
        } 

      

    } catch (error) {
      console.error("Error fetching response from backend:", error);
      const errorMsg = error.response?.data?.detail || error.message || 'Server unavailable';

      const errorMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: `Error: ${errorMsg}`,
        timestamp: new Date(),
        isError: true
      };
      // Record the error in cache and show it if the user is viewing the thread.
      setThreadsCache(prev => {
        const prevMsgs = prev[submissionThreadId] ?? [];
        return { ...prev, [submissionThreadId]: [...prevMsgs, errorMessage] };
      });
      if (submissionThreadId === threadId) {
        setMessages(prev => [...prev, errorMessage]);
      }

    } finally {
      // remove loading mark for this thread
      setLoadingThreads(prev => prev.filter(id => id !== submissionThreadId));
    }
  };

  const clearChat = () => {
    const newThreadId = crypto.randomUUID();
    setMessages([{
      id: crypto.randomUUID(),
      type: 'bot',
      content: `Welcome ${user?.firstName || 'back'} to L.A.R.A! I am your AI Legal Assistant. How can I help you today? Please select your role and ask a question below.`,
      timestamp: new Date()
    }]);
    setThreadId(newThreadId);
    // initialize cache for this new thread
    setThreadsCache(prev => ({ ...prev, [newThreadId]: [{
      id: crypto.randomUUID(),
      type: 'bot',
      content: `Welcome ${user?.firstName || 'back'} to L.A.R.A! I am your AI Legal Assistant. How can I help you today? Please select your role and ask a question below.`,
      timestamp: new Date()
    }] }));
    setCurrentThreadFilter(newThreadId); // Filter to show only this new thread
    // Clear any optimistic thread when creating a fresh chat
    setOptimisticThread(null);
    // Do not persist new empty threads here. The thread will be saved
    // when the user sends their first real message (handled in handleSubmit).
  };


 const handleThreadSelect = async (newThreadId) => {
  // Switch active thread
  setThreadId(newThreadId);
  setCurrentThreadFilter(null);
  setOptimisticThread(null);

  // --- 1) CACHE-FIRST LOADING ---
  // If this thread already exists in cache (even partially),
  // show cached messages immediately.
  // This ensures:
  //  - User's last query reappears instantly
  //  - Loader shows if thread is still processing
  const cachedMessages = threadsCache[newThreadId];
  if (cachedMessages && cachedMessages.length > 0) {
    setMessages(cachedMessages);
    return; // IMPORTANT: Do NOT fetch from backend now
  }

  // --- 2) BACKEND FETCH (fallback for OLD threads) ---
  try {
    const resp = await axios.post('http://127.0.0.1:8000/get_thread_messages', {
      thread_id: newThreadId
    });

    const loadedMessages = resp.data.messages.map(msg => ({
      id: crypto.randomUUID(),
      type: msg.role === 'user' ? 'user' : 'bot',
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    }));

    // Update UI & cache
    setMessages(loadedMessages);
    setThreadsCache(prev => ({
      ...prev,
      [newThreadId]: loadedMessages
    }));

  } catch (error) {
    console.error("Error loading messages for thread:", error);

    // Optional fallback message (keeps UI consistent even on backend failure)
    const fallbackMessage = [{
      id: crypto.randomUUID(),
      type: "bot",
      content: "Unable to load messages for this thread.",
      timestamp: new Date()
    }];

    setMessages(fallbackMessage);
    setThreadsCache(prev => ({
      ...prev,
      [newThreadId]: fallbackMessage
    }));
  }
};


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      setCurrentThreadFilter(null); // Clear filter when opening sidebar to show all history
      setSidebarRefreshTrigger(prev => prev + 1); // Force sidebar re-render to fetch all threads
    }
  };

  // When the user changes role (Citizen <-> Lawyer), start a new chat/thread.
  // This prevents mixing messages from different roles in the same conversation.
  const handleRoleChange = (newRole) => {
    if (!newRole || newRole === userRole) return;

    // Create a fresh thread and welcome message for the new role
    const newThreadId = crypto.randomUUID();
    setUserRole(newRole);
    setThreadId(newThreadId);

    const welcomeMessage = {
      id: crypto.randomUUID(),
      type: 'bot',
      content: `Welcome ${user?.firstName || 'back'} to L.A.R.A! You switched to ${newRole === 'lawyer' ? 'Lawyer' : 'Citizen'} mode. How can I help you in this role?`,
      timestamp: new Date()
    };

    // Reset messages to only the role-specific welcome message and
    // set a local filter so the UI focuses on the new chat.
    setMessages([welcomeMessage]);
    setCurrentThreadFilter(newThreadId);

  // initialize cache for the new role/thread
  setThreadsCache(prev => ({ ...prev, [newThreadId]: [welcomeMessage] }));

    // Do not persist the thread until the user sends their first message
    // but force the sidebar to refresh so the UI reflects the change.
    setSidebarRefreshTrigger(prev => prev + 1);
    // Clear any optimistic thread when switching roles
    setOptimisticThread(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
      <FloatingParticles />
      <FloatingImages />
      
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent pointer-events-none z-1" />      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-2xl">
          <div className="px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Scale className="w-9 h-9 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 bg-clip-text text-transparent drop-shadow-lg">
                  L.A.R.A
                </h1>
                <p className="text-gray-700 text-base font-semibold tracking-wide">Legal Analysis & Research Assistant</p>
                <p className="text-gray-500 text-sm">Powered by Advanced AI Technology</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-md border border-gray-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  History
                </div>
              </button>
              <button
                onClick={clearChat}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-md border border-gray-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  New Chat
                </div>
              </button>
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-14 h-14"
                  }
                }}
              />
            </div>
          </div>
          
          {/* Role Selector */}
          <div className="bg-gray-100/80 border-t border-gray-200 px-6 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Role:
              </span>
              <div className="flex gap-4">
                {[
                  { value: 'citizen', label: 'Citizen', icon: User },
                  { value: 'lawyer', label: 'Legal Professional', icon: Gavel }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="cursor-pointer group">
                    <div className={`relative px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 border ${
                      userRole === value 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg border-gray-600 text-white' 
                        : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 backdrop-blur-md text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={value}
                          checked={userRole === value}
                          onChange={() => handleRoleChange(value)}
                          className="sr-only"
                        />
                        <Icon className={`w-4 h-4 transition-colors ${userRole === value ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'}`} />
                        <span className={`font-semibold text-sm transition-colors ${userRole === value ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </label>
                  
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto py-8 px-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-6 mb-8 animate-fade-in ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'bot' && (
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-xl border-2 border-gray-300">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
                
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`px-8 py-6 rounded-3xl shadow-2xl border-2 backdrop-blur-md ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white border-gray-600'
                      : message.isError
                      ? 'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-400'
                      : 'bg-white/90 text-gray-800 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`font-bold text-base ${
                        message.type === 'user' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        {message.type === 'user' ? 'You' : 'L.A.R.A'}
                      </span>
                      {message.type === 'bot' && !message.isError && <Award className="w-4 h-4 text-gray-600" />}
                      <span className={`text-xs ${
                        message.type === 'user' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="prose prose-lg max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                        {message.content}
                      </pre>
                    </div>
                  </div>
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center shadow-xl border-2 border-gray-300">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {loadingThreads.includes(threadId) && (
              <div className="flex gap-6 mb-8 animate-fade-in">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-xl border-2 border-gray-300">
                    <Bot className="w-7 h-7 text-white animate-pulse" />
                  </div>
                </div>
                <div className="bg-white/90 rounded-3xl px-8 py-6 shadow-2xl border-2 border-gray-200 max-w-md backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-base text-gray-700">L.A.R.A</span>
                    <Sparkles className="w-4 h-4 text-gray-600 animate-spin" />
                    <span className="text-xs text-gray-500">analyzing...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-4 h-4 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-sm text-gray-600 ml-2">Processing your legal inquiry</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your legal question or case in detail..."
                  className="w-full resize-none bg-white backdrop-blur-md border-2 border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-gray-400/50 focus:border-gray-500 text-gray-800 placeholder-gray-500 shadow-2xl transition-all duration-300 text-lg"
                  rows="3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!query.trim() || loadingThreads.includes(threadId)}
                className="px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-black text-white rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-2xl transform hover:scale-105 disabled:hover:scale-100 font-bold text-lg border-2 border-gray-400"
              >
                <Send className="w-6 h-6" />
                <span>Analyze</span>
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-4 text-center flex items-center justify-center gap-4">
              <span>Press Enter to send • Shift+Enter for a new line</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Secure & Confidential</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        <ChatHistorySidebar
          refreshTrigger={sidebarRefreshTrigger}
          optimisticThread={optimisticThread}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onThreadSelect={handleThreadSelect}
          currentThreadId={threadId}
          currentThreadFilter={currentThreadFilter}
        />
      </div>
    </div>
  );
}

export default ChatInterface;
