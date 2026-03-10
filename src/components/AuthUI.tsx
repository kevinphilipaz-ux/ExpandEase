import React, { useState } from 'react';
import { useAuthOptional } from '../context/AuthContext';
import { LogIn, LogOut, User } from 'lucide-react';

/** Compact auth controls: Sign in with Google, Continue as guest (no-op), or user email + Sign out. */
export function AuthUI() {
  const auth = useAuthOptional();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!auth?.isConfigured) {
    return (
      <a href="#" className="hover:text-white transition-colors py-2 min-h-[44px] flex items-center gap-2 text-sm text-gray-400">
        <LogIn size={16} /> Login
      </a>
    );
  }

  if (auth.isLoading) {
    return <span className="text-sm text-gray-500 py-2">...</span>;
  }

  if (auth.user) {
    const email = auth.user.email ?? 'Signed in';
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 py-2 min-h-[44px] text-sm text-gray-400 hover:text-white transition-colors"
        >
          <User size={16} />
          <span className="max-w-[140px] truncate">{email}</span>
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              aria-hidden
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 py-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-20">
              <p className="px-3 py-1 text-xs text-gray-500 truncate" title={email}>
                {email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  auth.signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => auth.signInWithGoogle()}
      className="flex items-center gap-2 py-2 min-h-[44px] text-sm text-gray-400 hover:text-white transition-colors"
    >
      <LogIn size={16} /> Sign in with Google
    </button>
  );
}
