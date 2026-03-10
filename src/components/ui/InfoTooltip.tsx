import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  /** Explanation text (e.g. from calculationExplanations). Shown in tooltip. */
  content: string;
  /** Accessible label for the icon (e.g. "How we calculate ROI") */
  label: string;
  className?: string;
}

/**
 * Small (i) icon that shows a tooltip with "how we calculate" copy.
 * Use with CALCULATION_TOOLTIPS so tooltips and chatbot share the same wording.
 */
export function InfoTooltip({ content, label, className = '' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex ${className}`}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={visible}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-purple-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      {visible && (
        <div
          role="tooltip"
          className="absolute left-0 bottom-full mb-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] p-3 text-left text-sm text-purple-100 bg-purple-900/95 border border-white/20 rounded-lg shadow-xl backdrop-blur"
          style={{ left: 0 }}
        >
          {content}
        </div>
      )}
    </span>
  );
}
