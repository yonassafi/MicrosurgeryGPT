import React, { useState, useRef, useEffect } from 'react';
import { initializeGemini, sendMessageToGemini } from './services/geminiService';
import { Message, Role } from './types';
import { SUGGESTED_TOPICS, DISCLAIMER } from './constants';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [inputKey, setInputKey] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(!!process.env.API_KEY);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSetKey = () => {
    if (inputKey.trim().length > 0) {
      setApiKey(inputKey);
      initializeGemini(inputKey);
      setIsConfigured(true);
    }
  };

  // Initial setup if env var exists
  useEffect(() => {
    if (process.env.API_KEY) {
      initializeGemini(process.env.API_KEY);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !isConfigured) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: "Error connecting to MicrosurgeryGPT. Please check your API key or connection.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // API Key Modal
  if (!isConfigured) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">MicrosurgeryGPT</h2>
          <p className="text-center text-slate-500 mb-6">
            Enter your Gemini API Key to access the specialized reconstructive surgery assistant.
          </p>
          <input
            type="password"
            placeholder="Paste API Key here..."
            className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
          />
          <button
            onClick={handleSetKey}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Enter Operating Room
          </button>
          <p className="mt-4 text-xs text-center text-slate-400">
            This key is used only locally for the session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex w-80 flex-col bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            MicrosurgeryGPT
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Fine-tuned on PubMed abstracts (2020-2024) for Plastic & Reconstructive Surgery.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Research Topics</h3>
          <div className="space-y-2">
            {SUGGESTED_TOPICS.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(topic.query)}
                className="w-full text-left p-3 rounded-lg text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200 group border border-transparent hover:border-teal-100"
              >
                <span className="font-medium block group-hover:translate-x-1 transition-transform">{topic.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-500">System Status: Operational</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
           <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            MicroGPT
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="mt-12 text-center">
                <div className="inline-block p-4 rounded-full bg-teal-50 text-teal-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Expert Reconstructive Consultation</h1>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Ask specific questions about surgical techniques, flap choices (DIEP, ALT), or postoperative management.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {SUGGESTED_TOPICS.slice(0,2).map((topic, idx) => (
                    <button 
                       key={idx}
                       onClick={() => handleSendMessage(topic.query)}
                       className="text-sm bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all text-left text-slate-700"
                    >
                      {topic.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex flex-row gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white animate-spin">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </div>
                  <div className="flex items-center space-x-1 bg-teal-50 p-4 rounded-2xl rounded-tl-none">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about microsurgical techniques..."
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm transition-all"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className={`absolute right-2 p-2 rounded-lg transition-all ${
                  inputValue.trim() && !isLoading
                    ? 'bg-teal-600 text-white hover:bg-teal-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              {DISCLAIMER}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;