import { useMemo } from 'react';
import { BUNDLED_RANGPUR } from '../../lib/data.ts';
import { computeConditions } from '../../lib/conditions.ts';
import { computeFieldShift } from '../../lib/fieldShift.ts';
import { Nav } from './Nav.tsx';
import { Hero } from './Hero.tsx';
import { Steps } from './Steps.tsx';
import { FieldShiftSection } from './FieldShiftSection.tsx';
import { EditorialCropAtlas } from './EditorialCropAtlas.tsx';
import { WhySection } from './WhySection.tsx';
import { DataSection } from './DataSection.tsx';
import { RotationSection } from './RotationSection.tsx';
import { FinalCta, Footer } from './FinalCta.tsx';

export function LandingPage() {
  // Landing uses the bundled Rangpur snapshot: instant, works offline, real numbers.
  const conditions = useMemo(() => computeConditions(BUNDLED_RANGPUR.daily, BUNDLED_RANGPUR.lat), []);
  const shift = useMemo(() => computeFieldShift(BUNDLED_RANGPUR.monthly), []);

  return (
    <>
      <Nav />
      <main>
        <Hero conditions={conditions} shift={shift} />
        <Steps />
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
