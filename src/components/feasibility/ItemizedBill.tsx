import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Maximize2, X, ChevronRight, Wrench } from 'lucide-react';
import { useProjectOptional } from '../../context/ProjectContext';
import { MASTER_RENOVATION_ITEMS, DEFAULT_CURRENT_HOME_VALUE } from '../../config/renovationDefaults';
import { estimateCostToMove } from '../../utils/renovationMath';
import { InfoTooltip } from '../ui/InfoTooltip';
import { buildItemizedCosts, type ItemizedLineItem, type ItemizedResult } from '../../utils/itemizedCosts';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);

/* ------------------------------------------------------------------ */
/*  Detail sub-row for surface-level breakdown                          */
/* ------------------------------------------------------------------ */

function DetailRow({ item }: { item: ItemizedLineItem }) {
  return (
    <tr className="bg-white/[0.02] border-b border-white/5 text-xs">
      <td className="pl-8 pr-2 py-2">
        <span className="text-purple-300/80">{item.surface ?? item.label}</span>
        {item.material && (
          <span className="block text-purple-400/50 text-[11px] mt-0.5">{item.material}</span>
        )}
      </td>
      <td className="px-2 py-2 text-purple-400/50">{item.trade ?? ''}</td>
      <td className="px-2 py-2 text-center">—</td>
      <td className="px-3 py-2 text-right text-white/70 font-mono tabular-nums">{fmt(item.cost)}</td>
      <td className="px-3 py-2 text-right text-purple-400/50 font-mono tabular-nums">
        {item.materialCost != null ? fmt(item.materialCost) : '—'}
      </td>
      <td className="px-3 py-2 text-right text-purple-400/50 font-mono tabular-nums">
        {item.laborCost != null ? fmt(item.laborCost) : '—'}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-300/60">
        +{fmt(item.valueAdded)}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary row (expandable if it has detail children)                  */
/* ------------------------------------------------------------------ */

function SummaryRow({
  item,
  details,
  expanded,
  onToggle,
}: {
  item: ItemizedLineItem;
  details?: ItemizedLineItem[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = details && details.length > 0;

  return (
    <>
      <tr
        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? onToggle : undefined}
      >
        <td className="px-3 py-3">
          <span className="flex items-center gap-1.5">
            {hasDetails && (
              <ChevronRight
                size={14}
                className={`text-purple-400/60 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
              />
            )}
            <span className="text-white font-medium">{item.label}</span>
            {item.roiSource != null && item.roiSource !== '' && (
              <InfoTooltip content={item.roiSource} label="ROI source" className="ml-1 align-middle inline-block" />
            )}
          </span>
          {item.benefit && (
            <span className="block text-purple-400/50 text-xs mt-0.5 ml-5">{item.benefit}</span>
          )}
        </td>
        <td className="px-2 py-3 text-purple-400/70 text-xs">{item.category}</td>
        <td className="px-2 py-3 text-center">
          <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'addition' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
            {item.type === 'addition' ? 'Addition' : 'Renovation'}
          </span>
        </td>
        <td className="px-3 py-3 text-right text-white font-mono tabular-nums font-medium">
          {fmt(item.cost)}
        </td>
        <td className="px-3 py-3 text-right text-purple-400/40 font-mono tabular-nums text-xs" colSpan={2}>
          {hasDetails ? (
            <span className="text-purple-400/50 text-xs">{expanded ? 'hide detail' : 'see detail'}</span>
          ) : '—'}
        </td>
        <td className="px-3 py-3 text-right text-emerald-300 font-mono tabular-nums">
          +{fmt(item.valueAdded)}
        </td>
      </tr>
      {expanded && details?.map((d) => <DetailRow key={d.id} item={d} />)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Trade rollup mini-table                                             */
/* ------------------------------------------------------------------ */

function TradeRollup({ tradeRollup }: { tradeRollup: ItemizedResult['tradeRollup'] }) {
  const sorted = Object.entries(tradeRollup).sort(([, a], [, b]) => b.totalCost - a.totalCost);
  if (sorted.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={16} className="text-purple-300/70" />
        <h4 className="text-sm font-semibold text-white">Cost by Trade</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map(([trade, data]) => (
          <div
            key={trade}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="text-purple-300/80 text-sm mr-2 break-words">{trade}</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-mono tabular-nums">
              <span className="text-purple-400/50">{fmt(data.materialCost)} mat</span>
              <span className="text-purple-400/50">{fmt(data.laborCost)} labor</span>
              <span className="text-white font-medium">{fmt(data.totalCost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full table (desktop)                                                */
/* ------------------------------------------------------------------ */

interface EstimateTableProps {
  result: ItemizedResult;
  costToMove: number;
  betterOffRenovating: number;
}

function EstimateTable({ result, costToMove, betterOffRenovating }: EstimateTableProps) {
  const { summaryItems, detailsByGroup, totalCost, totalValue, netTotal } = result;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto max-h-[70vh] md:max-h-[520px] overflow-y-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[740px] text-sm">
        <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <tr className="border-b border-white/10 text-left text-purple-300/80 uppercase tracking-wider text-xs">
            <th className="px-3 py-3 font-medium">Item</th>
            <th className="px-2 py-3 font-medium">Category</th>
            <th className="px-2 py-3 font-medium text-center">Type</th>
            <th className="px-3 py-3 font-medium text-right">Cost</th>
            <th className="px-3 py-3 font-medium text-right" colSpan={2}>Material / Labor</th>
            <th className="px-3 py-3 font-medium text-right">Value Added</th>
          </tr>
        </thead>
        <tbody>
          {summaryItems.map((item) => (
            <SummaryRow
              key={item.id}
              item={item}
              details={item.groupKey ? detailsByGroup[item.groupKey] : undefined}
              expanded={!!item.groupKey && expandedGroups.has(item.groupKey)}
              onToggle={() => item.groupKey && toggle(item.groupKey)}
            />
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm">
          <tr className="border-t-2 border-white/20">
            <td className="px-3 py-4" colSpan={3}>
              <span className="text-white font-bold uppercase tracking-wider text-xs">Total</span>
              <span className="block text-purple-400/60 text-xs mt-0.5">{summaryItems.length} items</span>
            </td>
            <td className="px-3 py-4 text-right text-white font-mono font-bold text-base">
              {fmt(totalCost)}
            </td>
            <td className="px-3 py-4" colSpan={2} />
            <td className="px-3 py-4 text-right text-emerald-300 font-mono font-bold text-base">
              +{fmt(totalValue)}
            </td>
          </tr>
          <tr className="border-t border-white/10">
            <td className="px-3 py-3" colSpan={4}>
              <span className="text-xs text-purple-400/60 uppercase tracking-wider">Net (Value − Cost)</span>
            </td>
            <td className="px-3 py-3 text-right" colSpan={3}>
              <span className={`font-mono font-bold text-base ${netTotal >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
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

/* ------------------------------------------------------------------ */
/*  Mobile card                                                         */
/* ------------------------------------------------------------------ */

function EstimateCard({ item, details }: { item: ItemizedLineItem; details?: ItemizedLineItem[] }) {
  const [open, setOpen] = useState(false);
  const net = item.valueAdded - item.cost;
  const hasDetails = details && details.length > 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-2">
      <div
        className={`flex items-start justify-between gap-2 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? () => setOpen(!open) : undefined}
      >
        <span className="text-white font-medium text-sm flex items-center gap-1">
          {hasDetails && (
            <ChevronRight size={14} className={`text-purple-400/60 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
          )}
          {item.label}
        </span>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${item.type === 'addition' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'}`}>
          {item.type === 'addition' ? 'Add' : 'Reno'}
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
      {open && details && (
        <div className="mt-1 space-y-1 pl-3 border-l-2 border-purple-500/20">
          {details.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-xs py-1">
              <div>
                <span className="text-purple-300/70">{d.surface ?? d.label}</span>
                {d.material && <span className="block text-purple-400/40 text-[10px]">{d.material}</span>}
              </div>
              <span className="font-mono tabular-nums text-white/60">{fmt(d.cost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function ItemizedBill() {
  const projectCtx = useProjectOptional();
  const project = projectCtx?.project;
  const wishlist = project?.wishlist;
  const currentHomeValue = project?.property?.currentValue ?? DEFAULT_CURRENT_HOME_VALUE;
  const [fullViewOpen, setFullViewOpen] = useState(false);

  // Build itemized costs from selections
  const result = useMemo<ItemizedResult>(() => {
    if (!wishlist) {
      // Fallback: use MASTER_RENOVATION_ITEMS if no wishlist
      const fallbackItems: ItemizedLineItem[] = MASTER_RENOVATION_ITEMS.map((mi) => ({
        ...mi,
        room: mi.category,
        isDetail: false,
      }));
      const tc = fallbackItems.reduce((s, i) => s + i.cost, 0);
      const tv = fallbackItems.reduce((s, i) => s + i.valueAdded, 0);
      return {
        allItems: fallbackItems,
        summaryItems: fallbackItems,
        detailsByGroup: {},
        totalCost: tc,
        totalValue: tv,
        netTotal: tv - tc,
        tradeRollup: {},
      };
    }

    return buildItemizedCosts({
      bedrooms: wishlist.bedrooms,
      bathrooms: wishlist.bathrooms,
      bedTiles: wishlist.bedTiles,
      bathTiles: wishlist.bathTiles,
      bathQuality: (wishlist as any).bathQuality ?? 'premium',
      kitchenLevel: wishlist.kitchenLevel,
      flooring: wishlist.flooring,
      pool: wishlist.pool,
      homeStyle: wishlist.homeStyle,
      homeSqft: project?.property?.sqft || undefined,
      roomFeatures: wishlist.roomFeatures,
      kitchenFeatures: wishlist.kitchenFeatures,
      bathroomFeatures: wishlist.bathroomFeatures,
      interiorDetails: wishlist.interiorDetails,
      exteriorDetails: wishlist.exteriorDetails,
      outdoorFeatures: wishlist.outdoorFeatures,
      systemsDetails: wishlist.systemsDetails,
    });
  }, [wishlist, project?.property?.sqft]);

  const { totalCost, totalValue, netTotal } = result;
  const postRenovationValue = currentHomeValue + totalValue;
  const costToMove = estimateCostToMove(currentHomeValue, postRenovationValue);
  const betterOffRenovating = netTotal >= 0 ? costToMove : costToMove - Math.abs(netTotal);

  const tableBlock = (
    <>
      <EstimateTable
        result={result}
        costToMove={costToMove}
        betterOffRenovating={betterOffRenovating}
      />
      <TradeRollup tradeRollup={result.tradeRollup} />
    </>
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
          {result.summaryItems.map((item) => (
            <EstimateCard
              key={item.id}
              item={item}
              details={item.groupKey ? result.detailsByGroup[item.groupKey] : undefined}
            />
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-gray-900/95 p-4">
          <div className="flex justify-between items-baseline">
            <span className="text-white font-bold uppercase tracking-wider text-xs">Total</span>
            <span className="text-white font-mono font-bold text-lg tabular-nums">{fmt(totalCost)}</span>
          </div>
          <p className="text-purple-400/60 text-xs mt-1">{result.summaryItems.length} items</p>
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
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden"
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
