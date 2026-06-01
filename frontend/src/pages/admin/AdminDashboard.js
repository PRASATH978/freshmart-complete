import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { orderAPI, productAPI, authAPI } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2D6A4F', '#52B788', '#FF6B35', '#FFD166', '#EF4444'];

export default function AdminDashboard() {
  const [orderStats, setOrderStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    orderAPI.getAdminStats().then(r => setOrderStats(r.data));
    productAPI.getAdminStats().then(r => setProductStats(r.data));
    orderAPI.getOrders().then(r => setRecentOrders((r.data.results || r.data).slice(0, 5)));
  }, []);

  const pieData = orderStats?.orders_by_status?.map(s => ({
    name: s.status, value: s.count
  })) || [];

  const STATUS_MAP = {
    pending: { color: '#F59E0B', icon: '⏳' },
    confirmed: { color: '#3B82F6', icon: '✅' },
    preparing: { color: '#8B5CF6', icon: '👨‍🍳' },
    out_for_delivery: { color: '#F97316', icon: '🚴' },
    delivered: { color: '#10B981', icon: '🎉' },
    cancelled: { color: '#EF4444', icon: '❌' },
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>📊 Dashboard</h2>
            <p style={{ color: '#6B7F6B', fontSize: 13 }}>Welcome back! Here's what's happening today.</p>
          </div>
          <div style={{ fontSize: 13, color: '#6B7F6B' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="admin-page fade-in">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              { label: 'Total Orders', value: orderStats?.total_orders || 0, icon: '📦', color: '#3B82F6', bg: '#EFF6FF' },
              { label: 'Today\'s Revenue', value: `₹${orderStats?.today_revenue || 0}`, icon: '💰', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Total Revenue', value: `₹${orderStats?.total_revenue || 0}`, icon: '📈', color: '#2D6A4F', bg: '#D8F3DC' },
              { label: 'Active Products', value: productStats?.active_products || 0, icon: '🥦', color: '#F97316', bg: '#FFF7ED' },
            ].map(stat => (
              <div key={stat.label} className="stat-card" style={{ border: `1px solid ${stat.bg}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 40, opacity: 0.15 }}>{stat.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#6B7F6B', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
            {/* Orders by Status Chart */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20 }}>Orders by Status</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7F6B' }}>No data yet</div>}
            </div>

            {/* Quick Stats */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20 }}>Quick Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Pending Orders', value: orderStats?.pending_orders || 0, color: '#F59E0B' },
                  { label: 'Delivered Today', value: orderStats?.today_orders || 0, color: '#10B981' },
                  { label: 'Cancelled', value: orderStats?.cancelled_orders || 0, color: '#EF4444' },
                  { label: 'Active Offers', value: productStats?.active_offers || 0, color: '#8B5CF6' },
                  { label: 'Low Stock Items', value: productStats?.low_stock?.length || 0, color: '#F97316' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #EEF2EE' }}>
                    <span style={{ fontSize: 14, color: '#3A4A3A' }}>{item.label}</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {productStats?.low_stock?.length > 0 && (
            <div className="card" style={{ padding: 24, marginBottom: 24, border: '1px solid #FCD34D', background: '#FFFBEB' }}>
              <h3 style={{ marginBottom: 16, color: '#92400E' }}>⚠️ Low Stock Alert</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {productStats.low_stock.map(p => (
                  <div key={p.id} style={{ background: 'white', border: '1px solid #FCD34D', borderRadius: 10, padding: '8px 16px', fontSize: 14 }}>
                    <strong>{p.name}</strong> — <span style={{ color: '#EF4444' }}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>Recent Orders</h3>
              <a href="/admin/orders" style={{ color: '#2D6A4F', fontSize: 14, fontWeight: 600 }}>View All →</a>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentOrders.map(order => {
                    const cfg = STATUS_MAP[order.status] || {};
                    return (
                      <tr key={order.id}>
                        <td><strong>#{order.id}</strong></td>
                        <td>{order.customer_name}</td>
                        <td>{order.items.length} items</td>
                        <td style={{ fontWeight: 700 }}>₹{order.total}</td>
                        <td><span style={{ background: cfg.color + '20', color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{cfg.icon} {order.status}</span></td>
                        <td style={{ color: '#6B7F6B', fontSize: 13 }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
