import { useEffect, useState } from 'react';

export function useMotion() {
  const [reducedByUser, setReducedByUser] = useState(() => {
    try {
      return localStorage.getItem('drgg.motion') === 'reduced';
    } catch {
      return false;
    }
  });
  const [reducedBySystem, setReducedBySystem] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedBySystem(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('drgg.motion', reducedByUser ? 'reduced' : 'full');
    } catch {}
  }, [reducedByUser]);
  useEffect(() => {
    document.documentElement.dataset.motion = reducedBySystem || reducedByUser ? 'reduced' : 'full';
  }, [reducedBySystem, reducedByUser]);
  useEffect(() => {
    const visibility = () => {
      document.documentElement.dataset.motionPaused = String(document.hidden);
    };
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  return {
    reducedMotion: reducedByUser || reducedBySystem,
    reducedBySystem,
    toggleMotion: () => setReducedByUser((v) => !v),
  };
}
