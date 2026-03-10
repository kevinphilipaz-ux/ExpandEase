import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
interface AffordabilitySummaryProps {
  monthlyPayment: number;
}
export function AffordabilitySummary({
  monthlyPayment
}: AffordabilitySummaryProps) {
  const [income, setIncome] = useState(17000);
  const [debts, setDebts] = useState(4500);
  const [dti, setDti] = useState(0);
  const [freeCashflow, setFreeCashflow] = useState(0);
  const [feasibility, setFeasibility] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(
    'HIGH'
  );
  useEffect(() => {
    // Calculate DTI: (Debts + New Payment) / Income
    const totalMonthlyObligations = debts + monthlyPayment;
    const calculatedDti = totalMonthlyObligations / income * 100;
    setDti(Math.round(calculatedDti));
    // Calculate Free Cashflow
    setFreeCashflow(income - totalMonthlyObligations);
    // Determine Feasibility
    if (calculatedDti < 36) setFeasibility('HIGH');else
    if (calculatedDti < 43) setFeasibility('MEDIUM');else
    setFeasibility('LOW');
  }, [income, debts, monthlyPayment]);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };
  const getBadgeStyles = (type: 'dti' | 'cashflow' | 'feasibility') => {
    if (type === 'dti') {
      if (dti < 36) return 'bg-green-500/20 text-green-400 border-green-500/30';
      if (dti < 43)
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (type === 'cashflow') {
      return freeCashflow > 0 ?
      'bg-green-500/20 text-green-400 border-green-500/30' :
      'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (type === 'feasibility') {
      if (feasibility === 'HIGH')
      return 'bg-green-500/20 text-green-400 border-green-500/30';
      if (feasibility === 'MEDIUM')
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    return '';
  };
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        Your Financial Reality Check
      </h3>
      <p className="text-gray-400 text-xs">This does not constitute lending or pre-approval. Lenders will apply their own criteria.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex justify-between items-center">
            <label className="text-gray-400 text-sm">
              Monthly Household Income:
            </label>
            <div className="relative group">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                $
              </span>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="bg-transparent border-b border-dashed border-gray-500 text-right w-24 font-mono text-white focus:outline-none focus:border-pink-500 pl-4" />

            </div>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-gray-400 text-sm">
              Current Monthly Debts:
            </label>
            <div className="relative group">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                $
              </span>
              <input
                type="number"
                value={debts}
                onChange={(e) => setDebts(Number(e.target.value))}
                className="bg-transparent border-b border-dashed border-gray-500 text-right w-24 font-mono text-white focus:outline-none focus:border-pink-500 pl-4" />

            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-3">
          <div
            className={`flex justify-between items-center p-3 rounded-lg border ${getBadgeStyles('dti')}`}>

            <span className="text-sm font-medium">
              Debt-to-Income Ratio (DTI)
            </span>
            <span className="font-mono font-bold">{dti}%</span>
          </div>

          <div
            className={`flex justify-between items-center p-3 rounded-lg border ${getBadgeStyles('cashflow')}`}>

            <span className="text-sm font-medium">Remaining Free Cashflow</span>
            <span className="font-mono font-bold">
              {formatCurrency(freeCashflow)}/mo
            </span>
          </div>

          <div
            className={`flex justify-between items-center p-3 rounded-lg border ${getBadgeStyles('feasibility')}`}>

            <span className="text-sm font-medium">Project Feasibility</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{feasibility}</span>
              {feasibility === 'HIGH' && <CheckCircle size={16} />}
              {feasibility === 'MEDIUM' && <AlertTriangle size={16} />}
              {feasibility === 'LOW' && <XCircle size={16} />}
            </div>
          </div>
        </div>
      </div>
    </div>);

}