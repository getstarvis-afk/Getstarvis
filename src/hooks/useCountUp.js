import { useEffect, useRef, useState } from 'react';

// Ease-out-expo — fast start, gentle landing. Feels premium, not mechanical.
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates a number from 0 → target once `play` becomes true.
 * Returns the raw float; let the caller format it (decimals / separators).
 * Honours prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target, { duration = 1500, play = true } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!play || started.current) return;
    started.current = true;

    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      frame.current = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(frame.current);
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(target * easeOutExpo(t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [play, target, duration]);

  return value;
}
