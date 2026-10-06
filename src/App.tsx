// Two screens, no router library: "#/analyze" shows the tool, anything else
// shows the landing page. Plain section anchors (#data, #rotation…) still work.

import { useEffect, useState } from 'react';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { AnalyzePage } from './components/analyze/AnalyzePage.tsx';

type Route = 'landing' | 'analyze';
const currentRoute = (): Route => (window.location.hash.startsWith('#/analyze') ? 'analyze' : 'landing');

export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onHash = () => {
      const next = currentRoute();
      setRoute((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route === 'analyze' ? <AnalyzePage /> : <LandingPage />;
}
