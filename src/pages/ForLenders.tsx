import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, XCircle, ArrowRight, Shield, TrendingUp, FileText, Users, ChevronDown, ChevronUp } from 'lucide-react';

const BENEFITS = [
  {
    icon: FileText,
    title: 'De-Risked Loan Files',
    desc: 'Every file includes a fixed-price contractor contract, complete material and labor SOW, and documented homeowner selections. Your underwriters have everything they need before they open the file.',
  },
  {
    icon: Shield,
    title: 'RESPA-Compliant Revenue Share',
    desc: 'Our fee structure is built on bona-fide services rendered. We can walk through the compliance structure with your legal team — we\'ve already done that work.',
  },
  {
    icon: Users,
    title: 'Co-Marketing Opportunity',
    desc: 'White-label the platform. "Powered by [Your Credit Union]." Reach equity-rich members who are locked into low rates and actively looking for renovation financing.',
  },
  {
    icon: TrendingUp,
    title: 'Fast Underwriting',
    desc: 'Pre-vetted borrowers, pre-vetted contractors, and a complete project package. Your underwriters move fast because the risk has already been removed.',
  },
];

const STATS = [
  { value: '$280K', label: 'Average loan size' },
  { value: '30 Days', label: 'Target approval timeline' },
  { value: '95%+', label: 'SOW accuracy before funding' },
  { value: '55+', label: 'Phoenix-area credit unions' },
];

const OBJECTIONS = [
  {
    q: '"How do we know the contractors are legitimate?"',
    a: 'Every contractor in our network is licensed, insured, and vetted before their first project. We verify their license with the Arizona Registrar of Contractors, confirm insurance, and review their project history. We monitor their standing throughout the relationship.',
  },
  {
    q: '"What about regulatory risk?"',
    a: 'Our revenue model is structured around bona-fide services rendered — borrower verification, contractor vetting, and Golden Record documentation — consistent with RESPA Section 8. We provide full compliance documentation and are happy to engage with your legal team.',
  },
  {
    q: '"What\'s our exposure if a project goes over budget?"',
    a: 'It doesn\'t. Fixed-price contracts mean the contractor absorbs cost overruns, not the lender or homeowner. Any scope changes require documented change orders with all-party approval before any cost increase takes effect. The Golden Record is a living document.',
  },
];

type FormData = { institution: string; name: string; title: string; email: string; phone: string; volume: string; notes: string; };

export function ForLenders() {
  const [form, setForm] = useState<FormData>({ institution: '', name: '', title: '', email: '', phone: '', volume: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openObj, setOpenObj] = useState<number | null>(null);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('https://formspree.io/f/REPLACE_WITH_FORM_ID', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, _subject: 'Lender Partnership Inquiry — ExpandEase' }),
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
          <a href="#partner" className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            Become a Partner
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
            For Credit Unions &amp; Lenders
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            The renovation loan file<br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">you've always wanted.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            We deliver a "Golden Record" — a pre-validated, lender-ready loan package that includes borrower financials, a fixed-price contractor contract, and a professional appraisal-ready project scope. You approve with confidence.
          </p>
          <a href="#partner" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg hover:opacity-90 transition-opacity group">
            Become a Lending Partner <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 px-4 border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Traditional vs Golden Record */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Two kinds of renovation loans.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-400 font-bold uppercase text-xs tracking-widest mb-4">Traditional Renovation Loans</div>
              {['Vague scopes — costs unknown at underwriting', 'Contractor disputes mid-project', 'Cost overruns passed to borrower', 'FHA 203(k): 90+ day process, HUD consultant required', 'Lender has no visibility after funding'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-b from-purple-900/40 to-pink-900/20 rounded-2xl p-8 border border-pink-500/30">
              <div className="text-pink-400 font-bold uppercase text-xs tracking-widest mb-4">Renovation OS — Golden Record</div>
              {['Fixed-price contract before underwriting begins', 'Vetted contractor — licensed, insured, accountable', 'SOW accuracy 95%+ before a dollar is funded', 'Target: 30 days from application to funding', 'Full milestone visibility throughout the project'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Partnership Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">How the partnership works.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Integrate', desc: 'We add your institution to our lender network. Homeowners in your service area are directed to your financing products through our platform.' },
              { n: '02', title: 'Receive the Golden Record', desc: 'Every applicant arrives with a complete, lender-ready file: borrower financials, fixed-price contractor contract, full SOW, and property data.' },
              { n: '03', title: 'Fund and Monitor', desc: 'Disburse on verified milestones. No lump-sum risk. Full project visibility through our platform from first draw to final inspection.' },
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
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Why lenders choose Renovation OS.</h2>
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

      {/* Objections */}
      <section className="py-20 px-4 bg-purple-950/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Common questions from compliance teams.</h2>
          <div className="space-y-4">
            {OBJECTIONS.map((o, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <button onClick={() => setOpenObj(openObj === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-semibold text-gray-200 italic">{o.q}</span>
                  {openObj === i ? <ChevronUp size={18} className="text-pink-400 shrink-0 ml-4" /> : <ChevronDown size={18} className="text-gray-400 shrink-0 ml-4" />}
                </button>
                {openObj === i && <div className="px-6 pb-6 text-gray-300 leading-relaxed border-t border-white/10 pt-4">{o.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Form */}
      <section id="partner" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Request a partnership call.</h2>
            <p className="text-gray-400">A member of our team will reach out within 1 business day.</p>
          </div>
          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Thank you.</h3>
              <p className="text-gray-400">We'll be in touch within 1 business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 rounded-2xl border border-white/10 p-8">
              {[
                { label: 'Institution Name', key: 'institution' as keyof FormData, placeholder: 'Desert Financial Credit Union' },
                { label: 'Your Name', key: 'name' as keyof FormData, placeholder: 'Jane Smith' },
                { label: 'Title', key: 'title' as keyof FormData, placeholder: 'VP of Lending' },
                { label: 'Email', key: 'email' as keyof FormData, placeholder: 'jsmith@desertfinancial.com' },
                { label: 'Phone', key: 'phone' as keyof FormData, placeholder: '(602) 555-0100' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} required value={form[f.key]}
                    onChange={set(f.key)}
                    className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Monthly Renovation Loan Volume</label>
                <select value={form.volume} onChange={set('volume')} required
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors">
                  <option value="">Select a range</option>
                  <option>Less than $500K</option>
                  <option>$500K – $2M</option>
                  <option>$2M – $5M</option>
                  <option>$5M+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Anything else you'd like us to know?</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Optional"
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Request a Partnership Call →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-black py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Home className="text-pink-500" size={20} /><span className="font-bold text-white">ExpandEase</span>
          </Link>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/for-contractors" className="hover:text-white transition-colors">For Contractors</Link>
          </div>
          <p className="text-xs text-gray-600">© 2025 ExpandEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
