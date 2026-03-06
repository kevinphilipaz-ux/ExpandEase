import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
export function ChatBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handlePillClick = () => {
    if (isOpen) {
      setIsChatOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  if (isChatOpen) {
    return (
      <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] max-w-80 sm:w-80 h-96 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 flex flex-col safe-area-bottom safe-area-right">
        <div className="flex items-center justify-between p-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-pink-300" size={18} />
            <h3 className="font-medium">Let's talk about options</h3>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="p-2 -m-2 text-purple-200 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close chat">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
          <div className="bg-white/5 p-2 rounded-lg mb-3">
            <p className="text-sm">
              I can help you explore financing options for your home
              improvements. What would you like to know more about?
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-white/20">
          <div className="bg-white/5 rounded-lg flex items-center">
            <input type="text" placeholder="Type your message..." className="bg-transparent p-2 flex-1 focus:outline-none text-sm" />
            <button className="p-2 text-pink-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Send">
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`fixed bottom-4 right-4 safe-area-bottom safe-area-right bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer overflow-hidden ${isOpen ? 'w-60' : 'w-12'} h-12`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={handlePillClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePillClick(); } }}
      aria-label={isOpen ? "Let's talk about options - click to open chat" : 'Open chat'}
    >
      <MessageSquare className="text-white absolute left-3" size={20} />
      <span className={`text-white font-medium ml-8 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        Let's talk about options
      </span>
    </div>
  );
}