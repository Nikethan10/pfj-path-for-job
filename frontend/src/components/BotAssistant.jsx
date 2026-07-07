import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../services/api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export default function BotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { sender: 'bot', text: `${getGreeting()}! I'm your PATH Assistant . I can help you navigate or answer questions about the platform. What can I do for you today?` }
      ]);
    }
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsThinking(true);

    try {
      const { data } = await API.post('/assistant/chat', { message: userText });

      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      
      // Handle dynamic data refresh actions from assistant
      if (data.action && data.action.type === 'refresh_data') {
        const event = new CustomEvent('PATH_refresh_data', { detail: data.action });
        window.dispatchEvent(event);
      }

      // Handle navigation if suggested by the bot
      if (data.path) {
        setTimeout(() => navigate(data.path), 1500);
      }
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: "I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-neon-cyan shadow-md z-50 flex items-center justify-center text-2xl text-white border-2 border-white/10"
        >
          <span className="relative flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 0a1 1 0 100 2 1 1 0 000-2z" />
              <rect x="5" y="8" width="14" height="12" rx="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h2m14 0h2" strokeLinecap="round" />
              <circle cx="9" cy="13" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
              <path d="M9 17h6" strokeLinecap="round" />
            </svg>
          </span>
        </motion.button>
      )}

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-slate-900 z-40 flex flex-col border-l border-slate-800 shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 0a1 1 0 100 2 1 1 0 000-2z" />
                    <rect x="5" y="8" width="14" height="12" rx="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 13h2m14 0h2" strokeLinecap="round" />
                    <circle cx="9" cy="13" r="1" fill="currentColor" />
                    <circle cx="15" cy="13" r="1" fill="currentColor" />
                    <path d="M9 17h6" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-white">PATH Assistant</h3>
                  <p className="text-xs text-emerald-400 font-bold">{isThinking ? 'Thinking...' : 'Online'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
                  }`}>
                    {msg.sender === 'user' ? (
                      msg.text
                    ) : (
                      // The assistant replies in markdown (bold, bullets, links) —
                      // render it instead of showing raw asterisks.
                      <div className="space-y-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-white [&_a]:text-emerald-400 [&_a]:underline">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                onClick={(e) => {
                                  // Internal routes navigate in-app; external links open safely.
                                  if (href && href.startsWith('/')) {
                                    e.preventDefault();
                                    navigate(href);
                                  }
                                }}
                                target={href && href.startsWith('/') ? undefined : '_blank'}
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 mx-1">
                    {msg.sender === 'user' ? 'You' : 'Assistant'}
                  </span>
                </motion.div>
              ))}
              {isThinking && (
                <div className="flex gap-1 p-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-.3s]" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-.5s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isThinking}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isThinking}
                className="bg-emerald-600 hover:bg-emerald-500 p-2.5 rounded-xl text-white disabled:opacity-50 transition-colors"
              >
                {isThinking ? '...' : '➤'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
