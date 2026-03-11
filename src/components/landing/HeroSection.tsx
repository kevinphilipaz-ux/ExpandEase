import React, { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type FunnelStep = 1 | 2 | 3;

const scopeOptions = [
  {
    id: 'kitchen',
    label: 'Luxury Kitchen Overhaul',
    description: 'Stone, custom cabinetry, hidden appliances.',
    image:
      'https://images.pexels.com/photos/37347/modern-kitchen-luxury-interior-37347.jpeg?auto=compress&w=1200'
  },
  {
    id: 'suite',
    label: 'French Country Master Suite Addition',
    description: 'Vaulted ceilings, spa bath, private terrace.',
    image:
      'https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&w=1200'
  },
  {
    id: 'adu',
    label: 'Backyard ADU / Guest House',
    description: 'Perfect for guests, in-laws, or rental.',
    image:
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&w=1200'
  },
  {
    id: 'full-gut',
    label: 'Full Gut Remodel',
    description: 'Reimagine everything. Layout, finishes, systems.',
    image:
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&w=1200'
  }
];

export function HeroSection() {
  const [step, setStep] = useState<FunnelStep>(1);
  const [address, setAddress] = useState('');
  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStep(2);
  };

  const handleScopeSelect = (id: string) => {
    setSelectedScope(id);
    setTimeout(() => setStep(3), 220);
  };

  const stepVariants = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.98 }
  };

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#05030A] px-4 pb-16 pt-20 md:px-8">
      {/* Background gradient / glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/40 via-purple-500/40 to-sky-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-400/25 via-purple-400/30 to-pink-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.09),_transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-12 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Dream Outcome Copy */}
        <div className="max-w-xl space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Don&apos;t Move.</span>
              <span className="block bg-gradient-to-r from-fuchsia-400 via-purple-300 to-sky-300 bg-clip-text text-transparent">
                Improve.
              </span>
            </h1>

            <p className="max-w-xl text-sm text-zinc-300 sm:text-base">
              Keep your current low mortgage rate and your neighborhood. Transform your
              home into your dream space without the massive penalties of moving.
            </p>

            <p className="text-sm text-zinc-400">
              Phoenix Homeowners save thousands monthly and can average{' '}
              <span className="font-mono font-medium text-emerald-400">$60k+ upfront</span>
              {' '}in savings vs. moving. Transform your home.
            </p>

            <p className="max-w-lg text-xs text-zinc-400 sm:text-sm">
              Skip the 7% current rates and the 6% agent commissions. See your home&apos;s
              renovation potential and real-time cost estimates before you commit.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            No credit impact to see estimates.
          </p>
        </div>

        {/* Right: Savings calculator — illuminated AI-style draw */}
        <div className="relative w-full max-w-md">
          {/* Outer glow / halo */}
          <div className="absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-br from-fuchsia-500/50 via-purple-500/40 to-emerald-400/30 opacity-80 blur-sm" aria-hidden />
          <div className="absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-br from-fuchsia-400/30 via-purple-400/20 to-emerald-400/20 opacity-60" aria-hidden />
          <div
            id="scope-funnel"
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white shadow-[0_0_40px_rgba(168,85,247,0.15),0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-5 lg:p-6 ring-1 ring-white/5"
          >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-medium text-purple-200">
                EE
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                Your savings calculator
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    step >= s
                      ? 'bg-gradient-to-r from-fuchsia-400 via-purple-400 to-emerald-400'
                      : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className={`relative ${step === 1 ? 'min-h-0' : 'min-h-[260px]'}`}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                      Step 1 — Address
                    </p>
                    <p className="text-sm text-zinc-200">
                      Let&apos;s start with where you live in Scottsdale.
                    </p>
                  </div>

                  <form onSubmit={handleAddressSubmit} className="space-y-2">
                    <div className="relative">
                      {/* Address bar glow — 2x intensity */}
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/40 via-purple-500/30 to-emerald-500/20 opacity-100 blur-[4px]" aria-hidden />
                      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-fuchsia-400/50 via-purple-400/40 to-emerald-400/30 opacity-100" aria-hidden />
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full rounded-2xl border border-white/15 bg-black/40 px-10 py-3 text-sm text-white placeholder:text-zinc-500 shadow-inner outline-none ring-0 transition focus:border-fuchsia-400/50 focus:bg-black/50 focus:ring-2 focus:ring-fuchsia-400/30 focus:shadow-[0_0_40px_rgba(217,70,239,0.4)]"
                          placeholder="Enter your home address..."
                        />
                      </div>
                    </div>
                    <div className="relative">
                      {/* Continue bar glow — same style as address */}
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/40 via-purple-500/30 to-emerald-500/20 opacity-100 blur-[4px]" aria-hidden />
                      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-fuchsia-400/50 via-purple-400/40 to-emerald-400/30 opacity-100" aria-hidden />
                      <button
                        type="submit"
                        className="relative w-full inline-flex items-center justify-center rounded-2xl bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.25)]"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                      Step 2 — Dream Scope
                    </p>
                    <p className="text-sm text-zinc-200">
                      Choose the upgrade that feels most like your dream outcome.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {scopeOptions.map((option) => {
                      const isActive = selectedScope === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleScopeSelect(option.id)}
                          className={`group flex flex-col overflow-hidden rounded-2xl border bg-white/5 text-left text-xs transition focus:outline-none ${
                            isActive
                              ? 'border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.7)]'
                              : 'border-white/8 hover:border-purple-300/60 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className="relative h-20 w-full overflow-hidden"
                            style={{
                              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1)), url(${option.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <div className="absolute inset-0 border-b border-white/10" />
                          </div>
                          <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
                            <span className="text-[11px] font-medium text-zinc-50">
                              {option.label}
                            </span>
                            <span className="line-clamp-2 text-[10px] text-zinc-400">
                              {option.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    We&apos;ll auto-calc cost, new value, and equity for your
                    neighborhood next.
                  </p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                      Step 3 — Financial Reality Check
                    </p>
                    <p className="text-sm text-zinc-200">
                      Here&apos;s the mock impact of your{' '}
                      {selectedScope
                        ? scopeOptions.find((o) => o.id === selectedScope)?.label
                        : 'renovation'}
                      .
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                    <div className="mb-3 text-[11px] text-zinc-400">
                      <span>
                        {address || 'Scottsdale, AZ — Sample Property'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-zinc-400">
                            Estimated Renovation Cost
                          </p>
                          <p className="font-mono text-lg text-white">$300,000</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-zinc-400">
                            Cost to Move (Comparable Home)
                          </p>
                          <p className="font-mono text-lg text-red-400 line-through">
                            $68,500 in dead fees
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                        <div>
                          <p className="text-[11px] text-emerald-300">
                            Net Upfront Savings
                          </p>
                          <p className="font-mono text-xl text-[#00FF00]">
                            $68,500
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-[10px] text-gray-500">
                      Estimates based on regional RSMeans data and average Maricopa County closing costs. Actuals may vary.
                    </p>

                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 px-4 py-2.5 text-xs font-medium text-white shadow-[0_0_30px_rgba(216,70,239,0.6)] transition hover:translate-y-0.5 hover:shadow-[0_0_40px_rgba(216,70,239,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <span>Get Your Free 3D Analysis</span>
                      <span className="flex items-center gap-1 text-[11px] text-pink-100">
                        <span>Lightning-fast</span>
                        <span aria-hidden>→</span>
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Social proof directly below interactive hook */}
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/40 p-3 text-xs text-zinc-300 shadow-inner">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
              <span>Real results, not just renderings.</span>
            </div>
            <p className="text-[11px] italic text-zinc-200">
              &quot;We increased our home&apos;s value by $340K for only $180K
              spent. The process was so smooth.&quot;
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              — Sarah &amp; Mike T. | Scottsdale, AZ
            </p>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}