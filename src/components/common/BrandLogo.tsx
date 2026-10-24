import React from 'react';

interface BrandLogoProps {
  badge?: string;
  className?: string;
  imgClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className, imgClassName }) => (
  <a
    href="#"
    aria-label="AgriOrbit"
    className={`inline-flex items-center shrink-0 group ${className || ''}`}
  >
    <picture className="shrink-0 flex items-center">
      <source srcSet="/logo.webp" type="image/webp" />
      <source srcSet="/agriorbit-logo.webp" type="image/webp" />
      <img
        src="/logo.png"
        alt="AgriOrbit"
        className={imgClassName || 'h-8 sm:h-9 md:h-10 w-auto object-contain mix-blend-screen shrink-0'}
        draggable={false}
      />
    </picture>
  </a>
);
