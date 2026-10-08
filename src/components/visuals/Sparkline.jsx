import { useId } from 'react';

/**
 * Tiny inline trend chart for stat cards. Pure SVG, no deps.
 * <Sparkline data={[4,7,6,9,8,12,11,15]} />
 */
export default function Sparkline({
  data = [],
  width = 120,
  height = 36,
  stroke = '#1EA7FF',
  fill = true,
  className = '',
  animate = true,
}) {
  const gid = useId().replace(/[:]/g, '');
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 3;

  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y];
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const lastX = pts[pts.length - 1][0];
  const lastY = pts[pts.length - 1][1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spk-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spk-${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animate ? { strokeDasharray: 600, strokeDashoffset: 600, animation: 'dash 1.6s cubic-bezier(0.22,1,0.36,1) 0.2s forwards' } : undefined}
      />
      <circle cx={lastX} cy={lastY} r="2.6" fill={stroke}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
