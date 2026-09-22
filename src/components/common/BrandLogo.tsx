import React from 'react';
import { Satellite } from 'lucide-react';

interface BrandLogoProps {
  badge: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ badge }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#A855F7] p-0.5 flex items-center justify-center shadow-lg shadow-[#6D28D9]/30">
      <div className="w-full h-full bg-[#2E1065] rounded-[10px] flex items-center justify-center">
        <Satellite className="w-5 h-5 text-[#E9D5FF]" />
      </div>
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-black tracking-tight text-xl text-white">AGRIORBIT</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#6D28D9] text-[#E9D5FF] border border-[#A855F7]/30">
          {badge}
        </span>
      </div>
      <p className="text-[11px] text-[#E9D5FF]/70 font-medium">Team: Bay of Orbits</p>
    </div>
  </div>
);
