import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, CheckCircle, XCircle, ArrowRight, Shield, TrendingUp, FileText, Users, ChevronDown, ChevronUp, HeartHandshake, CalendarCheck, MessageSquare, Filter, Magnet, ClipboardList, Stamp, Sparkles, Zap, Camera, Brain } from 'lucide-react';
import { TableOfContents } from '../components/ui/TableOfContents';
import type { TocItem } from '../components/ui/TableOfContents';

const LENDER_TOC: TocItem[] = [
  { id: 'lender-hero', label: 'Overview' },
  { id: 'lender-stats', label: 'By the Numbers' },
  { id: 'lender-engine', label: 'Consumer Engine' },
  { id: 'lender-compare', label: 'Traditional vs Golden' },
  { id: 'lender-ai', label: 'AI Risk Intelligence' },
  { id: 'lender-quotes', label: 'Industry Voices' },
  { id: 'how-partnership-works', label: 'How It Works' },
  { id: 'lender-benefits', label: 'Benefits' },
  { id: 'lender-objections', label: 'Q&A' },
  { id: 'partner', label: 'Partner' },
];

const BENEFITS = [
  {
    icon: Users,
    title: 'We Bring You Qualified Borrowers',
    desc: 'Homeowners come to ExpandEase ready to renovate. We are targeting prime and super-prime homeowners in the Phoenix metro — equity-rich, rate-locked at 3%, and motivated to stay. They have already committed a $599 deposit for their 3D visualization and project documentation, ensuring serious intent before the file ever hits your desk. We drive the leads; you approve and fund.',
  },
  {
    icon: FileText,
    title: 'De-Risked Loan Files — Golden Record Every Time',
    desc: 'Every file includes a fixed-price contractor contract, complete material and labor SOW, and documented homeowner selections. Your underwriters receive a complete project document to support After-Repair Value (ARV) determination. No "TBD" on scope or cost — the entire renovation is defined, priced, and contractor-backed before it reaches your desk.',
  },
  {
    icon: TrendingUp,
    title: 'Works With Your Existing Products',
    desc: 'Whether you offer standard HELOCs, ARV-based second liens, or construction-to-permanent loans, we deliver qualified borrowers with complete documentation. For HELOC products, we hand you a qualified borrower with equity documentation. For ARV products, the Golden Record provides the fixed-price contract and full SOW your underwriters need. We fit your product — we don\'t dictate it.',
  },
  {
    icon: HeartHandshake,
    title: 'Higher Project Success = Lower Default Risk',
    desc: 'Renovation failures and disputes are leading causes of borrower stress and default. When expectations are set in writing from day one and change orders are documented, homeowners stay satisfied. Satisfied borrowers pay. Our process reduces the dispute spiral that turns renovation stress into missed payments. You get better outcomes and a cleaner portfolio.',
  },
  {
    icon: Shield,
    title: 'No Referral Fees — RESPA-Compliant',
    desc: 'We do not accept referral fees for sending you borrowers. We are paid for bona-fide services: borrower verification, contractor vetting, and Golden Record documentation. We provide full compliance documentation and are happy to walk through the structure with your legal team.',
  },
  {
    icon: CalendarCheck,
    title: 'Post-Funding Visibility — You\'re Not in the Dark',
    desc: 'We don\'t disappear after you fund. Our Golden Record tracks scope, milestones, and any change orders so you and the borrower always see the same picture. Fewer "where\'s my draw?" calls and fewer surprises. If anything changes, it gets documented and agreed to by all parties before work continues.',
  },
];

const STATS = [
  { value: '$200–400K', label: 'Target loan size range' },
  { value: '30 Days', label: 'Application to funding (target)' },
  { value: 'Fixed-Price', label: 'Locked SOW before you underwrite' },
  { value: 'You', label: 'Hold escrow — you control the draws' },
];

