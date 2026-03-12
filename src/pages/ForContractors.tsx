import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, CheckCircle, XCircle, ArrowRight, DollarSign, FileText, Shield, Star, ChevronDown, ChevronUp, BookOpen, CalendarCheck, MessageSquare, Zap, Target, FileCheck } from 'lucide-react';

const STATS = [
  { value: 'Pre-funded', label: 'Leads arrive with financing secured' },
  { value: 'Zero-question', label: 'Full SOW before you bid' },
  { value: '48hr', label: 'Milestone payment release' },
  { value: '1 source', label: 'Single signed scope = no disputes' },
];

const BENEFITS = [
  {
    icon: Star,
    title: 'Not Another Lead-Gen Site',
    desc: 'Stop racing to the bottom against five other bidders on Angi or HomeAdvisor. We do not sell shared, raw leads. Our homeowners have already paid a $599 deposit for their 3D design and secured their financing. We hand our vetted partners exclusive, fully funded projects.',
  },
  {
    icon: FileText,
    title: 'Zero-Friction Quoting & Margin Control',
    desc: 'We hand you a 99% accurate Statement of Work containing exact material quantities, specs, and documented homeowner selections. You simply review the file, apply your specific labor rates and profit margins, and sign off. Turn days of frustrating estimating into a 30-minute final review.',
  },
  {
    icon: DollarSign,
    title: 'No More Waiting for Bank Inspectors',
    desc: 'Traditional bank draws stall your job site. With ExpandEase, you manage draws digitally. Submit geo-tagged, time-stamped photos directly through our portal to clear milestones. The lender reviews the digital proof and releases funds from escrow. Keep your cash flow moving without the friction.',
  },
  {
    icon: Shield,
    title: 'Higher Project Success Rates & Homeowner Satisfaction',
    desc: 'Clear scope and locked change orders mean fewer surprises and fewer callbacks. Homeowners stay happy because expectations are set in writing from day one. You get more referrals, fewer disputes, and a reputation for delivering what you promised.',
  },
  {
    icon: BookOpen,
    title: 'The SOW Is the Rule Giver — You\'re Protected',
    desc: 'Every project starts with a signed scope of work: clear deliverables, not-to-exceed terms for conditions outside your control, and a change order process that protects you. No more "but I thought you meant…" Your signature is your shield. Disputes drop when the document is the single source of truth.',
  },
  {
    icon: CalendarCheck,
    title: 'Post-Signature Trade Scheduling — Stay On Schedule',
    desc: 'Our platform helps you line up subs and trades with committed timeline slots. Every trade confirms; conflicts get flagged before they cascade. You show up to a coordinated build, not a guessing game. On schedule and on budget = happier homeowners and more repeat business.',
  },
];

const CONTRACTOR_QUOTES = [
  { quote: 'I waste a week on every estimate. By the time I\'m done, the homeowner has already called someone else.', name: 'General contractor, Phoenix' },
  { quote: 'Bank draws kill my cash flow. I finish a phase and then wait two weeks for an inspector to show up.', name: 'Licensed contractor' },
  { quote: 'Scope creep is built into the job. They "couldn\'t picture it" from the plans, and now we\'re redoing the kitchen.', name: 'Renovation specialist' },
  { quote: 'Lead gen sites send the same "lead" to five other guys. We all underbid and nobody wins.', name: 'Residential GC' },
];

