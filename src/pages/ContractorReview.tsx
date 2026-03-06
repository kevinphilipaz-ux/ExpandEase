import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProjectOptional } from '../context/ProjectContext';
import { 
  FileSignature, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  DollarSign,
  CalendarDays,
  HardHat,
  ArrowRight,
  X
} from 'lucide-react';

function buildScopeSummary(project: { property?: { address?: string; beds?: number; baths?: number; sqft?: number }; wishlist?: { bedrooms?: number; bathrooms?: number; kitchenLevel?: string; flooring?: string; pool?: string; homeStyle?: string } }): string {
  const prop = project?.property;
  const w = project?.wishlist;
  if (!prop && !w) {
    return 'Addition of 1,750 sq ft to the existing structure. Includes a new Master Suite over the garage, expanding the kitchen footprint, and adding an attached ADU unit with separate entrance. Upgrading existing HVAC to support new zones. All electrical and plumbing run to city code.';
  }
  const bedDelta = (w?.bedrooms ?? prop?.beds ?? 0) - (prop?.beds ?? 0);
  const bathDelta = (w?.bathrooms ?? prop?.baths ?? 0) - (prop?.baths ?? 0);
  const parts: string[] = [];
  if (bedDelta > 0) parts.push(`${bedDelta} new bedroom(s)`);
  if (bathDelta > 0) parts.push(`${bathDelta} new bathroom(s)`);
  if (w?.kitchenLevel && w.kitchenLevel !== 'Standard') parts.push(`${w.kitchenLevel} kitchen`);
  if (w?.flooring) parts.push(`${w.flooring} flooring`);
  if (w?.pool && w.pool !== 'None') parts.push(w.pool + ' pool');
  if (w?.homeStyle) parts.push(w.homeStyle + ' style');
  const summary = parts.length
    ? 'Scope includes: ' + parts.join(', ') + '. All work to city code. Materials and finishes per homeowner selections.'
    : 'Addition and renovation per homeowner design. All electrical and plumbing to code.';
  return summary;
}

function buildMaterialsAndFinishes(project: {
  wishlist?: {
    kitchenLevel?: string;
    flooring?: string;
    bathroomRenoScope?: string;
    homeStyle?: string;
    roomFeatures?: string[];
    kitchenFeatures?: string[];
    bathroomFeatures?: string[];
    interiorDetails?: string[];
    exteriorDetails?: string[];
    outdoorFeatures?: string[];
    systemsDetails?: string[];
  };
}): string[] {
  const w = project?.wishlist;
  const lines: string[] = [];
  if (w?.kitchenLevel) {
    const kitchenExtras = (w.kitchenFeatures ?? []).length ? ` (${(w.kitchenFeatures ?? []).join(', ')})` : '';
    lines.push(`Kitchen: ${w.kitchenLevel} level${kitchenExtras}.`);
  }
  if (w?.bathroomRenoScope) {
    const bathExtras = (w.bathroomFeatures ?? []).length ? `; ${(w.bathroomFeatures ?? []).join(', ')}.` : '.';
    lines.push(`Bathrooms: ${w.bathroomRenoScope} reno scope${bathExtras}`);
  }
  if (w?.flooring) lines.push(`Flooring: ${w.flooring} throughout main living areas.`);
  if (w?.homeStyle || (w?.exteriorDetails ?? []).length) {
    const ext = (w?.exteriorDetails ?? []).length ? (w.exteriorDetails ?? []).join(', ') : 'per existing';
    lines.push(`Exterior: ${w?.homeStyle ?? 'match existing'} style; ${ext}.`);
  }
  if ((w?.roomFeatures ?? []).length) lines.push(`Room features: ${(w.roomFeatures ?? []).join(', ')}.`);
  if ((w?.interiorDetails ?? []).length) lines.push(`Interior details: ${(w.interiorDetails ?? []).join(', ')}.`);
  if ((w?.outdoorFeatures ?? []).length) lines.push(`Outdoor: ${(w.outdoorFeatures ?? []).join(', ')}.`);
  if ((w?.systemsDetails ?? []).length) lines.push(`Systems: ${(w.systemsDetails ?? []).join(', ')}.`);
  return lines.length ? lines : [
    'Kitchen: Quartz countertops (Level 3), custom shaker cabinets, Sub-Zero appliance package.',
    'Master Bath: Freestanding tub, frameless glass shower, double vanity, heated tile floors.',
    'Flooring: Engineered hardwood (Oak, 7" plank) throughout main living areas.',
    'Exterior: Hardie plank siding to match existing, dimensional shingle roof tie-in.'
  ];
}

