import React, { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await fetch('https://formspree.io/f/REPLACE_WITH_FORM_ID', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, _subject: 'Waitlist Signup — ExpandEase' }),
      });
      setStatus('success');
    } catch (_) {
      setStatus('error');
    }
  };

  return (
    <section className="py-20 px-4 relative border-t border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(168,85,247,0.07),_transparent_65%)] animate-pulse-opacity" aria-hidden style={{ animationDuration: '6s' }} />
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm font-medium mb-6">
          Coming to Your City
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Not in our service area yet?</h2>
        <p className="text-gray-400 mb-8">Join the waitlist and we&apos;ll let you know when we launch in your city. No spam. No credit card.</p>
        {status === 'success' ? (
          <div className="flex items-center justify-center gap-3 text-emerald-400 font-semibold text-lg">
            <CheckCircle size={24} /> You're on the list. We'll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button type="submit" disabled={status === 'loading'}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap">
              {status === 'loading' ? 'Joining...' : <><span>Join Waitlist</span><ArrowRight size={16} /></>}
            </button>
          </form>
        )}
        {status === 'error' && <p className="text-red-400 text-sm mt-3">Something went wrong. Try again or email us directly.</p>}
      </div>
    </section>
  );
}
