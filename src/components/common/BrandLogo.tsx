import React from 'react';

interface BrandLogoProps {
  badge?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ badge }) => (
  <a href="#" className="flex items-center gap-3 shrink-0 group">
    <img
      src="/assets/agriorbit-logo.png"
      alt="AgriOrbit"
      className="h-9 w-auto object-contain mix-blend-screen shrink-0"
      draggable={false}
    />
    <div className="flex items-center gap-2">
      <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-[#B8FF3D] transition-colors">
        AgriOrbit
      </span>
      {badge && (
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 whitespace-nowrap hidden sm:inline-block">
          {badge}
        </span>
      )}
    </div>
  </a>
);
