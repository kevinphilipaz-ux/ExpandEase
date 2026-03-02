import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
interface LoadingTransitionProps {
  onComplete: () => void;
}
export function LoadingTransition({ onComplete }: LoadingTransitionProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
  'Analyzing Zoning...',
  'Pricing Materials in Phoenix...',
  'Checking Lenders...',
  'Building Your Report...'];

  useEffect(() => {
    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);
    // Complete after 3.2 seconds (4 messages * 800ms)
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 3200);
    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete, messages.length]);
  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Pulsing background glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-pink-500/30 blur-3xl rounded-full" />


        {/* Spinner */}
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="relative z-10 mb-8">

          <Loader2 size={64} className="text-pink-500" />
        </motion.div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-4">Calculating...</h2>

      <div className="h-8 relative w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: -10
            }}
            transition={{
              duration: 0.2
            }}
            className="text-purple-300 text-lg absolute w-full">

            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>);

}