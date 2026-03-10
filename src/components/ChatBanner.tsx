import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useProjectOptional } from '../context/ProjectContext';
import { buildProjectSummaryForChat } from '../utils/chatbotContext';
import { sendChat, type ChatMessage } from '../services/chatApi';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "The most intelligent home renovation analyst ever created—with full context on your project, our calculations, and your numbers. I'm here to answer your questions and advise you on your future dream home. What would you like to know?",
};

const ANALYZING_MESSAGE =
  "I'm reviewing the structure of your renovation so far and pulling together everything I need to give you the best answer possible.";

export function ChatBanner() {
  const projectCtx = useProjectOptional();
  const projectSummary = buildProjectSummaryForChat(projectCtx?.project ?? null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasWelcomed = messages.some((m) => m.role === 'assistant');
  const displayMessages = hasWelcomed ? messages : [WELCOME_MESSAGE];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  useEffect(() => {
    if (isChatOpen) {
      inputRef.current?.focus();
    }
  }, [isChatOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const { message } = await sendChat({
        messages: nextMessages,
        projectSummary,
      });
      setMessages((prev) => [...prev, message]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Something went wrong. Try again.';
      setError(errMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry — ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isChatOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-80 sm:w-80 h-[28rem] rounded-2xl shadow-2xl flex flex-col safe-area-bottom safe-area-right overflow-hidden bg-gradient-to-b from-pink-950/95 via-purple-950/95 to-purple-950/98 backdrop-blur-xl border border-white/20">
        <div className="flex items-center justify-between p-3 border-b border-white/15 shrink-0 bg-black/20">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="text-pink-300 shrink-0" size={18} />
            <h3 className="font-semibold text-white tracking-tight">Dream Home Analyst</h3>
            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400/90">
              <span
                className="relative flex h-2 w-2"
                aria-hidden
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span>Live</span>
            </span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-2 -m-2 text-purple-200 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-gradient-to-b from-pink-950/40 via-transparent to-purple-950/60">
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-pink-500/35 text-white border border-pink-400/20'
                    : 'bg-white/10 text-purple-100 border border-white/15 backdrop-blur-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl px-3.5 py-3 bg-white/10 border border-white/15 backdrop-blur-sm text-purple-200 text-sm space-y-2 max-w-[90%]"
              >
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin shrink-0 text-pink-300" />
                  <span className="font-medium">Analyzing…</span>
                </div>
                <p className="text-purple-200/90 text-xs leading-relaxed pl-6">
                  {ANALYZING_MESSAGE}
                </p>
              </motion.div>
            </div>
          )}
          {error && (
            <p className="text-amber-300 text-xs">Chat couldn’t load. Check that the chat server is running and OPENAI_API_KEY is set.</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-white/15 shrink-0 bg-black/20">
          <div className="bg-white/5 rounded-xl flex items-center gap-1 border border-white/15 focus-within:border-pink-400/40 focus-within:ring-1 focus-within:ring-pink-400/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about calculations, roofing, flooring, affordability…"
              className="bg-transparent p-2.5 flex-1 focus:outline-none text-sm placeholder:text-purple-400/60"
              disabled={loading}
              aria-label="Message"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2 text-pink-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10"
              aria-label="Send"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => setIsChatOpen(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-4 right-4 z-50 safe-area-bottom safe-area-right bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg min-w-[52px] min-h-[52px] flex items-center justify-center cursor-pointer overflow-hidden transition-[width] duration-300 ${isHovered ? 'w-56' : 'w-[52px]'} h-[52px]`}
      aria-label={isHovered ? "Let's talk about options — click to open chat" : 'Open chat'}
      animate={isHovered ? {} : { opacity: [1, 0.88, 1] }}
      transition={
        isHovered ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <MessageSquare className="text-white shrink-0" size={24} />
      <span
        className={`text-white font-medium ml-2 whitespace-nowrap transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
        }`}
      >
        Let's talk about options
      </span>
    </motion.button>
  );
}
