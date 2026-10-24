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
      <div className="border-b border-[#262626] pb-4">
        <h2 className="font-display text-lg font-semibold text-[#FAFAFA] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          <span>{isBn ? 'অতীতের প্রাকৃতিক দুর্যোগ ও ক্ষতি' : 'Past Hazard Exposure & Crop Loss'}</span>
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          {isBn
            ? 'অতীতে আপনার এলাকায় যেসব প্রাকৃতিক দুর্যোগের শিকার হয়েছেন তা চিহ্নিত করুন। আমাদের ঝুঁকি অ্যালগরিদম এই অভিজ্ঞতা বিবেচনায় রাখবে।'
            : 'Select environmental hazards that previously damaged your crops so AgriOrbit factors vulnerability into recommendations.'}
        </p>
      </div>

      {/* Hazard Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {PAST_DAMAGE_OPTIONS.map((opt) => {
          const isSelected =
            pastDamages.includes(opt.id) ||
            (opt.id === 'flood' && pastDamages.includes('flash_flood')) ||
            (opt.id === 'heat_wave' && pastDamages.includes('heat_stress')) ||
            (opt.id === 'pest_outbreak' && pastDamages.includes('pest_attack'));

          const IconComponent = HAZARD_ICONS[opt.id] || AlertTriangle;

          return (
            <button
              type="button"
              key={opt.id}
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggleDamage(opt.id)}
              className={`min-h-[48px] px-3.5 py-2.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer border select-none ${
                isSelected
                  ? 'bg-[#141414] border-[#22C55E] text-[#FAFAFA]'
                  : 'bg-[#0A0A0A] border-[#262626] text-[#A3A3A3] hover:border-[#404040] hover:text-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-[#141414] border border-[#262626] text-[#737373]">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium">{isBn ? opt.bn : opt.en}</span>
              </div>

              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-xs transition-colors border ${
                  isSelected
                    ? 'bg-[#22C55E] text-black border-[#22C55E]'
                    : 'border-[#262626] bg-transparent text-transparent'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes Box */}
      <div>
        <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
          {isBn ? 'ক্ষতির অতিরিক্ত বিবরণ বা স্মৃতিকথা (ঐচ্ছিক)' : 'Past Experience & Notes (Optional)'}
        </label>
        <textarea
          rows={3}
          value={pastDamageNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={
            isBn
              ? 'যেমন: গত বছর খরার কারণে বোরো মৌসুমে সেচ খরচ বেড়েছিল, অথবা আগাম বন্যায় আমনের চারা নষ্ট হয়েছিল...'
              : 'e.g. In 2024, unexpected drought increased irrigation bills during the Boro season...'
          }
          className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none transition-colors placeholder:text-[#737373]"
        />
      </div>
    </div>
  );
};
