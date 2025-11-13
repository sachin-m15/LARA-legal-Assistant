import React, { useState, useEffect } from 'react';
import { History, MessageSquare, Trash2, Plus, X } from 'lucide-react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';

function ChatHistorySidebar({ isOpen, onClose, onThreadSelect, currentThreadId, currentThreadFilter }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (isOpen && user) {
      fetchChatHistory();
    }
  }, [isOpen, user, currentThreadFilter]);

  const fetchChatHistory = async () => {
    if (!user) return;
    try {
      const response = await axios.post('http://127.0.0.1:8000/get_chat_history', {
        user_id: user.id
      });
      setThreads(response.data.threads);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleThreadSelect = async (thread) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/get_thread_messages', {
        thread_id: thread.thread_id
      });

      const messages = response.data.messages.map(msg => ({
        id: crypto.randomUUID(),
        type: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));

      onThreadSelect(thread.thread_id, messages);
      onClose();
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  const handleDeleteThread = async (threadId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://127.0.0.1:8000/delete_thread/${threadId}`);
      setThreads(threads.filter(t => t.thread_id !== threadId));
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const handleNewChat = () => {
    onThreadSelect(crypto.randomUUID(), []);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-800">Chat History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl hover:from-gray-800 hover:to-black transition-all duration-300 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">New Chat</span>
            </button>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">No chat history yet</p>
                <p className="text-sm text-center mt-2">Start a new conversation to see it here</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {threads
                  .filter(thread => !currentThreadFilter || thread.thread_id === currentThreadFilter)
                  .map((thread) => (
                  <div
                    key={thread.thread_id}
                    onClick={() => handleThreadSelect(thread)}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      thread.thread_id === currentThreadId
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-md'
                        : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {thread.title || 'Untitled Chat'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(thread.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteThread(thread.thread_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatHistorySidebar;