import { useState, useEffect, useMemo } from 'react';
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
import { FinalCta, Footer } from './FinalCta.tsx';

export function LandingPage() {
  // Landing starts with bundled Rangpur snapshot: instant render, zero loading screen, works offline
  const [locationData, setLocationData] = useState<LocationCache>(BUNDLED_RANGPUR);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let active = true;
    loadDistrict('rangpur')
      .then((res) => {
        if (active && res.mode === 'live') {
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
        <RotationSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
