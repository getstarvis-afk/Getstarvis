// Floating, twinkling review "particles" — the glowing star dust behind the
// hero. Positions are deterministic so they never reshuffle between renders.
const PARTICLES = Array.from({ length: 30 }, (_, i) => {
  const r = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    top: `${(r(2) * 100).toFixed(2)}%`,
    size: 2 + Math.round(r(3) * 3),
    delay: `${(r(4) * -8).toFixed(2)}s`,
    dur: `${(3 + r(5) * 4).toFixed(2)}s`,
    iris: r(6) > 0.55,
    spark: r(7) > 0.82,
  };
});

export default function StarField({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {PARTICLES.map((p, i) =>
        p.spark ? (
          <span
            key={i}
            className="absolute animate-float text-azure/70"
            style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.dur, fontSize: `${p.size + 8}px` }}
          >
            ✦
          </span>
        ) : (
          <span
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.dur,
              background: p.iris ? '#a78bfa' : '#7cc4ff',
              boxShadow: p.iris
                ? '0 0 8px 1px rgba(123,77,255,0.7)'
                : '0 0 8px 1px rgba(30,167,255,0.7)',
            }}
          />
        ),
      )}
    </div>
  );
}
