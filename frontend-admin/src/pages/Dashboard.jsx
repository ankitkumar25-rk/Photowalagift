import { useQuery } from '@tanstack/react-query';
import { createElement } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, ArrowUp, ArrowDown, ExternalLink,
  History, Calendar, Filter
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, color = 'brand', trend }) {
  const configs = {
    brand: {
      bg: 'bg-brand-soft',
      iconBg: 'bg-brand-primary/10',
      iconColor: 'text-brand-primary',
      shadow: 'shadow-brand-primary/5'
    },
    accent: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      shadow: 'shadow-orange-200/20'
    },
    gold: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      shadow: 'shadow-amber-200/20'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      shadow: 'shadow-red-200/20'
    },
  }[color] || configs.brand;

  return (
    <div className={`card group p-6 lg:p-8 relative overflow-hidden ${configs.bg}`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-20 h-20 -mr-6 -mt-6 rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${configs.iconBg}`}>
          <Icon className={`w-6 h-6 ${configs.iconColor}`} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{title}</p>
          <h2 className="text-3xl font-display font-black text-brand-primary tracking-tight">{value}</h2>
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-medium text-gray-500">{subtitle}</span>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  PENDING: '#b88a2f', CONFIRMED: '#5b3f2f', PROCESSING: '#d96a22',
  SHIPPED: '#406021', DELIVERED: '#166534', CANCELLED: '#991b1b',
};

export default function Dashboard() {
  const { data: stats, isLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: salesData, error: salesError } = useQuery({
    queryKey: ['admin-sales', 30],
    queryFn: () => api.get('/admin/dashboard/sales?days=30').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="h-96 flex items-center justify-center text-brand-primary/40 font-black tracking-widest animate-pulse uppercase">Synchronizing Data...</div>;

  const pieData = stats?.statusBreakdown
    ? Object.entries(stats.statusBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[2px] bg-brand-secondary rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary">Performance Overview</span>
          </div>
          <h1 className="text-4xl font-display font-black text-brand-primary tracking-tight">Business Intelligence</h1>
          <p className="text-gray-400 mt-2 font-medium">Real-time insights for your Photowala ecosystem.</p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Gross Revenue"
          value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle={`₹${(stats?.revenueThisMonth || 0).toLocaleString('en-IN')} this month`}
          icon={TrendingUp} color="brand" trend={12.5}
        />
        <KPICard
          title="Fulfillment Rate"
          value={(stats?.totalOrders || 0).toLocaleString()}
          subtitle={`${stats?.ordersThisMonth || 0} active orders`}
          icon={ShoppingCart} color="accent" trend={8.2}
        />
        <KPICard
          title="Active Clientele"
          value={(stats?.totalUsers || 0).toLocaleString()}
          subtitle="Direct customers"
          icon={Users} color="gold" trend={5.1}
        />
        <KPICard
          title="Catalog Health"
          value={stats?.totalProducts || 0}
          subtitle={`${stats?.lowStockCount || 0} units low stock`}
          icon={Package}
          color={stats?.lowStockCount > 0 ? 'red' : 'brand'}
        />
      </div>

      {/* Alerts */}
      {stats?.lowStockCount > 0 && (
        <div className="card border-l-4 border-l-amber-500 bg-amber-50/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Inventory Warning</p>
              <p className="text-xs text-amber-700 font-medium">{stats.lowStockCount} products are reaching critical stock levels.</p>
            </div>
          </div>
          <Link to="/inventory" className="btn-primary py-2 px-4 !text-[10px]">Restock Now</Link>
        </div>
      )}

      {/* Analytical Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card p-8 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-brand-primary">Revenue Velocity</h3>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-primary" /> Revenue</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-secondary/30" /> Forecast</div>
            </div>
          </div>

          <div className="h-[300px] w-full min-w-0 min-h-[300px]">
            {salesData && salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5b3f2f" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#5b3f2f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#5b3f2f" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Awaiting transaction data...</div>
            )}
          </div>
        </div>

        <div className="card p-8">
          <h3 className="text-lg font-bold text-brand-primary mb-8">Operational Split</h3>
          <div className="h-[300px] w-full min-w-0 min-h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={65} paddingAngle={5}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No operational data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Ledger */}
      <div className="card luxury-grain border-none shadow-xl">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-brand-secondary" />
            <h3 className="text-lg font-bold text-brand-primary">Audit Trail: Recent Activity</h3>
          </div>
          <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors flex items-center gap-2">
            View Ledger <ExternalLink size={10} />
          </Link>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px]">
            <thead className="bg-brand-soft/50">
              <tr>
                {['Reference ID', 'Client Entity', 'Capital Flow', 'Operational Status', 'Timestamp'].map(h => (
                  <th key={h} className="text-left text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em] px-8 py-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentOrders?.length > 0 ? stats.recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-brand-soft/30 transition-colors group">
                  <td className="px-8 py-6 text-sm font-display font-bold text-brand-primary">{o.orderNumber}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary font-bold text-xs uppercase">
                        {o.user?.name?.[0] || 'G'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-primary">{o.user?.name || 'Guest User'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{o.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-brand-primary">₹{Number(o.total).toLocaleString('en-IN')}</td>
                  <td className="px-8 py-6">
                    <span className={'badge-status ' + o.status.toLowerCase()}>{o.status}</span>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-xs text-gray-400 font-medium italic">No ledger entries detected in the current cycle.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
