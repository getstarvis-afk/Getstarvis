import { Link } from 'react-router-dom';
import logoUrl from '../assets/starvis-logo.png';

export default function BrandLogo({
  to,
  size = 'md',
  className = '',
  markOnly = false,
  dark = false,
}) {
  const sizes = {
    sm: markOnly ? 'h-8 w-8' : 'h-8 w-auto',
    md: markOnly ? 'h-10 w-10' : 'h-10 w-auto',
    lg: markOnly ? 'h-14 w-14' : 'h-14 w-auto',
  };

  const image = (
    <img
      src={logoUrl}
      alt="Starvis"
      className={`${sizes[size] || sizes.md} ${markOnly ? 'object-cover object-left rounded-xl' : 'object-contain'} ${className}`}
    />
  );

  const fallback = (
    <span className={`font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>
      Starvis
    </span>
  );

  const content = (
    <span className="inline-flex items-center gap-2">
      {image}
      {markOnly && fallback}
    </span>
  );

  return to ? (
    <Link to={to} className="inline-flex items-center">
      {content}
    </Link>
  ) : content;
}
