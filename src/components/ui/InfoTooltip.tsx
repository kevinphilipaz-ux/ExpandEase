import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  /** Explanation text (e.g. from calculationExplanations). Shown in tooltip. */
  content: string;
  /** Accessible label for the icon (e.g. "How we calculate ROI") */
  label: string;
  className?: string;
}

const TOOLTIP_WIDTH = 288;
const GAP = 6;

/**
 * Small (i) icon that shows a tooltip with "how we calculate" copy.
 * Renders tooltip in a portal so it's never clipped by overflow/truncate.
 * Use with CALCULATION_TOOLTIPS so tooltips and chatbot share the same wording.
 */
export function InfoTooltip({ content, label, className = '' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!visible || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferAbove = spaceAbove >= spaceBelow;
    const tooltipHeight = 120;
    let top: number;
    if (preferAbove && spaceAbove >= tooltipHeight + GAP) {
      top = rect.top - tooltipHeight - GAP;
    } else {
      top = rect.bottom + GAP;
    }
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 8));
    setPosition({ top, left });
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex shrink-0 ${className}`}
    >
      <button
        ref={buttonRef}
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
      {visible && position && typeof document !== 'undefined' && document.body &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] w-72 max-w-[calc(100vw-2rem)] p-3 text-left text-sm text-purple-100 bg-purple-900/95 border border-white/20 rounded-lg shadow-xl backdrop-blur"
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}
