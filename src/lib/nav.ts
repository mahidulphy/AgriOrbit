// Tiny navigation helpers (hash-based, see App.tsx).
export const goAnalyze = () => {
  window.location.hash = '/analyze';
};
export const goHome = () => {
  window.location.hash = '';
};
