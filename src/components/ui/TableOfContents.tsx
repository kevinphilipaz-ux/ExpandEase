/**
 * TableOfContents — Sticky right-rail on desktop, floating icon + drawer on mobile.
 *
 * Usage:
 *   <TableOfContents items={[{ id: 'hero', label: 'Overview' }, ...]} />
 *
 * Each `id` must match a section's `id` attribute in the DOM.
 * The component uses IntersectionObserver to track which section is in view.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { List, X, ChevronRight } from 'lucide-react';

export interface TocItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface Props {
  items: TocItem[];
  /** Accent color class prefix, e.g. 'pink' → text-pink-400, bg-pink-500 */
  accent?: string;
  /** Offset from top when scrolling to a section (px). Default 80 */
  scrollOffset?: number;
  /** 'dark' for dark pages (default), 'light' for white bg pages like ContractorReview */
  theme?: 'dark' | 'light';
}

export function TableOfContents({ items, accent = 'pink', scrollOffset = 80, theme = 'dark' }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Show the TOC only after scrolling past the first viewport
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.25);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const callback: IntersectionObserverCallback = (entries) => {
      // Find the entry closest to the top of the viewport that's intersecting
      const intersecting = entries.filter(e => e.isIntersecting);
      if (intersecting.length > 0) {
        // Pick the one with the smallest top value (closest to top of screen)
        const top = intersecting.reduce((best, e) =>
          e.boundingClientRect.top < best.boundingClientRect.top ? e : best
        );
        setActiveId(top.target.id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: `-${scrollOffset}px 0px -50% 0px`,
      threshold: 0,
    });

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items, scrollOffset]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setActiveId(id);
    setMobileOpen(false);
  }, [scrollOffset]);

  if (!visible) return null;

  const activeIdx = items.findIndex(i => i.id === activeId);
  const progress = items.length > 1 ? (activeIdx / (items.length - 1)) * 100 : 0;

  return (
    <>
      {/* ─── Desktop: right-side sticky rail ─── */}
      <nav
        className="hidden lg:block fixed right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40 w-52"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
        aria-label="Table of contents"
      >
        <div className={`relative backdrop-blur-xl rounded-2xl p-4 ${
          theme === 'light'
            ? 'bg-white/90 border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            : 'bg-white/[0.06] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
        }`}>
          {/* Progress track */}
          <div className={`absolute left-4 top-12 bottom-4 w-[2px] rounded-full overflow-hidden ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'}`}>
            <div
              className={`w-full bg-${accent}-500 rounded-full transition-all duration-300`}
              style={{ height: `${progress}%` }}
            />
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 pl-4">On this page</p>

          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = item.id === activeId;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className={`
                      w-full text-left pl-4 pr-2 py-1.5 rounded-lg text-xs leading-snug transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? `text-${accent}-${theme === 'light' ? '600' : '400'} font-semibold bg-${accent}-500/10`
                        : theme === 'light'
                          ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Dot indicator */}
                    <span className={`
                      w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200
                      ${isActive ? `bg-${accent}-${theme === 'light' ? '600' : '400'}` : theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}
                    `} />
                    {Icon && <Icon size={12} className="shrink-0 opacity-60" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ─── Mobile: floating button + drawer ─── */}
      {/* Floating button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`
          lg:hidden fixed bottom-6 right-4 z-50 w-11 h-11 rounded-full
          bg-gradient-to-br from-${accent}-600 to-purple-600 text-white
          shadow-lg shadow-${accent}-600/30 flex items-center justify-center
          transition-all duration-300
          ${visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
        `}
        aria-label="Open table of contents"
      >
        <List size={18} />
        {/* Tiny progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <circle
            cx="22" cy="22" r="20" fill="none"
            stroke="rgba(255,255,255,0.7)" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      </button>

      {/* Drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Drawer from bottom */}
          <div
            className="absolute bottom-0 inset-x-0 bg-[#0a0612] border-t border-white/10 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">On this page</p>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = item.id === activeId;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all
                        ${isActive
                          ? `text-${accent}-400 font-semibold bg-${accent}-500/10 border border-${accent}-500/20`
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }
                      `}
                    >
                      {Icon ? (
                        <Icon size={16} className={isActive ? `text-${accent}-400` : 'text-gray-600'} />
                      ) : (
                        <ChevronRight size={14} className={isActive ? `text-${accent}-400` : 'text-gray-600'} />
                      )}
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Progress bar at bottom */}
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-${accent}-500 to-purple-500 rounded-full transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
