import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * Animated count-up number that fires the first time it scrolls into view.
 * <Counter value={1842} />  ·  <Counter value={4.9} decimals={1} />
 * <Counter value={76} suffix="%" />  ·  <Counter value={2418} prefix="$" />
 */
export default function Counter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1600,
  className = '',
}) {
  const ref = useRef(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setPlay(true); io.disconnect(); }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = useCountUp(value, { duration, play });
  const formatted = current.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
