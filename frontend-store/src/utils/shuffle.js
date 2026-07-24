/**
 * Mulberry32 PRNG (Pseudo-Random Number Generator)
 * Returns a function that produces deterministic random floats between 0 and 1 for a given integer seed.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates Shuffle
 * Deterministically shuffles an array based on a seed.
 */
export function seededShuffle(array, seed) {
  if (!Array.isArray(array) || array.length <= 1) return array;
  const result = [...array];
  const random = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Retrieves or generates a numeric seed stored in sessionStorage.
 * Persists for the duration of the browser session (cleared when tab/window closes).
 */
export function getSessionShuffleSeed() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return 12345; // Fallback for SSR / crawlers
  }

  const STORAGE_KEY = 'photowala_product_shuffle_seed';
  let seedStr = sessionStorage.getItem(STORAGE_KEY);

  if (!seedStr) {
    // Generate a random 32-bit positive integer seed
    const newSeed = Math.floor(Math.random() * 0x7fffffff) + 1;
    seedStr = String(newSeed);
    try {
      sessionStorage.setItem(STORAGE_KEY, seedStr);
    } catch (e) {
      console.warn('Unable to store shuffle seed in sessionStorage:', e);
    }
  }

  return parseInt(seedStr, 10) || 12345;
}
