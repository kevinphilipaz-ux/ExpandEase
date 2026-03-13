import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowRight, Sparkles, Shield, X } from 'lucide-react';
import { useProjectOptional } from '../context/ProjectContext';

interface ContactCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (email: string, phone: string) => void;
  /** Optional: pre-fill from existing project data */
  initialEmail?: string;
  initialPhone?: string;
}

export function ContactCaptureModal({
  isOpen,
  onClose,
  onComplete,
  initialEmail = '',
  initialPhone = '',
}: ContactCaptureModalProps) {
  const projectCtx = useProjectOptional();
  const firstName = projectCtx?.project?.homeowner?.firstName || '';

  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setPhoneError('');
  }, [formatPhone]);

  const validate = useCallback(() => {
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Please enter a 10-digit phone number');
      valid = false;
    } else {
      setPhoneError('');
    }
    return valid;
  }, [email, phone]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Persist to project context
    if (projectCtx) {
      projectCtx.updateProject({
        homeowner: {
          ...projectCtx.project.homeowner,
          email: email.trim(),
          phone: phone.trim(),
        },
      });
    }

    onComplete(email.trim(), phone.trim());
  }, [email, phone, validate, projectCtx, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-br from-purple-900/95 to-purple-950/95 shadow-2xl backdrop-blur-xl"
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
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                <Sparkles size={20} className="text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {firstName ? `Nice work, ${firstName}!` : 'Nice work!'}
                </h2>
              </div>
            </div>
            <p className="text-sm text-purple-200/80 mb-6 leading-relaxed">
              Your wishlist is looking great. Save your progress so you can come back anytime — and share it with your family when you're ready.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="capture-email" className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    id="capture-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-purple-400/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                  />
                </div>
                {emailError && <p className="text-rose-400 text-xs mt-1">{emailError}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="capture-phone" className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    id="capture-phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-purple-400/50 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                  />
                </div>
                {phoneError && <p className="text-rose-400 text-xs mt-1">{phoneError}</p>}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold transition-all shadow-lg shadow-pink-500/20"
              >
                Save & Continue
                <ArrowRight size={18} />
              </motion.button>
            </form>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-2 mt-4 text-purple-400/60 text-xs">
              <Shield size={12} />
              <span>We'll only reach out if we find ways to save you money.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
