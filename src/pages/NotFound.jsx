import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import StarField from '../components/visuals/StarField';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-navy-900 px-4 font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(30,167,255,0.22),transparent_40%),radial-gradient(circle_at_78%_82%,rgba(123,77,255,0.22),transparent_42%)]" />
      <div className="absolute inset-0 bg-grid-faint bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      <StarField />
      <div className="absolute inset-0 noise" />

      <div className="relative max-w-md text-center">
        <div className="mb-10 flex justify-center">
          <BrandLogo to="/" size="sm" dark />
        </div>

        <div className="text-[7rem] font-extrabold leading-none tracking-tight">
          <span className="text-gradient">404</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">This page drifted off the map</h1>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-slate-400">
          Like an unhappy customer before they reach Google — let&apos;s get you back on track.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary justify-center">
            <Home size={18} />
            Go home
          </Link>
          <button onClick={() => window.history.back()} className="btn-dark-outline justify-center">
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