export function ContractorReview() {
  const navigate = useNavigate();
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;
  const projectName = useMemo(() => {
    if (!project?.property?.address) return 'The Smith Residence Expansion';
    const addr = project.property.address;
    const first = addr.split(',')[0]?.trim() || addr;
    return first ? `${first} Expansion` : 'Your Residence Expansion';
  }, [project?.property?.address]);
  const projectIdShort = project?.meta?.projectId ? project.meta.projectId.replace(/^EXP-/, '').slice(0, 8) + '-B' : '8492-B';
  const scopeSummary = useMemo(() => buildScopeSummary(project ?? {}), [project]);
  const materialsAndFinishes = useMemo(() => buildMaterialsAndFinishes(project ?? {}), [project]);
  const specialInstructions = project?.notes?.specialInstructions?.trim();
  const defaultBid = String(project?.financial?.totalCost ?? 415000);

  const [agreed, setAgreed] = useState({
    scope: false,
    timeline: false,
    fixedPrice: false,
    milestones: false
  });
  const [formData, setFormData] = useState({
    contractorName: '',
    companyName: '',
    licenseNumber: '',
    bidAmount: defaultBid,
    estimatedWeeks: '24'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project?.financial?.totalCost != null && !formData.contractorName) {
      setFormData(prev => ({ ...prev, bidAmount: String(project.financial.totalCost) }));
    }
  }, [project?.financial?.totalCost]);

  const allAgreed = agreed.scope && agreed.timeline && agreed.fixedPrice && agreed.milestones;
  const isFormValid = formData.contractorName && formData.companyName && formData.licenseNumber;
  const canSubmit = allAgreed && isFormValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    if (projectCtx) {
      projectCtx.updateProject({
        contractor: {
          contractorName: formData.contractorName,
          companyName: formData.companyName,
          licenseNumber: formData.licenseNumber,
          bidAmount: formData.bidAmount,
          estimatedWeeks: formData.estimatedWeeks,
          agreedAt: new Date().toISOString(),
        },
      });
    }
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/approved-project-plan', { state: { formData, project: projectCtx?.project } });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <HardHat className="text-white" size={20} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">ExpandEase <span className="text-gray-400 font-normal">|</span> Contractor Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Status: Pending Review
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 border-b border-gray-200 pb-8">
          <p className="text-blue-600 font-bold tracking-wider text-xs uppercase mb-2">Project #{projectIdShort}</p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">{projectName}</h1>
          <p className="text-xl text-gray-500">Review the finalized Scope of Work (SOW) and submit your binding bid to proceed to funding.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: SOW Details */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold">Statement of Work</h2>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2">1. Scope Summary</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {scopeSummary}
                  </p>
                </div>

                <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2">2. Materials & Finishes</h3>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    {materialsAndFinishes.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>

                {specialInstructions ? (
                  <div className="border border-amber-100 bg-amber-50/50 rounded-xl p-5">
                    <h3 className="font-bold text-gray-900 mb-2">2b. Homeowner Special Instructions</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{specialInstructions}</p>
                  </div>
                ) : null}

                <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2">3. Exclusions & Allowances</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    The following items are handled via fixed allowances. Any overages will be billed directly to the homeowner via Change Order:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-none pl-0">
                    <li className="flex justify-between border-b border-gray-200 py-1"><span>Lighting Fixtures</span> <span className="text-gray-900 font-mono">$4,500</span></li>
                    <li className="flex justify-between border-b border-gray-200 py-1"><span>Plumbing Fixtures</span> <span className="text-gray-900 font-mono">$6,000</span></li>
                    <li className="flex justify-between py-1"><span>Landscaping Repair</span> <span className="text-gray-900 font-mono">$2,500</span></li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
                <h2 className="text-2xl font-bold">Milestone Payment Schedule</h2>
              </div>
              <p className="text-gray-600 text-sm mb-6">Payments are held in escrow by the Lender and released within 48 hours of milestone completion verification.</p>
              
              <div className="space-y-3">
                {[
                  { phase: '1. Deposit & Permitting', amount: '10%' },
                  { phase: '2. Foundation & Framing', amount: '25%' },
                  { phase: '3. Rough-in (MEP)', amount: '25%' },
                  { phase: '4. Drywall & Finishes', amount: '25%' },
                  { phase: '5. Final Inspection & Punch-list', amount: '15%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <span className="font-semibold text-gray-800">{item.phase}</span>
                    </div>
                    <span className="font-mono text-emerald-600 font-bold">{item.amount}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Approval Form */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 sticky top-24 overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <FileSignature className="text-blue-600" size={20} />
                  Contractor Sign-off
                </h3>
                <p className="text-xs text-gray-500">To secure this project, provide your final numbers and agree to the SOW terms.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Total Fixed Price Bid</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input 
                        type="text" 
                        value={formData.bidAmount}
                        onChange={(e) => setFormData({...formData, bidAmount: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Est. Duration (Weeks)</label>
                    <input 
                      type="number" 
                      value={formData.estimatedWeeks}
                      onChange={(e) => setFormData({...formData, estimatedWeeks: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg"
                      required
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Contractor Full Name</label>
                    <input 
                      type="text" 
                      value={formData.contractorName}
                      onChange={(e) => setFormData({...formData, contractorName: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Company</label>
                      <input 
                        type="text" 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="LLC/Inc Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">License #</label>
                      <input 
                        type="text" 
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        placeholder="AZ ROC #..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Acknowledgements */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed.scope ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                        {agreed.scope && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={agreed.scope} onChange={() => setAgreed({...agreed, scope: !agreed.scope})} />
                    <span className="text-sm text-gray-600">I agree to the Statement of Work exactly as outlined above.</span>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed.fixedPrice ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                        {agreed.fixedPrice && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={agreed.fixedPrice} onChange={() => setAgreed({...agreed, fixedPrice: !agreed.fixedPrice})} />
                    <span className="text-sm text-gray-600">I confirm my bid is a fixed-price and covers all scopes entirely.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed.milestones ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                        {agreed.milestones && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={agreed.milestones} onChange={() => setAgreed({...agreed, milestones: !agreed.milestones})} />
                    <span className="text-sm text-gray-600">I accept the standard escrow & milestone payment schedule.</span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed.timeline ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                        {agreed.timeline && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={agreed.timeline} onChange={() => setAgreed({...agreed, timeline: !agreed.timeline})} />
                    <span className="text-sm text-gray-600">I agree that all changes must go through the ExpandEase Change Order system.</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
                    canSubmit 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30' 
                    : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <AlertCircle size={20} />
                    </motion.div>
                  ) : (
                    <>
                      <FileSignature size={20} />
                      Sign & Submit Project Plan
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
                  <ShieldCheck size={14} /> Legally binding signature
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
