import React from 'react';
import {
  Star,
  Droplets,
  Sprout,
  Coins,
  ShieldCheck,
  TrendingUp,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { FarmerPriorityId } from '../../../types';
import { PRIORITY_META, PRIORITY_INFLUENCE } from '../../../lib/cropSuitability';

export interface FarmingPrioritiesSectionProps {
  selectedPriorities: FarmerPriorityId[];
  onTogglePriority: (priorityId: FarmerPriorityId) => void;
  primaryPriority?: FarmerPriorityId;
  onSetPrimaryPriority?: (priorityId: FarmerPriorityId) => void;
  isBn: boolean;
  maxSelectable?: number;
  error?: string | null;
}

const ORDERED_PRIORITIES: {
  id: FarmerPriorityId;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { id: 'save_water', icon: Droplets, color: '#00E5FF' },
  { id: 'improve_soil', icon: Sprout, color: '#B8FF3D' },
  { id: 'lower_cost', icon: Coins, color: '#FCD34D' },
  { id: 'reduce_risk', icon: ShieldCheck, color: '#A78BFA' },
  { id: 'higher_income', icon: TrendingUp, color: '#34D399' },
  { id: 'quick_harvest', icon: Clock, color: '#F472B6' },
  { id: 'family_food', icon: Sprout, color: '#38BDF8' },
];

export const FarmingPrioritiesSection: React.FC<FarmingPrioritiesSectionProps> = ({
  selectedPriorities,
  onTogglePriority,
  primaryPriority,
  onSetPrimaryPriority,
  isBn,
  maxSelectable = 2,
  error,
}) => {
  return (
    <div className="space-y-6">
      {/* Header & Counter */}
      <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-[#B8FF3D]" />
            <span>{isBn ? 'চাষের লক্ষ্য ও অগ্রাধিকার' : 'Farming Goals & Priorities'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isBn
              ? `আপনার প্রধান চাষের লক্ষ্য নির্বাচন করুন (সর্বোচ্চ ${maxSelectable}টি)। আমাদের ইঞ্জিন পয়েন্ট সমন্বয় করবে।`
              : `Select your key goals (up to ${maxSelectable}). Our engine steers recommendations to match your targets.`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
          <span className="text-slate-400">{isBn ? 'নির্বাচিত:' : 'Selected:'}</span>
          <span className={`font-bold ${selectedPriorities.length > 0 ? 'text-[#B8FF3D]' : 'text-slate-500'}`}>
            {selectedPriorities.length} / {maxSelectable}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs sm:text-sm text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Priority Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORDERED_PRIORITIES.map(({ id, icon: Icon, color }) => {
          const meta = PRIORITY_META[id];
          const influence = PRIORITY_INFLUENCE[id];
          const isSelected = selectedPriorities.includes(id);
          const isPrimary = (primaryPriority || selectedPriorities[0]) === id;
          const isSecondary = isSelected && !isPrimary;

          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onTogglePriority(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTogglePriority(id);
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] select-none text-left ${
                isPrimary
                  ? 'bg-[#B8FF3D]/10 border-[#B8FF3D] shadow-lg shadow-[#B8FF3D]/10 ring-1 ring-[#B8FF3D]/40'
                  : isSecondary
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-lg shadow-[#00E5FF]/10'
                  : 'bg-[#0B1626] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-sm sm:text-base font-bold font-display ${
                        isPrimary ? 'text-[#B8FF3D]' : isSecondary ? 'text-[#00E5FF]' : 'text-white'
                      }`}
                    >
                      {isBn ? meta.titleBn : meta.titleEn}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all border ${
                      isPrimary
                        ? 'bg-[#B8FF3D] text-black border-[#B8FF3D]'
                        : isSecondary
                        ? 'bg-[#00E5FF] text-black border-[#00E5FF]'
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2 line-clamp-3">
                  {isBn ? influence.bn : influence.en}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span className={isPrimary ? 'text-[#B8FF3D] font-bold' : 'text-[#00E5FF]'}>
                    {isPrimary
                      ? isBn
                        ? '★ প্রধান লক্ষ্য'
                        : '★ Primary Goal'
                      : isBn
                      ? '২য় সহায়ক লক্ষ্য'
                      : 'Secondary Focus'}
                  </span>

                  {isSecondary && onSetPrimaryPriority && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimaryPriority(id);
                      }}
                      className="text-xs text-[#00E5FF] hover:underline cursor-pointer py-0.5"
                    >
                      {isBn ? 'প্রধান করুন' : 'Make Primary'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
