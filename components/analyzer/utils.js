// Format time in ms to a more readable format
export const formatTime = (ms) => {
  if (!ms && ms !== 0) return '0ms';
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}; 