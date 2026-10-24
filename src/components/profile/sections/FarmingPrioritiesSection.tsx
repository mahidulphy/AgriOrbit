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
}[] = [
  { id: 'save_water', icon: Droplets },
  { id: 'improve_soil', icon: Sprout },
  { id: 'lower_cost', icon: Coins },
  { id: 'reduce_risk', icon: ShieldCheck },
  { id: 'higher_income', icon: TrendingUp },
  { id: 'quick_harvest', icon: Clock },
  { id: 'family_food', icon: Sprout },
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
      <div className="border-b border-[#262626] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#FAFAFA] flex items-center gap-2">
            <Star className="w-5 h-5 text-[#22C55E]" />
            <span>{isBn ? 'চাষের প্রধান চাহিদা' : 'Farming Goals & Priorities'}</span>
          </h2>
          <p className="text-xs text-[#737373] mt-1">
            {isBn
              ? `আপনার প্রধান চাহিদাগুলো বেছে নিন (সর্বোচ্চ ${maxSelectable}টি)। আমাদের নিয়মগুলো সে অনুযায়ী ফসল সাজাবে।`
              : `Select your key goals (up to ${maxSelectable}). Our engine steers recommendations to match your targets.`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded-md bg-[#0A0A0A] border border-[#262626] text-xs font-mono">
          <span className="text-[#737373]">{isBn ? 'নির্বাচিত:' : 'Selected:'}</span>
          <span className={`font-semibold ${selectedPriorities.length > 0 ? 'text-[#FAFAFA]' : 'text-[#737373]'}`}>
            {selectedPriorities.length} / {maxSelectable}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Priority Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ORDERED_PRIORITIES.map(({ id, icon: Icon }) => {
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
              className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between min-h-[130px] select-none text-left ${
                isPrimary
                  ? 'bg-[#141414] border-[#22C55E]'
                  : isSecondary
                  ? 'bg-[#141414] border-[#A3A3A3]'
                  : 'bg-[#0A0A0A] border-[#262626] hover:border-[#404040]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[#141414] border border-[#262626] text-[#A3A3A3]">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-[#FAFAFA]">
                      {isBn ? meta.titleBn : meta.titleEn}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 text-xs transition-colors border ${
                      isPrimary
                        ? 'bg-[#22C55E] text-black border-[#22C55E]'
                        : isSecondary
                        ? 'bg-[#FAFAFA] text-black border-[#FAFAFA]'
                        : 'border-[#262626] bg-transparent text-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-[#737373] leading-relaxed line-clamp-3">
                  {isBn ? influence.bn : influence.en}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono">
                  <span className={isPrimary ? 'text-[#22C55E] font-medium' : 'text-[#A3A3A3]'}>
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
                      className="text-xs text-[#737373] hover:text-[#FAFAFA] underline cursor-pointer"
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
