import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import {
    CAD_PACKAGE_PRICE,
    CAD_PACKAGE_US_PRICE_HIGH,
    CAD_TURNAROUND,
    CAD_DELIVERABLES,
} from '../config/renovationDefaults';

interface CADCheckoutModalProps {
    onClose: () => void;
    isOpen: boolean;
}

export function CADCheckoutModal({ onClose, isOpen }: CADCheckoutModalProps) {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setStep(2);
        }, 2000);
    };

    const usHigh = `$${(CAD_PACKAGE_US_PRICE_HIGH / 1000).toFixed(0)}K`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"
                >
                    <X size={20} className="text-gray-500" />
                </button>

                {/* Left Side: Marketing / Description (Hidden on mobile for space) */}
                <div className="hidden md:flex flex-col justify-between w-2/5 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500 via-transparent to-transparent" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-pink-300 mb-6 border border-white/10">
                            <Sparkles size={14} /> Full Design Package
                        </div>
                        <h3 className="text-3xl font-bold mb-4 font-serif">See your renovation before you build it.</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6">
                            Our dedicated design team creates a complete visualization package for your renovation — photorealistic 3D renders, color elevations, and floor plans, all printed large-format and mailed to your door.
                        </p>

                        <ul className="space-y-3">
                            {CAD_DELIVERABLES.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                    <CheckCircle2 size={18} className="text-pink-400 shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                            <li className="flex items-start gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-pink-400 shrink-0 mt-0.5" />
                                Delivered in {CAD_TURNAROUND}
                            </li>
                        </ul>
                    </div>

                    <div className="relative z-10 p-4 bg-white/5 rounded-xl border border-white/10 italic text-sm text-gray-400">
                        "Seeing the 3D render completely changed our confidence in the addition. We knew exactly what we were paying for."
                    </div>
                </div>

                {/* Right Side: Checkout Form */}
                <div className="w-full md:w-3/5 p-6 md:p-8 bg-white flex flex-col justify-center">
                    {step === 1 ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Design Package</h2>
                                    <p className="text-gray-500 text-sm">Coming soon — payment will be available when we launch. Preview below.</p>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden">
                                    <div className="absolute -top-0 -right-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-bl-xl shadow-lg">$8,000 Value!</div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900">3D Renders, Elevations & Floor Plans</h4>
                                            <p className="text-sm text-gray-500 mt-1">Photorealistic package delivered in {CAD_TURNAROUND}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">${CAD_PACKAGE_PRICE}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-200">
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{usHigh}+ Value</span>
                                        <span className="text-xs text-gray-400">yours at cost</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Card Information</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono" />
                                        </div>
                                        <div>
                                            <input type="text" placeholder="CVC" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <AlertCircle size={20} />
                                        </motion.div>
                                    ) : (
                                        <>Pay ${CAD_PACKAGE_PRICE}.00</>
                                    )}
                                </button>

                                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                                    <Lock size={12} /> Payment coming soon — no charge today
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h2>
                                <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                                    Our design team has been notified. You'll receive your complete visualization package — 3D renders, color elevations, and floor plans — within {CAD_TURNAROUND}. Large-format prints will follow by mail.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-colors"
                                >
                                    Return to Dashboard
                                </button>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
