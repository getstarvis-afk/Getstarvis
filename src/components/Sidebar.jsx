import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Star, BarChart2, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';
import BrandLogo from './BrandLogo';

const navItems = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',      exact: true  },
  { to: '/dashboard/customers', icon: Users,           label: 'Customers',      exact: false },
  { to: '/dashboard/reviews',   icon: Star,            label: 'Reviews',        exact: false },
  { to: '/dashboard/analytics', icon: BarChart2,       label: 'Analytics',      exact: false },
  { to: '/dashboard/settings',  icon: Settings,        label: 'Settings',       exact: false },
  { to: '/dashboard/help',      icon: HelpCircle,      label: 'Help & Support', exact: false },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();

  const isActive = (item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-[#081120] flex flex-col border-r border-white/10 flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <BrandLogo to="/dashboard" size="sm" dark />
        {user && <p className="text-slate-500 text-xs mt-1 truncate">{user.email}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon   = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium
                              transition-all duration-200 select-none
                              ${active
                                ? 'bg-gradient-to-r from-sky-500/90 to-violet-500/90 text-white shadow-lg shadow-sky-500/25'
                                : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
                  )}
                  <Icon size={18} className={active ? '' : 'transition-transform duration-200 group-hover:scale-110'} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                     text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
