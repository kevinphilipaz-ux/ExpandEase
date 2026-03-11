import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Maximize2, X } from 'lucide-react';
import type { RenovationLineItem } from '../../config/renovationDefaults';
import { useProjectOptional } from '../../context/ProjectContext';
import { MASTER_RENOVATION_ITEMS, DEFAULT_CURRENT_HOME_VALUE } from '../../config/renovationDefaults';
import { estimateCostToMove } from '../../utils/renovationMath';
import { InfoTooltip } from '../ui/InfoTooltip';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

interface EstimateTableProps {
  items: RenovationLineItem[];
  totalCost: number;
  totalValue: number;
  netTotal: number;
  costToMove: number;
  betterOffRenovating: number;
}

function EstimateTable({ items, totalCost, totalValue, netTotal, costToMove, betterOffRenovating }: EstimateTableProps) {
  return (
    <div className="overflow-x-auto max-h-[70vh] md:max-h-[520px] overflow-y-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <tr className="border-b border-white/10 text-left text-purple-300/80 uppercase tracking-wider text-xs">
            <th className="px-3 py-3 font-medium">Item</th>
            <th className="px-2 py-3 font-medium">Category</th>
            <th className="px-2 py-3 font-medium text-center">Type</th>
            <th className="px-3 py-3 font-medium text-right">Cost</th>
            <th className="px-3 py-3 font-medium text-right">Value Added</th>
            <th className="px-2 py-3 font-medium text-right">ROI</th>
            <th className="px-3 py-3 font-medium text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const net = item.valueAdded - item.cost;
            return (
              <tr
                key={item.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-3 py-3">
                  <span className="text-white font-medium">{item.label}</span>
                  {item.roiSource != null && item.roiSource !== '' && (
                    <InfoTooltip content={item.roiSource} label="ROI source" className="ml-1 align-middle inline-block" />
                  )}
                </td>
                <td className="px-2 py-3 text-purple-400/70 text-xs">{item.category}</td>
                <td className="px-2 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'addition' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {item.type === 'addition' ? 'Addition' : 'Renovation'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-white font-mono tabular-nums">
                  {fmt(item.cost)}
                </td>
                <td className="px-3 py-3 text-right text-emerald-300 font-mono tabular-nums">
                  +{fmt(item.valueAdded)}
                </td>
                <td className="px-2 py-3 text-right font-mono tabular-nums text-purple-300">
                  {item.roiPct}%
                </td>
                <td className={`px-3 py-3 text-right font-mono tabular-nums font-medium ${net >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {net >= 0 ? '+' : ''}{fmt(net)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm">
          <tr className="border-t-2 border-white/20">
            <td className="px-3 py-4" colSpan={3}>
              <span className="text-white font-bold uppercase tracking-wider text-xs">Total</span>
              <span className="block text-purple-400/60 text-xs mt-0.5">{items.length} items</span>
            </td>
            <td className="px-3 py-4 text-right text-white font-mono font-bold text-base">
              {fmt(totalCost)}
            </td>
            <td className="px-3 py-4 text-right text-emerald-300 font-mono font-bold text-base">
              +{fmt(totalValue)}
            </td>
            <td className="px-3 py-4 text-right font-mono text-base text-purple-300">—</td>
            <td className="px-3 py-4 text-right font-mono font-bold text-base">
              <span className={netTotal >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {netTotal >= 0 ? '+' : ''}{fmt(netTotal)}
              </span>
              {netTotal < 0 && (
                <span className="block text-emerald-300/90 text-xs font-medium mt-1 normal-case">
                  Cost to move (est.): {fmt(costToMove)} — you're {fmt(betterOffRenovating)} better off renovating
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function EstimateCard({ item }: { item: RenovationLineItem }) {
  const net = item.valueAdded - item.cost;
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-white font-medium text-sm">{item.label}</span>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${item.type === 'addition' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
          {item.type === 'addition' ? 'Addition' : 'Renovation'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-purple-400/70">{item.category}</span>
        <span className="text-white font-mono tabular-nums">{fmt(item.cost)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-purple-400/60">Value +{fmt(item.valueAdded)} · ROI {item.roiPct}%</span>
        <span className={`font-mono tabular-nums font-medium ${net >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {net >= 0 ? '+' : ''}{fmt(net)} net
        </span>
      </div>
    </div>
  );
}

export function ItemizedBill() {
  const projectCtx = useProjectOptional();
  const fin = projectCtx?.project?.financial;
  const currentHomeValue = projectCtx?.project?.property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const [fullViewOpen, setFullViewOpen] = useState(false);

  const enabledIds = useMemo(() => {
    const saved = fin?.enabledLineItemIds;
    if (saved?.length) return new Set(saved);
    return new Set(MASTER_RENOVATION_ITEMS.map((i) => i.id));
  }, [fin?.enabledLineItemIds]);

  const items = useMemo(
    () => MASTER_RENOVATION_ITEMS.filter((i) => enabledIds.has(i.id)),
    [enabledIds],
  );

  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const totalValue = items.reduce((s, i) => s + i.valueAdded, 0);
  const netTotal = totalValue - totalCost;
  const postRenovationValue = currentHomeValue + totalValue;
  const costToMove = estimateCostToMove(currentHomeValue, postRenovationValue);
  const betterOffRenovating = netTotal >= 0 ? costToMove : costToMove - Math.abs(netTotal);

  const tableBlock = (
    <EstimateTable
      items={items}
      totalCost={totalCost}
      totalValue={totalValue}
      netTotal={netTotal}
      costToMove={costToMove}
      betterOffRenovating={betterOffRenovating}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Receipt size={20} className="text-purple-300" />
          <h3 className="text-lg font-semibold text-white">Itemized Project Estimate</h3>
        </div>
        <button
          type="button"
          onClick={() => setFullViewOpen(true)}
          className="md:hidden flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 transition-colors"
          aria-label="View full estimate table"
        >
          <Maximize2 size={16} />
          Full table
        </button>
      </div>

      {/* Desktop: full table inline */}
      <div className="hidden md:block relative">
        {tableBlock}
        <button
          type="button"
          onClick={() => setFullViewOpen(true)}
          className="absolute top-2 right-2 rounded-lg border border-white/10 bg-gray-900/80 p-1.5 text-purple-300 hover:bg-white/10 transition-colors"
          aria-label="Open full screen view"
          title="Expand table"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Mobile: card list + total */}
      <div className="md:hidden space-y-3">
        <div className="space-y-2">
          {items.map((item) => (
            <EstimateCard key={item.id} item={item} />
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-gray-900/95 p-4">
          <div className="flex justify-between items-baseline">
            <span className="text-white font-bold uppercase tracking-wider text-xs">Total</span>
            <span className="text-white font-mono font-bold text-lg tabular-nums">{fmt(totalCost)}</span>
          </div>
          <p className="text-purple-400/60 text-xs mt-1">{items.length} items</p>
        </div>
      </div>

      {netTotal < 0 && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2">
          <p className="text-emerald-200 text-sm">
            Even with a negative net on this scope, you're still <span className="font-bold text-emerald-300">{fmt(betterOffRenovating)}</span> better off renovating than selling and buying a home at the same value — cost to move (commissions + closing) would be ~{fmt(costToMove)}.
          </p>
        </div>
      )}

      <p className="text-purple-400/60 text-xs">
        Estimates for planning purposes. Get written quotes from licensed contractors before committing.
      </p>

      <AnimatePresence>
        {fullViewOpen && (
          <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setFullViewOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-white/10 bg-gray-900/95">
                <h3 className="text-lg font-semibold text-white">Itemized Project Estimate</h3>
                <button
                  type="button"
                  onClick={() => setFullViewOpen(false)}
                  className="rounded-lg p-2 text-purple-300 hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {tableBlock}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
