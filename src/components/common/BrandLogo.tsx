import React from 'react';

interface BrandLogoProps {
  badge?: string;
}

/**
 * Official AgriOrbit logo (public/assets/agriorbit-logo.png).
 * The artwork ships on a black background, so it renders with
 * mix-blend-screen: black pixels dissolve into our dark UI while every
 * logo color pixel shows exactly as designed. No extra background,
 * no stretching — aspect ratio preserved via object-contain.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ badge }) => (
  <div className="flex items-center gap-3 mr-4 sm:mr-8 shrink-0">
    <img
      src="/assets/agriorbit-logo.png"
      alt="AgriOrbit"
      className="w-[90px] h-auto object-contain mix-blend-screen shrink-0"
      draggable={false}
    />
    <div className="shrink-0">
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      <p className="hidden sm:block text-[11px] text-[#8FA3B8] font-medium whitespace-nowrap">Team: Bay of Orbits</p>
    </div>
  </div>
);