const INDUSTRY_QUOTES = [
  { quote: 'The renovation customer is a very big hill to climb. Market resistance is real.', name: 'Private Lending Director', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Renovations are notorious for causing marital strain. The process is so inherently unpleasant that customers may stay dissatisfied even after completion.', name: 'Mortgage Executive', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Why not just buy a new house? That is what every broker tells these homeowners.', name: 'Mortgage Broker', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'The market is surrendered to slow, niche specialty lenders because traditional banks lack the infrastructure to manage draw risk.', name: 'Commercial Lending VP', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&facepad=2' },
  { quote: 'Have you seen the percentage of people who get divorced during a renovation? This process sucks.', name: 'Industry Veteran', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&facepad=2' },
];

const OBJECTION_CATEGORIES = [
  {
    title: 'Contractor & project risk',
    items: [
      { q: '"How do we know the contractors are legitimate?"', a: 'Every contractor in our network is licensed, insured, and vetted before their first project. We verify their license with the Arizona Registrar of Contractors, confirm insurance, and review their project history. We monitor their standing throughout the relationship. No contractor, no Golden Record — no fund.' },
      { q: '"What if the contractor walks or fails mid-project?"', a: 'Funds are in escrow and released on verified milestones, not upfront. If a contractor doesn\'t perform, they don\'t get paid for incomplete work. The homeowner and you have a clear scope and a new contractor can be brought in against the same Golden Record. We also vet and monitor contractors so the bar is high from the start.' },
      { q: '"What if the borrower abandons the project or stops participating?"', a: 'The loan is between you and the borrower. If the borrower walks, your standard loan and collateral remedies apply. The Golden Record and fixed-price contract still define scope and cost, so if the project is completed later — by the same or a new contractor — the same terms apply. We don\'t change your rights as the lender.' },
    ],
  },
  {
    title: 'Regulatory, escrow & budget',
    items: [
      { q: '"What about regulatory risk? RESPA, referrals, kickbacks?"', a: 'We do not accept referral fees or kickbacks. Our revenue is from bona-fide services: borrower verification, contractor vetting, and Golden Record documentation — consistent with RESPA Section 8. We provide full compliance documentation and are happy to engage with your legal team. We\'ve already done that work.' },
      { q: '"What does this cost us? Referral fees?"', a: 'We are not paid a referral fee for sending you the borrower. Our revenue is from bona-fide services: borrower verification, contractor vetting, and Golden Record documentation. We provide full compliance documentation for your legal team and are happy to walk through the structure. You get a complete file and a qualified applicant; we get paid for the work we do, in a RESPA Section 8–compliant way.' },
      { q: '"What\'s our exposure if a project goes over budget?"', a: 'Zero. Every Golden Record includes a signed, fixed-price contract with a vetted ExpandEase contractor. Any change orders must be mutually signed in our portal and funded out-of-pocket by the homeowner before work continues. The bank\'s exposure is locked at underwriting.' },
      { q: '"Who holds the money?"', a: 'You do. Funds sit in your escrow. We never hold or move your funds. You approve every draw. We provide the milestone verification through documented contractor progress — your desk reviews, approves, and disburses directly.' },
    ],
  },
  {
    title: 'Product, volume & Golden Record',
    items: [
      { q: '"Why not just do FHA 203(k) or our existing reno product?"', a: '203(k) is slow, HUD-consultant heavy, and often 90+ days. Our flow delivers a lender-ready Golden Record in a fraction of that time — fixed price, vetted contractor, full SOW — so you can use your own product or 203(k) with a complete file. We de-risk and accelerate; you keep underwriting control.' },
      { q: '"How do we get volume? Is there real demand?"', a: 'We\'re building the homeowner side in Arizona — people who are equity-rich, rate-locked, and want to renovate instead of move. We qualify them, lock scope, and direct them to our lender network. As a partner, you get access to that pipeline. Co-marketing and white-label options ("Powered by [Your CU]") help you capture more of it.' },
      { q: '"What about appraisal gaps or property valuation?"', a: 'The Golden Record includes a professional, appraisal-ready project scope and fixed contractor pricing. You underwrite to the same standards you use today — we just ensure the renovation piece is defined, priced, and contractor-backed before it hits your desk. Appraisal and valuation remain your process.' },
      { q: '"Integration sounds heavy. How do we plug in?"', a: 'We don\'t require a core integration to start. You receive the Golden Record (borrower financials, fixed-price contract, full SOW, property data) and underwrite in your existing systems. Optional: we can align on data formats and status updates so you get milestone visibility. We fit your workflow; we don\'t replace it.' },
      { q: '"What if ExpandEase goes away after we fund?"', a: 'Your loan is with the borrower; escrow is with you. Draw release is between you, the borrower, and the contractor. We facilitate the process and provide the platform — but you\'re not dependent on us for servicing. The Golden Record still defines scope if the project is completed later.' },
      { q: '"What\'s actually in the file? Can we see a sample?"', a: 'Every Golden Record includes: borrower info, income and debt for DTI, occupancy status, property details, a fixed-price contract with a licensed contractor, the full scope of work (materials and labor), a milestone schedule, and a single document ID for version control. We can send a redacted sample for your underwriting and compliance review.' },
    ],
  },
];

type FormData = { institution: string; name: string; title: string; email: string; phone: string; volume: string; notes: string; };

export function ForLenders() {
  const [form, setForm] = useState<FormData>({ institution: '', name: '', title: '', email: '', phone: '', volume: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openObj, setOpenObj] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIndex(i => (i + 1) % INDUSTRY_QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

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
      lead_type: 'lender',
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      notes: form.notes || null,
      institution: form.institution,
      title: form.title,
      volume: form.volume,
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
      <TableOfContents items={LENDER_TOC} accent="pink" />
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
      <section id="lender-hero" className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-8">
            <Sparkles size={14} /> The Future of Renovation Lending Has Arrived
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            The renovation loan file<br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">that never existed. Until now.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            ExpandEase delivers the first AI-powered, permit-integrated Golden Record — a fully scoped, fixed-price, contractor-backed loan file that makes renovation lending as clean as a purchase mortgage.
          </p>
          <div className="max-w-xl mx-auto mb-10">
            <ul className="space-y-3 text-left">
              {[
                'Golden Record — borrower financials, fixed-price contract, stamped plans, appraisal-ready scope',
                'AI-verified milestone payments — photo-confirmed progress before every draw release',
                'Integrated permitting — stamped plans and inspection schedules built into the file',
                'You hold escrow and approve every draw; we never touch your funds',
                'Higher project success rates, happier homeowners, fewer defaults',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-300 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#partner" className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-lg flex items-center justify-center gap-2 group hover:opacity-90 transition-opacity">
              Become a Lending Partner <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#how-partnership-works" className="px-8 py-4 rounded-xl border border-white/20 font-bold text-lg hover:bg-white/5 transition-colors">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="lender-stats" className="py-14 px-4 border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Consumer Engine / Lender value */}
      <section id="lender-engine" className="bg-gradient-to-b from-[#0a0612] to-blue-900/10 border-y border-white/10">
        <div className="max-w-6xl mx-auto py-20 px-4">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-stretch">
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                Our Consumer Engine: Turning vision into loan origination.
              </h2>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-4">
                Our mission is simple: Make renovating a home as frictionless as buying a new one.
              </p>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">
                We give consumers an interactive platform to visualize their project in 3D and instantly plan the financial reality of the build—so every file that reaches you is already grounded in clear scope and intent.
              </p>
              <ul className="space-y-3 mt-auto">
                {['Qualified intent before application — $599 deposit and real pricing', 'Clear scope and fixed price before underwriting', 'Lender-ready file every time'].map((item, i) => (
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
                  <Filter size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">The Ultimate Filter</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">
                    Users must engage with accurate pricing and commit a $599 deposit for their PRD before moving forward.
                  </p>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Result: window-shoppers drop off; you only see serious buyers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Magnet size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Eliminating Sticker Shock</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">
                    Borrowers see their exact monthly payment and ARV requirements before they ever apply.
                  </p>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    The app handles borrower education so they arrive informed and ready.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <ClipboardList size={20} className="text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Zero-Friction Contractor Quoting</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-3">
                    We eliminate project uncertainty so scope and cost are locked before the file reaches you.
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm md:text-base leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-pink-400 block" aria-hidden />
                      <span><strong className="text-gray-200">Single source of truth.</strong> The platform captures 100% of the inputs your underwriters and the builder need—no missing details.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-pink-400 block" aria-hidden />
                      <span><strong className="text-gray-200">Itemized Statement of Work.</strong> Down-to-the-dollar SOW reflecting every homeowner design decision.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-pink-400 block" aria-hidden />
                      <span><strong className="text-gray-200">Contractor-ready pricing.</strong> Scope is locked and documented so contractors can review and sign off — no weeks of back-and-forth.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traditional vs Golden Record */}
      <section id="lender-compare" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Two kinds of renovation loans.</h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">The industry hasn't changed in decades. We're changing it now — with AI, integrated permitting, and a loan file that actually tells the whole story.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-red-500/20">
              <div className="text-red-400 font-bold uppercase text-xs tracking-widest mb-4">Traditional Renovation Loans</div>
              {['Vague scopes — costs unknown at underwriting', 'Contractor disputes mid-project', 'Cost overruns passed to borrower', 'Traditional FHA 203(k) & Fannie Homestyle: 90+ day process, expensive 3rd-party HUD consultants required.', 'Borrower stress and disputes increase default risk', 'Lender has no visibility after funding', 'Permitting is untracked — delays and code violations are invisible', "Often requires a 'two-close' process, doubling closing costs for the borrower.", 'Market surrendered to slow niche specialty lenders — traditional banks lack infrastructure'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-b from-purple-900/40 to-pink-900/20 rounded-2xl p-8 border border-pink-500/30">
              <div className="text-pink-400 font-bold uppercase text-xs tracking-widest mb-4">ExpandEase — AI-Powered Golden Record</div>
              {['Fixed-price contract before underwriting begins', 'Vetted contractor — licensed, insured, accountable', 'AI-generated SOW with 21 trade packages and material specs', 'Integrated permitting — PE-stamped plans, pre-filled applications, inspections scheduled', 'Aria AI monitors project health and flags issues before they become change orders', 'Photo-verified milestones — AI confirms work completion before draw release', 'Enables a superior Portfolio ARV product bypassing FHA 203(k) red tape', 'Target: 30 days from application to funding', 'Full milestone visibility and documented change orders throughout'].map(item => (
                <div key={item} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-gray-200 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI + Permitting Platform for Lenders ── */}
      <section id="lender-ai" className="py-20 px-4 bg-gradient-to-b from-blue-950/20 to-[#0a0612]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
              <Brain size={14} /> AI-Powered Risk Intelligence
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Technology that <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">de-risks every file.</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">Every Golden Record is backed by AI verification, integrated permitting, and real-time project monitoring — giving your underwriters the most complete renovation file in the industry.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Sparkles, color: 'violet', title: 'Aria AI — Project Intelligence', desc: 'Aria monitors every project in real time. Flags scope risks before they become change orders, verifies contractor progress against the SOW, and provides your team with early warning signals — so you know about problems before the borrower calls.' },
              { icon: Stamp, color: 'emerald', title: 'Integrated Permitting in the File', desc: 'Every Golden Record includes PE-stamped plans, permit application status, and a complete inspection schedule linked to construction milestones. Your underwriters see the full compliance picture — not just scope and price.' },
              { icon: Camera, color: 'pink', title: 'Photo-Verified Draw Releases', desc: 'Contractors upload geo-tagged, time-stamped site photos at each milestone. Aria AI verifies work completion against SOW specifications before recommending draw release. No more relying on manual inspections.' },
              { icon: Zap, color: 'amber', title: 'TurboMode™ — Zero Idle Days', desc: 'AI-optimized construction scheduling means faster project completion, lower carrying costs for borrowers, and reduced risk of stalled projects. Every trade sequenced for maximum efficiency.' },
            ].map((card, i) => (
              <div key={i} className={`bg-white/5 rounded-2xl p-6 border border-${card.color}-500/20 hover:border-${card.color}-500/40 transition-colors`}>
                <div className={`w-12 h-12 rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/30 flex items-center justify-center mb-4`}>
                  <card.icon size={22} className={`text-${card.color}-400`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we've heard — quote slider */}
      <section id="lender-quotes" className="py-10 px-4 bg-white/5 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 justify-center mb-6">
            <MessageSquare size={22} className="text-pink-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">What we've heard from the industry.</h2>
          </div>
          <p className="text-gray-400 text-sm text-center mb-6 max-w-2xl mx-auto">Brokers and lenders have told us why renovation lending feels like a tough sell. We listened — and it's why we built ExpandEase.</p>
          <div className="bg-gray-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 md:p-8 min-h-[180px]">
              <img src={INDUSTRY_QUOTES[quoteIndex].img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/10 shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-gray-300 italic text-base md:text-lg mb-2">"{INDUSTRY_QUOTES[quoteIndex].quote}"</p>
                <p className="text-gray-500 text-sm">— {INDUSTRY_QUOTES[quoteIndex].name}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2 pb-4">
              {INDUSTRY_QUOTES.map((_, i) => (
                <button key={i} onClick={() => setQuoteIndex(i)} aria-label={`Quote ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === quoteIndex ? 'bg-pink-500' : 'bg-white/30 hover:bg-white/50'}`} />
              ))}
            </div>
          </div>
          <p className="text-white font-medium text-center mt-4 text-sm md:text-base max-w-2xl mx-auto">
            That skepticism validates our mission. <span className="text-pink-400">The process is broken — and we've rebuilt it from the ground up.</span> AI-powered scope generation, integrated permitting, photo-verified milestones, and a single signed source of truth. The future of renovation lending is here.
          </p>
        </div>
      </section>

      {/* How Partnership Works */}
      <section id="how-partnership-works" className="py-20 px-4 bg-gradient-to-b from-[#0a0612] to-purple-950/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">How the partnership works.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Integrate', desc: 'We add your institution to our lender network. Homeowners in your service area are directed to your financing products through our platform.' },
              { n: '02', title: 'Receive the Golden Record', desc: 'Every applicant arrives with a complete, lender-ready file: borrower financials, fixed-price contractor contract, full SOW, and property data.' },
              { n: '03', title: 'Fund and Monitor', desc: 'You hold escrow and disburse on verified milestones — no lump-sum risk. Full project visibility through our platform from first draw to final inspection. You stay in control of every draw.' },
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
      <section id="lender-benefits" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Why lenders choose ExpandEase.</h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">We bring leads. We increase project success rates and homeowner satisfaction. We de-risk every file with a fixed-price contract and full SOW before you underwrite.</p>
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
      <section id="lender-objections" className="py-20 px-4 bg-purple-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Common questions from compliance &amp; underwriting.</h2>
          <p className="text-center text-gray-400 mb-12">Escrow control, contractor risk, overruns, RESPA, volume, and what's in the Golden Record — straight answers.</p>
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

      {/* Partner Form */}
      <section id="partner" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Partner with the future of renovation lending.</h2>
            <p className="text-gray-400 max-w-lg mx-auto">The renovation market is a $400B+ opportunity that traditional lending has largely surrendered. Early lending partners get priority borrower flow, AI-powered file intelligence, and a competitive edge that didn't exist until now. A member of our team will reach out within 1 business day.</p>
          </div>
          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-12 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Thank you.</h3>
              <p className="text-gray-400">We'll be in touch within 1 business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 rounded-2xl border border-white/10 p-8">
              <p className="text-gray-500 text-xs mb-4 italic">*This portal is for inbound partnership inquiries. If you are viewing a live demo, your ExpandEase representative will provide direct onboarding documentation.*</p>
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
            <Link to="/for-contractors" className="hover:text-white transition-colors">For Contractors</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 ExpandEase. Built in Phoenix, AZ by successfully exited tech operators. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
