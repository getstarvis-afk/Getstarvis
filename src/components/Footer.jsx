import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const columns = [
  {
    title: 'Product',
    links: [
      ['Features', '#features'],
      ['Pricing', '#pricing'],
      ['How it works', '#how-it-works'],
      ['Free trial', '/signup'],
    ],
  },
  {
    title: 'Use cases',
    links: [
      ['Auto detailing', null],
      ['HVAC contractors', null],
      ['Restaurants', null],
      ['Local services', null],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Contact', '/contact'],
      ['Help & support', '/login'],
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
      ['Refund Policy', '/refund-policy'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-navy-900 px-4 py-14 text-slate-400">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-azure/40 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo to="/" size="sm" dark />
            <p className="mt-4 max-w-xs text-sm leading-6">
              Intelligent reputation automation for local service businesses.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white">{col.title}</h4>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href == null ? (
                      <span className="text-slate-400">{label}</span>
                    ) : href.startsWith('#') ? (
                      <a href={href} className="transition-colors hover:text-white">{label}</a>
                    ) : (
                      <Link to={href} className="transition-colors hover:text-white">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Starvis — a product by Alio. All rights reserved.</p>
          <a href="mailto:contact@alioapp.fr" className="font-medium text-azure-light transition-colors hover:text-white">
            contact@alioapp.fr
          </a>
        </div>
      </div>
    </footer>
  );
}
