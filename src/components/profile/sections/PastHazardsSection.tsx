import React from 'react';
import {
  AlertTriangle,
  Waves,
  Sun,
  Flame,
  CloudRain,
  Wind,
  Bug,
  Snowflake,
  ShieldCheck,
  Check,
  Droplets,
  Mountain,
} from 'lucide-react';
import { PAST_DAMAGE_OPTIONS } from '../../../data/farmerProfile';

export interface PastHazardsSectionProps {
  pastDamages: string[];
  onToggleDamage: (hazardId: string) => void;
  pastDamageNotes: string;
  onNotesChange: (notes: string) => void;
  isBn: boolean;
}

const HAZARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Waves,
  flash_flood: Waves,
  drought: Sun,
  salinity: Droplets,
  heat_wave: Flame,
  heat_stress: Flame,
  hailstorm: CloudRain,
  river_erosion: Mountain,
  pest_outbreak: Bug,
  pest_attack: Bug,
  cold_wave: Snowflake,
  waterlogging: Waves,
  cyclone: Wind,
  none: ShieldCheck,
};

export const PastHazardsSection: React.FC<PastHazardsSectionProps> = ({
  pastDamages,
  onToggleDamage,
  pastDamageNotes,
  onNotesChange,
  isBn,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>{isBn ? 'অতীতের প্রাকৃতিক দুর্যোগ ও ক্ষতি' : 'Past Hazard Exposure & Crop Loss'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isBn
            ? 'অতীতে আপনার এলাকায় যেসব প্রাকৃতিক দুর্যোগের শিকার হয়েছেন তা চিহ্নিত করুন। আমাদের ঝুঁকি অ্যালগরিদম এই অভিজ্ঞতা বিবেচনায় রাখবে।'
            : 'Select environmental hazards that previously damaged your crops so AgriOrbit factors vulnerability into recommendations.'}
        </p>
      </div>

      {/* Hazard Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PAST_DAMAGE_OPTIONS.map((opt) => {
          const isSelected =
            pastDamages.includes(opt.id) ||
            (opt.id === 'flood' && pastDamages.includes('flash_flood')) ||
            (opt.id === 'heat_wave' && pastDamages.includes('heat_stress')) ||
            (opt.id === 'pest_outbreak' && pastDamages.includes('pest_attack'));

          const IconComponent = HAZARD_ICONS[opt.id] || AlertTriangle;
          const isNone = opt.id === 'none';

          return (
            <button
              type="button"
              key={opt.id}
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggleDamage(opt.id)}
              className={`min-h-[52px] px-4 py-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border select-none ${
                isSelected
                  ? isNone
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200 font-bold shadow-lg shadow-emerald-500/10'
                    : 'bg-amber-500/15 border-amber-400 text-amber-200 font-bold shadow-lg shadow-amber-500/10'
                  : 'bg-[#0B1626] border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? isNone
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-amber-400/20 text-amber-300'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{isBn ? opt.bn : opt.en}</span>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs transition-all border ${
                  isSelected
                    ? isNone
                      ? 'bg-emerald-400 text-black border-emerald-400'
                      : 'bg-amber-400 text-black border-amber-400'
                    : 'border-white/20 bg-white/5 text-transparent'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes Box */}
      <div>
        <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
          {isBn ? 'ক্ষতির অতিরিক্ত বিবরণ বা স্মৃতিকথা (ঐচ্ছিক)' : 'Past Experience & Notes (Optional)'}
        </label>
        <textarea
          rows={3}
          value={pastDamageNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={
            isBn
              ? 'যেমন: গত বছর খরার কারণে বোরো মৌসুমে সেচ খরচ বেড়েছিল, অথবা আগাম বন্যায় আমনের চারা নষ্ট হয়েছিল...'
              : 'e.g. In 2024, unexpected drought increased irrigation bills by 30% during the Boro season...'
          }
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-base focus:border-[#00E5FF] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
};
