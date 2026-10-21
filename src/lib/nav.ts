// Tiny navigation helpers (hash-based, see App.tsx).
export const goAnalyze = () => {
  window.location.hash = '#/dashboard';
};
export const goDashboard = () => {
  window.location.hash = '#/dashboard';
};
export const goHome = () => {
  window.location.hash = '';
};
