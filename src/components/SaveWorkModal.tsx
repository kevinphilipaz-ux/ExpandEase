import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthOptional } from '../context/AuthContext';

interface SaveWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveWorkModal({ isOpen, onClose }: SaveWorkModalProps) {
  const auth = useAuthOptional();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googlePopupOpen, setGooglePopupOpen] = useState(false);

  const isConfigured = auth?.isConfigured ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!auth) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await auth.signUpWithEmail(email.trim(), password);
        if (err) {
          setError(err.message ?? 'Could not create account');
          return;
        }
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail('');
          setPassword('');
        }, 800);
      } else {
        const { error: err } = await auth.signInWithEmail(email.trim(), password);
        if (err) {
          setError(err.message ?? 'Could not sign in');
          return;
        }
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail('');
          setPassword('');
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!auth) return;
    setGooglePopupOpen(true);
    try {
      await auth.signInWithGoogle();
      onClose();
    } finally {
      setGooglePopupOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-purple-900/95 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-purple-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-1">Save your progress</h2>
            <p className="text-sm text-purple-300/90 mb-6">
              Create an account to save your work on any device. No commitment—just pick up where you left off.
            </p>

            {!isConfigured ? (
              <p className="text-sm text-amber-300/90 mb-4">
                Save feature is not configured. Add Supabase credentials to enable cloud save.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={googlePopupOpen}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                  {googlePopupOpen ? (
                    <>
                      <Loader2 size={20} className="animate-spin shrink-0" />
                      <span>Complete sign-in in the popup window…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/20" />
                  <span className="text-xs text-purple-400">or</span>
                  <div className="flex-1 h-px bg-white/20" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="save-work-email" className="block text-xs font-medium text-purple-300 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        id="save-work-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-400/60 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="save-work-password" className="block text-xs font-medium text-purple-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        id="save-work-password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-purple-400/60 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-rose-400" role="alert">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-sm text-emerald-400">
                      {mode === 'signup' ? 'Account created. Your work is saved.' : 'Signed in. Your work is saved.'}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : null}
                    {mode === 'signup' ? 'Create account & save' : 'Sign in & save'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
                    setError(null);
                  }}
                  className="mt-4 w-full text-center text-sm text-purple-300 hover:text-white transition-colors"
                >
                  {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full text-center text-sm text-purple-400 hover:text-white transition-colors"
            >
              Continue as guest
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
