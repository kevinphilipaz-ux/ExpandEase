import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, XCircle, ArrowRight, DollarSign, FileText, Shield, Star, ChevronDown, ChevronUp } from 'lucide-react';

const BENEFITS = [
  {
    icon: Star,
    title: 'Qualified Inbound Leads',
    desc: 'Homeowners arrive pre-analyzed, pre-approved, and motivated. No tire-kickers, no cold calls, no wasted site visits.',
  },
  {
    icon: FileText,
    title: 'Zero-Question Bid',
    desc: 'The full SOW is ready before you shake hands. Every finish, fixture, and system decision has been made. You know exactly what you\'re building.',
  },
  {
    icon: DollarSign,
    title: 'Guaranteed Milestone Payments',
    desc: 'Funds are held by the lender and released automatically when milestones are verified. You never chase a payment again.',
  },
  {
    icon: Shield,
    title: 'Platform Certified Badge',
    desc: 'Verified contractors stand out. The badge signals to homeowners that you operate with transparency, fixed pricing, and accountability.',
  },
];

const OBJECTIONS = [
  {
    q: '"This sounds like I lose control of the project."',
    a: 'You control the build. We control the paperwork. Every construction decision is yours. What we standardize is the intake, the contract, and the payment flow — the stuff that causes disputes, not the craft.',
  },
  {
    q: '"What if the homeowner changes their mind mid-project?"',
    a: 'Every change goes through our platform. You document it, the homeowner approves it, the lender signs off on it. You\'re protected. No undocumented verbal agreements. No payment disputes. Every change order is locked before work continues.',
  },
  {
    q: '"What\'s the catch?"',
    a: 'We charge 1–2% of the project total as a platform fee. In exchange you get a qualified lead, a fully scoped contract, and guaranteed payment. Compare that to lead gen services that charge $50–200 per unqualified click and disappear after the handoff.',
  },
];

type FormData = {
  name: string; company: string; license: string; years: string;
  areas: string[]; email: string; phone: string;
};

const AREAS = ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Gilbert', 'Glendale', 'Peoria'];

export function ForContractors() {
  const [form, setForm] = useState<FormData>({ name: '', company: '', license: '', years: '', areas: [], email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openObj, setOpenObj] = useState<number | null>(null);

  const toggleArea = (area: string) => {
    setForm(f => ({ ...f, areas: f.areas.includes(area) ? f.areas.filter(a => a !== area) : [...f.areas, area] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('https://formspree.io/f/REPLACE_WITH_FORM_ID', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, areas: form.areas.join(', '), _subject: 'Contractor Application — ExpandEase' }),
      });
    } catch (_) { /* graceful */ }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0612] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0612]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">ExpandEase</span>
          </Link>
          <a href="#apply" className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-sm font-bold transition-opacity hover:opacity-90">
            Apply to Join
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
            For Licensed Contractors
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            The deal pipeline<br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">you've always wanted.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            We send you pre-qualified homeowners with a complete scope of work. You show up, sign, and build. No chasing leads. No collections risk. No surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#apply" className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg flex items-center justify-center gap-2 group hover:opacity-90 transition-opacity">
              Apply to Join the Network <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#how-it-works" className="px-8 py-4 rounded-xl border border-white/20 font-bold text-lg hover:bg-white/5 transition-colors">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Old Way vs New Way */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Two ways to run your business.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-400 font-bold uppercase text-xs tracking-widest mb-4">The Old Way</div>
              {['Cold outreach and referral chasing', 'Vague scopes, ballpark estimates', 'Scope creep erodes your margin', 'Payment fights at every milestone', 'Unpredictable pipeline month to month'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5">
                  <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-b from-purple-900/40 to-pink-900/20 rounded-2xl p-8 border border-pink-500/30">
              <div className="text-pink-400 font-bold uppercase text-xs tracking-widest mb-4">The ExpandEase Way</div>
              {['Inbound leads — homeowners come to you', 'Fixed-price contracts with complete SOW', 'Change orders locked before work continues', 'Milestone payments released automatically', 'Consistent, predictable project pipeline'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">How it works.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Get Matched', desc: 'We send you a project with a full homeowner-approved SOW. Review the scope and accept or decline — in under an hour, no site visit required.' },
              { n: '02', title: 'Build with Certainty', desc: 'Fixed-price contract from day one. No scope creep. All change orders go through the platform with lender and homeowner approval before any work changes.' },
              { n: '03', title: 'Get Paid on Milestones', desc: 'The lender holds funds in escrow. You hit a verified milestone, the funds release automatically. No invoicing, no chasing, no excuses.' },
            ].map(s => (
              <div key={s.n} className="relative">
                <div className="text-7xl font-black text-white/5 absolute top-0 right-0">{s.n}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-white font-bold mb-5">{s.n}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Why contractors choose us.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {BENEFITS.map(b => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-pink-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Objection Crushers */}
      <section className="py-20 px-4 bg-purple-950/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">We've heard the objections.</h2>
          <div className="space-y-4">
            {OBJECTIONS.map((o, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <button onClick={() => setOpenObj(openObj === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-semibold text-gray-200 italic">{o.q}</span>
                  {openObj === i ? <ChevronUp size={18} className="text-pink-400 shrink-0 ml-4" /> : <ChevronDown size={18} className="text-gray-400 shrink-0 ml-4" />}
                </button>
                {openObj === i && (
                  <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-white/10 pt-4">{o.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Apply to join the network.</h2>
            <p className="text-gray-400">We review every application. Expect to hear from us within 48 hours.</p>
          </div>
          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Application received.</h3>
              <p className="text-gray-400">We'll review your information and reach out within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 rounded-2xl border border-white/10 p-8">
              {[
                { label: 'Your Name', key: 'name', placeholder: 'John Smith' },
                { label: 'Company Name', key: 'company', placeholder: 'Smith Construction LLC' },
                { label: 'License Number', key: 'license', placeholder: 'AZ ROC #...' },
                { label: 'Years in Business', key: 'years', placeholder: '8' },
                { label: 'Email', key: 'email', placeholder: 'john@smithconstruction.com' },
                { label: 'Phone', key: 'phone', placeholder: '(602) 555-0100' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{f.label}</label>
                  <input
                    type="text" placeholder={f.placeholder} required
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Service Area (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(area => (
                    <button key={area} type="button" onClick={() => toggleArea(area)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${form.areas.includes(area) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-white/20 text-gray-400 hover:border-white/40'}`}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Apply to Join the Network →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-black py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Home className="text-pink-500" size={20} />
            <span className="font-bold text-white">ExpandEase</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/for-lenders" className="hover:text-white transition-colors">For Lenders</Link>
          </div>
          <p className="text-xs text-gray-600">© 2025 ExpandEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
