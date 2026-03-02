import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
export function ChatBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  if (isChatOpen) {
    return <div className="fixed bottom-4 right-4 w-80 h-96 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-pink-300" size={18} />
            <h3 className="font-medium">Let's talk about options</h3>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="text-purple-200 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
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
            <button className="p-2 text-pink-300 hover:text-white transition-colors">
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      </div>;
  }
  return <div className={`fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg transition-all duration-300 ${isOpen ? 'w-60' : 'w-12'} h-12 flex items-center justify-center cursor-pointer overflow-hidden`} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} onClick={() => setIsChatOpen(true)}>
      <MessageSquare className="text-white absolute left-3" size={20} />
      <span className={`text-white font-medium ml-8 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        Let's talk about options
      </span>
    </div>;
}