const OBJECTION_CATEGORIES = [
  {
    title: 'Leads & qualification',
    items: [
      { q: 'Are these just raw leads?', a: 'No. A homeowner cannot enter our contractor pipeline until they have completed our curation process, paid a $599 deposit, generated a Golden Record SOW, and been pre-qualified for their ARV loan. You are looking at a ready-to-sign contract.' },
      { q: '"What if the homeowner doesn\'t qualify for financing?"', a: 'They don\'t reach you until they do. Our flow qualifies borrowers and locks scope before we match them with a contractor. By the time you see the project, financing is in progress and the scope is set. No wasted bids on "maybe" jobs.' },
      { q: '"How many leads do I actually get?"', a: 'Volume depends on your service area and trade. We\'re growing the homeowner side in Arizona and directing qualified renovation projects to vetted contractors in our network. Early partners get priority placement. We\'d rather send you fewer, fully-baked deals than a flood of unqualified leads.' },
      { q: '"I already have plenty of work."', a: 'Then this is about better work, not more volume. Our leads are pre-funded, fully scoped, and paid on milestones. Less chasing, less dispute risk, higher homeowner satisfaction. Many contractors use us to replace their worst clients with ones that show up ready to build.' },
    ],
  },
  {
    title: 'Scope, control & margins',
    items: [
      { q: '"This sounds like I lose control of the project."', a: 'You control the build. We control the paperwork. Every construction decision — means, methods, sequencing — is yours. What we standardize is the intake, the contract, and the payment flow: the stuff that causes disputes and payment fights, not the craft.' },
      { q: '"What if the homeowner changes their mind mid-project?"', a: 'Every change goes through our platform. You document it, the homeowner approves it, the lender signs off on it. You\'re protected. No undocumented verbal agreements, no payment disputes. Every change order is locked and funded before work continues.' },
      { q: '"What about my margins? Fixed price sounds risky."', a: 'You set the price. We don\'t dictate your number — we give you a complete SOW so you can bid accurately. Fixed price means the homeowner and lender can\'t nickel-and-dime you; change orders are the only way scope or price moves, and those are documented and approved. Your margin is protected when the scope is clear.' },
      { q: '"I don\'t need another platform or middleman."', a: 'We\'re not a middleman — we\'re your lead source and your back office for scope and payment. One place to see the SOW, the change orders, and the payment status. Less admin, more builds. Contractors who join see fewer disputes and faster pay; that\'s the trade.' },
    ],
  },
  {
    title: 'Payment, scheduling & platform',
    items: [
      { q: '"What\'s the catch? What do you charge?"', a: 'We charge 1–2% of the project total as a platform fee. In exchange you get a qualified lead with financing secured, a fully scoped contract, and guaranteed milestone payments. Compare that to lead gen that charges $50–200 per unqualified click and disappears after the handoff — or to the cost of chasing payments and redoing work from scope creep.' },
      { q: '"I still have to manage my own scheduling chaos."', a: 'Not anymore. Our post-signature platform includes trade scheduling: you enter your subs and trades, they confirm their slots, and the system flags conflicts before they become job-site disasters. You show up to a coordinated build.' },
      { q: '"What if the lender or platform goes away mid-job?"', a: 'Funds are in escrow with the lender before work starts. Draws release on milestone verification regardless of platform status. Your contract is with the homeowner and the lender; we facilitate the process. You\'re not dependent on us for payment — the money is already set aside.' },
    ],
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
  const [openObj, setOpenObj] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex(i => (i + 1) % CONTRACTOR_QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const toggleArea = (area: string) => {
    setForm(f => ({ ...f, areas: f.areas.includes(area) ? f.areas.filter(a => a !== area) : [...f.areas, area] }));
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    if (!supabase) {
      setSubmitError('Something went wrong. Please email us directly at hello@expandease.com');
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('leads').insert({
      lead_type: 'contractor',
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      company: form.company || null,
      license: form.license || null,
      years: form.years || null,
      service_areas: form.areas.length > 0 ? form.areas : null,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError('Something went wrong. Please email us directly at hello@expandease.com');
    } else {
      setSubmitted(true);
    }
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
          <div className="max-w-xl mx-auto mb-10">
            <ul className="space-y-3 text-left">
              {[
                'Pre-funded projects — $599 deposit and financing secured before you see the job',
                'Complete SOW before you bid — apply your rates and margins in a 30-minute review',
                'Digital milestone draws — no waiting on bank inspectors',
                'You build with confidence.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-300 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
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

      {/* How we get you ready-to-build jobs */}
      <section className="bg-gradient-to-b from-[#0a0612] to-purple-950/20 border-y border-white/10">
        <div className="max-w-6xl mx-auto py-20 px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-stretch">
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                From homeowner vision to your signed contract.
              </h2>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-4">
                We turn renovation intent into lender-ready, contractor-ready projects. Homeowners complete our 3D curation, lock scope, and secure financing before we ever match them with you.
              </p>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">
                You receive a complete Statement of Work, documented selections, and a pre-qualified borrower. No cold bids. No tire-kickers. No shared lead-gen races.
              </p>
              <ul className="space-y-3 mt-auto">
                {['Exclusive projects — we don\'t sell your lead to five other bidders', 'Fixed-price SOW — you set labor and margin, we lock scope', 'Milestone payments from escrow — no collections'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm md:text-base">
                    <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Target size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Pre-qualified homeowners only</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">
                    Every project has a $599 deposit and financing in motion. Scope and selections are locked in our platform before you see the file.
                  </p>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Result: you only see ready-to-sign work.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileCheck size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">One SOW, one price</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">
                    We hand you a 99% accurate Statement of Work. You apply your labor rates and profit margins and sign off — no weeks of back-and-forth.
                  </p>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Your margin stays in your control.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Digital draws, no stall</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Submit geo-tagged, time-stamped proof through our portal. The lender releases funds from escrow. No waiting on bank inspectors. Your cash flow keeps moving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we've heard from contractors */}
      <section className="py-10 px-4 bg-white/5 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-6">
            <MessageSquare size={22} className="text-pink-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">What we've heard from contractors.</h2>
          </div>
          <p className="text-gray-400 text-sm text-center mb-6 max-w-2xl mx-auto">Estimating burnout, draw delays, and scope creep — we built ExpandEase because the old way doesn't work.</p>
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 md:p-8 min-h-[120px] flex flex-col justify-center">
              <p className="text-gray-300 italic text-base md:text-lg mb-2">"{CONTRACTOR_QUOTES[quoteIndex].quote}"</p>
              <p className="text-gray-500 text-sm">— {CONTRACTOR_QUOTES[quoteIndex].name}</p>
            </div>
            <div className="flex justify-center gap-2 pb-4">
              {CONTRACTOR_QUOTES.map((_, i) => (
                <button key={i} onClick={() => setQuoteIndex(i)} aria-label={`Quote ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === quoteIndex ? 'bg-pink-500' : 'bg-white/30 hover:bg-white/50'}`} />
              ))}
            </div>
          </div>
          <p className="text-white font-medium text-center mt-4 text-sm md:text-base max-w-2xl mx-auto">
            We get it. <span className="text-pink-400">That's why we built a different pipeline.</span> Pre-funded jobs, locked scope, and milestone payments — so you build, not chase.
          </p>
        </div>
      </section>

      {/* Old Way vs New Way */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">Two ways to run your business.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-400 font-bold uppercase text-xs tracking-widest mb-4">The Old Way</div>
              {['Cold outreach and referral chasing', 'Vague scopes, ballpark estimates', 'Scope creep erodes your margin', 'Payment fights at every milestone', '"But that\'s not what I meant" disputes after the fact', 'Trades double-booked, timelines blown'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-b from-purple-900/40 to-pink-900/20 rounded-2xl p-8 border border-pink-500/30">
              <div className="text-pink-400 font-bold uppercase text-xs tracking-widest mb-4">The ExpandEase Way</div>
              {['Inbound leads — homeowners come to you', 'Fixed-price contracts with complete SOW', 'SOW is the rule giver — signed, clear, enforced', 'Change orders locked before work continues', 'Milestone payments released automatically', 'Trades committed to a timeline before day one'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200 text-sm">{item}</span>
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
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Why contractors choose ExpandEase.</h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">More leads. Fewer disputes. Higher project success and homeowner satisfaction. Get paid on time, every time.</p>
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

      {/* The 3D Advantage */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Eliminate the &quot;I can&apos;t picture it&quot; problem.</h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            Contractors lose thousands of dollars in wasted time when a homeowner changes their mind halfway through a build because they &quot;couldn&apos;t visualize&quot; the 2D floor plans. ExpandEase solves this before you ever break ground. The homeowner explores their exact renovation in a high-fidelity 3D environment during our curation phase. By the time you start building, all design anxiety is gone, selections are locked, and your schedule is protected.
          </p>
        </div>
      </section>

      {/* Objection Crushers */}
      <section className="py-20 px-4 bg-purple-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">We've heard the objections.</h2>
          <p className="text-center text-gray-400 mb-12">Straight answers. No spin.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {OBJECTION_CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} className="flex flex-col">
                <h3 className="text-lg font-bold text-pink-400/90 mb-4 pb-2 border-b border-white/10">{cat.title}</h3>
                <div className="space-y-3">
                  {cat.items.map((o, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = openObj === key;
                    return (
                      <div key={key} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <button onClick={() => setOpenObj(isOpen ? null : key)} className="w-full flex items-center justify-between p-4 text-left gap-2">
                          <span className="font-semibold text-gray-200 italic text-sm leading-snug">{o.q}</span>
                          {isOpen ? <ChevronUp size={16} className="text-pink-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                        </button>
                        {isOpen && <div className="px-4 pb-4 pt-2 text-gray-400 leading-relaxed border-t border-white/10 text-sm"><p>{o.a}</p></div>}
                      </div>
                    );
                  })}
                </div>
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
              <p className="text-gray-500 text-xs mb-4 italic">*This application is for licensed general contractors. We verify license and insurance before onboarding.*</p>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Service Area (select all that apply)</label>
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
              {submitError && (
                <p className="text-red-400 text-sm text-center mt-2">{submitError}</p>
              )}
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
            <Link to="/for-lenders" className="hover:text-white transition-colors">For Lenders</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 ExpandEase. Built in Phoenix, AZ by successfully exited tech operators. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
