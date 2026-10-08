import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navClass = scrolled
    ? 'border-white/10 bg-navy-900/80 shadow-2xl shadow-black/30 backdrop-blur-xl backdrop-saturate-150'
    : 'border-transparent bg-transparent';

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${navClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo to="/" size="sm" dark />

        <div className="hidden items-center gap-7 md:flex">
          <button onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Features</button>
          <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">How it works</button>
          <button onClick={() => scrollTo('pricing')} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Pricing</button>
          <Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Login</Link>
          <Link to="/signup" className="btn-primary text-sm">Start Free Trial</Link>
        </div>

        <button
          onClick={() => setMenuOpen(open => !open)}
          className="rounded-xl border border-white/10 p-2 text-slate-200 transition-colors hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#081120] px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <button onClick={() => scrollTo('features')} className="text-left text-sm font-medium text-slate-300">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left text-sm font-medium text-slate-300">How it works</button>
            <button onClick={() => scrollTo('pricing')} className="text-left text-sm font-medium text-slate-300">Pricing</button>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-300">Login</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn-primary justify-center text-sm">Start Free Trial</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
