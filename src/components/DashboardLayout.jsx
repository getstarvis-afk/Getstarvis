import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { DashboardDataProvider } from '../context/DashboardDataContext';
import { useDashboardData } from '../context/useDashboardData';
import { useAuth } from '../context/useAuth';
import { canUseDemoMode } from '../config/devMode';
import ProductTour from './ProductTour';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/customers': 'Customers',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
  '/dashboard/help': 'Help & Support',
};

// Renders the guided product tour for first-time users. Lives inside
// DashboardDataProvider so it can read + write settings via context.
function TourWrapper({ children }) {
  const { settings, loadingSettings, saveSettings } = useDashboardData();
  const readyForTour = settings.onboardingComplete === true || !!settings.businessName;
  const showTour = !loadingSettings && readyForTour && settings.tourCompleted !== true;

  const handleDone = async () => {
    saveSettings({ tourCompleted: true }).catch(() => {});
  };

  return (
    <>
      {children}
      {showTour && <ProductTour onComplete={handleDone} onSkip={handleDone} />}
    </>
  );
}

function BillingGate({ children }) {
  const { user } = useAuth();
  const { settings, loadingSettings } = useDashboardData();
  const showDemoMode = canUseDemoMode(user);
  const billing = settings?.billing;

  if (loadingSettings) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-10 w-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!showDemoMode && !billing?.plan) {
    return <Navigate to="/choose-plan" replace />;
  }

  return (
    <>
      {billing?.status === 'pending_checkout' && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Complete your billing setup to activate your Starvis workspace.
        </div>
      )}
      {children}
    </>
  );
}

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const pageTitle = title || TITLES[pathname] || 'Dashboard';
  const showDemoMode = canUseDemoMode(user);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-950">{pageTitle}</h1>
              <p className="hidden text-xs font-medium text-slate-400 sm:block">Starvis reputation workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showDemoMode && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold tracking-wide text-amber-700">
                DEMO MODE
              </span>
            )}
            <div className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-600 font-bold text-sm sm:flex">
              <span>Starvis</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <DashboardDataProvider>
            <BillingGate>
              <TourWrapper>
                {children || <Outlet />}
              </TourWrapper>
            </BillingGate>
          </DashboardDataProvider>
        </main>
      </div>
    </div>
  );
}
