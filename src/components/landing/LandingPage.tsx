import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { BUNDLED_RANGPUR, loadDistrict } from '../../lib/data.ts';
import type { LocationCache } from '../../lib/power.ts';
import { computeConditions } from '../../lib/conditions.ts';
import { computeFieldShift } from '../../lib/fieldShift.ts';
import { Nav } from './Nav.tsx';
import { Hero } from './Hero.tsx';

import { FieldShiftSection } from './FieldShiftSection.tsx';
import { EditorialCropAtlas } from './EditorialCropAtlas.tsx';
import { WhySection } from './WhySection.tsx';
import { DataSection } from './DataSection.tsx';
import { RotationSection } from './RotationSection.tsx';
import { StudyMaterialsSection } from './StudyMaterialsSection.tsx';
import { FinalCta, Footer } from './FinalCta.tsx';

// Leaflet is only needed for the interactive map section, so keep it out of the
// initial landing bundle until the section approaches the viewport.
const MapSection = lazy(() =>
  import('./MapSection.tsx').then((module) => ({ default: module.MapSection }))
);

export function LandingPage() {
  // Landing starts with bundled Rangpur snapshot: instant render, zero loading screen, works offline
  const [locationData, setLocationData] = useState<LocationCache>(BUNDLED_RANGPUR);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let active = true;
    loadDistrict('rangpur')
      .then((res) => {
        if (active && res.mode === 'live' && res.data) {
          setLocationData(res.data);
          setIsLive(true);
        }
      })
      .catch(() => {
        // keep bundled snapshot on error or timeout
      });
    return () => {
      active = false;
    };
  }, []);

  const conditions = useMemo(
    () => computeConditions(locationData.daily, locationData.lat),
    [locationData.daily, locationData.lat]
  );
  const shift = useMemo(
    () => computeFieldShift(locationData.monthly, 'rangpur'),
    [locationData.monthly]
  );

  return (
    <>
      <Nav />
      <main>
        <Hero conditions={conditions} shift={shift} isLive={isLive} />

        <FieldShiftSection shift={shift} />
        <EditorialCropAtlas />
        <WhySection />
        <DataSection />
        <Suspense
          fallback={
            <div className="border-b border-[#262626] py-20 md:py-28">
              <div className="container-x">
                <div className="h-48 animate-pulse rounded-xl border border-[#262626] bg-[#141414]" />
              </div>
            </div>
          }
        >
          <MapSection />
        </Suspense>
        <RotationSection />
        <StudyMaterialsSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
