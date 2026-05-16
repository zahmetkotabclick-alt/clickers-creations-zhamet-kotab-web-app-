import { motion } from 'framer-motion';
import { BookOpen, Users, ShoppingBag, TrendingUp, Package, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminLayout, AdminPageHeader, StatCard } from '@/components/admin/AdminLayout';
import { useAnalytics } from '@/services/supabase.hooks';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { data: analytics, isLoading } = useAnalytics();

  const chartData = analytics?.salesByDay?.slice(0, 14).reverse().map((d: any) => ({
    date: d.sale_date ? format(new Date(d.sale_date), 'MM/dd') : '—',
    revenue: Number(d.revenue),
    orders: Number(d.order_count),
  })) ?? [];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Dashboard"
        subtitle={`Welcome back. Here's what's happening today.`}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 border border-border animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Total Revenue"
            value={`${(analytics?.totalRevenue ?? 0).toLocaleString()} EGP`}
            icon={TrendingUp}
            trend={{ value: 12, label: 'vs last month' }}
          />
          <StatCard
            label="Total Orders"
            value={analytics?.totalOrders ?? 0}
            icon={ShoppingBag}
          />
          <StatCard
            label="Users"
            value={analytics?.totalUsers ?? 0}
            icon={Users}
          />
          <StatCard
            label="Pending Orders"
            value={analytics?.pendingOrders ?? 0}
            icon={Package}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-primary font-cinematic">Revenue Overview</h2>
              <p className="text-primary/40 text-sm font-bold mt-1">Last 14 days</p>
            </div>
            <BarChart3 className="text-accent" size={22} />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(345 65% 33%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(345 65% 33%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(345 65% 33% / 0.4)', fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #E8E0DC', borderRadius: '16px', boxShadow: '0 8px 32px rgba(139,29,61,0.1)' }}
                  labelStyle={{ fontWeight: 800, color: 'hsl(345 65% 33%)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(345 65% 33%)"
                  strokeWidth={3}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-primary/20 font-bold">
              No sales data yet
            </div>
          )}
        </div>

        {/* Top Books */}
        <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-primary font-cinematic">Top Books</h2>
            <Link href="/admin/analytics">
              <span className="text-accent text-xs font-black uppercase tracking-wider cursor-pointer hover:text-primary transition-colors">See All</span>
            </Link>
          </div>
          <div className="space-y-5">
            {(analytics?.topBooks ?? []).slice(0, 5).map((book, i) => (
              <motion.div
                key={book.id}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <span className="text-3xl font-black text-accent/20 font-cinematic w-8">0{i + 1}</span>
                <img
                  src={book.cover_url || ''}
                  alt=""
                  className="w-10 h-14 object-cover rounded-xl shadow-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-primary font-bold text-sm line-clamp-1">{book.title_ar}</p>
                  <p className="text-accent font-black text-xs mt-0.5">{book.total_sold} sold</p>
                </div>
              </motion.div>
            ))}
            {(analytics?.topBooks ?? []).length === 0 && (
              <p className="text-primary/30 text-sm text-center py-8 font-bold">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/books/new', label: 'Add Book', icon: BookOpen },
          { href: '/admin/authors', label: 'Manage Authors', icon: Users },
          { href: '/admin/orders', label: 'View Orders', icon: ShoppingBag },
          { href: '/admin/exports', label: 'Export Data', icon: TrendingUp },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <motion.div
                className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon size={20} />
                </div>
                <span className="text-primary font-bold text-xs uppercase tracking-wider text-center">{action.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
}
