import React from 'react';
import { Satellite } from 'lucide-react';

interface BrandLogoProps {
  badge: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ badge }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-[#00E5FF] p-0.5 flex items-center justify-center shadow-lg shadow-black/50">
      <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
        <Satellite className="w-5 h-5 text-[#00E5FF]" />
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-black tracking-tight text-xl text-white">AGRIORBIT</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
          {badge}
        </span>
      </div>
      <p className="text-[11px] text-[#8FA3B8] font-medium">Team: Bay of Orbits</p>
    </div>
  </div>
);
