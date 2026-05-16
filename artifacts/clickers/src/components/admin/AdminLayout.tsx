import { useState, useCallback, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Users, Globe, PenTool,
  ShoppingBag, BarChart3, Download, LogOut, ChevronRight, Play, Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminOrderNotifications, type NewOrderPayload } from '@/hooks/useAdminOrderNotifications';
import { OrderNotificationToasts } from '@/components/admin/OrderNotifications';

interface OrderToast extends NewOrderPayload { toastId: string; }

let toastCounter = 0;

const navItems = [
  { href: '/admin',           label: 'Dashboard',       labelAr: 'لوحة التحكم',    icon: LayoutDashboard },
  { href: '/admin/books',     label: 'Books',           labelAr: 'الكتب',          icon: BookOpen },
  { href: '/admin/authors',   label: 'Authors',         labelAr: 'الكتّاب',        icon: Users },
  { href: '/admin/worlds',    label: 'Worlds',          labelAr: 'العوالم',        icon: Globe },
  { href: '/admin/blog',      label: 'Blog',            labelAr: 'المدونة',        icon: PenTool },
  { href: '/admin/orders',    label: 'Orders',          labelAr: 'الطلبات',        icon: ShoppingBag },
  { href: '/admin/analytics', label: 'Analytics',       labelAr: 'التحليلات',      icon: BarChart3 },
  { href: '/admin/media',     label: 'Media Hub',       labelAr: 'الوسائط',        icon: Play },
  { href: '/admin/exports',   label: 'Export Reports',  labelAr: 'تصدير التقارير', icon: Download },
];

function AdminSidebar({
  newOrderCount,
  onBellClick,
}: {
  newOrderCount: number;
  onBellClick: () => void;
}) {
  const [location] = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 bg-primary min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/10">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-primary font-cinematic font-bold text-lg">ز</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm font-arabic">زحمة كتاب</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </Link>
      </div>

      {/* New orders notification bell (inside sidebar) */}
      {newOrderCount > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={onBellClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent text-primary font-black text-sm animate-pulse hover:animate-none hover:bg-accent/90 transition-all"
          >
            <Bell size={16} />
            <span className="flex-1 text-left">
              {newOrderCount} New Order{newOrderCount > 1 ? 's' : ''}!
            </span>
            <span className="w-6 h-6 bg-primary text-accent rounded-full text-xs font-black flex items-center justify-center">
              {newOrderCount > 9 ? '9+' : newOrderCount}
            </span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
          const Icon = item.icon;
          const isOrders = item.href === '/admin/orders';
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent text-primary shadow-lg shadow-accent/20'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} />
                <span className="font-bold text-sm flex-1">{item.label}</span>
                {/* Badge on Orders nav item */}
                {isOrders && newOrderCount > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white rounded-full text-\[11px\] font-black flex items-center justify-center">
                    {newOrderCount > 9 ? '9+' : newOrderCount}
                  </span>
                )}
                {isActive && !newOrderCount && <ChevronRight size={14} />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="p-4 border-t border-white/10">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-9 h-9 bg-accent/20 rounded-xl flex items-center justify-center text-accent font-bold text-sm">
              {profile.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{profile.full_name || profile.email}</p>
              <p className="text-white/40 text-xs capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all duration-200 font-bold text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [toasts, setToasts] = useState<OrderToast[]>([]);

  const handleNewOrder = useCallback((order: NewOrderPayload) => {
    const toastId = `toast-${++toastCounter}`;
    setToasts((prev) => [{ ...order, toastId }, ...prev]);
    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 12000);
  }, []);

  const { requestPermission } = useAdminOrderNotifications(handleNewOrder, isAdmin);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F3EF]">
      <AdminSidebar
        newOrderCount={toasts.length}
        onBellClick={() => navigate('/admin/orders')}
      />
      <main className="flex-1 overflow-auto">
        {/* Permission request banner (shown once) */}
        {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
          <div className="bg-accent/10 border-b border-accent/20 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-accent" />
              <p className="text-sm font-bold text-primary">
                Enable browser notifications to receive order alerts even when you're on another tab.
              </p>
            </div>
            <button
              onClick={requestPermission}
              className="px-4 py-1.5 bg-accent text-primary font-black text-xs uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white transition-all"
            >
              Enable
            </button>
          </div>
        )}
        <div className="p-8">{children}</div>
      </main>

      {/* Floating toast notifications */}
      <OrderNotificationToasts orders={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Re-usable Admin page header ────────────────────────────────

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-black text-primary font-cinematic mb-1">{title}</h1>
        {subtitle && <p className="text-primary/40 font-bold text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────

export function StatCard({
  label, value, icon: Icon, trend,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: { value: number; label: string };
  color?: string;
}) {
  return (
    <motion.div
      className="bg-white rounded-3xl p-8 border border-border shadow-sm"
      whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(139,29,61,0.15)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`text-xs font-black px-2 py-1 rounded-lg ${
            trend.value >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
          }`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-4xl font-black text-primary mb-1">{value}</p>
      <p className="text-primary/40 font-bold text-sm uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}
