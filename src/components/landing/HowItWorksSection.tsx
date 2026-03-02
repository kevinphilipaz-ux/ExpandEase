import React from 'react';
import { Eye, FileText, Wallet } from 'lucide-react';
export function HowItWorksSection() {
  const steps = [
  {
    icon: <Eye size={32} className="text-pink-400" />,
    title: 'The Vision',
    description:
    'Define your dream scope using our curated tools. Get an industry-leading cost estimate instantly.'
  },
  {
    icon: <FileText size={32} className="text-purple-400" />,
    title: 'The Proof',
    description:
    'We generate a feasibility study showing exactly how your renovation increases your net worth and fits your monthly cash flow.'
  },
  {
    icon: <Wallet size={32} className="text-blue-400" />,
    title: 'The Capital',
    description:
    "We originate an 'As-Completed' value loan. You get the cash for the future value of your home, not the current value."
  }];

  return (
    <section className="py-24 px-4 md:px-8 bg-purple-900 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-purple-200">
            From dream to done in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500/0 via-pink-500/50 to-pink-500/0"></div>

          {steps.map((step, index) =>
          <div
            key={index}
            className="relative z-10 flex flex-col items-center text-center group">

              <div className="w-24 h-24 rounded-2xl bg-purple-800 border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300 group-hover:border-pink-500/50 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-purple-200 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>);

}