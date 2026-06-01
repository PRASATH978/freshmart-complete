import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { orderAPI } from '../../api';

const STATUS_CFG = {
  paid:     { color: '#10B981', bg: '#ECFDF5', icon: '✅', label: 'Paid' },
  created:  { color: '#F59E0B', bg: '#FFFBEB', icon: '⏳', label: 'Pending' },
  failed:   { color: '#EF4444', bg: '#FEF2F2', icon: '❌', label: 'Failed' },
  refunded: { color: '#8B5CF6', bg: '#F5F3FF', icon: '↩️', label: 'Refunded' },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    const params = filterStatus ? { status: filterStatus } : {};
    Promise.all([
      orderAPI.getAdminPayments(params),
      orderAPI.getPaymentStats(),
    ]).then(([p, s]) => {
      setPayments(p.data.results || p.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filtered = payments.filter(p =>
    !search ||
    p.razorpay_payment_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.razorpay_order_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.order_id).includes(search)
  );

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>💳 Payment Management</h2>
            <p style={{ color: '#6B7F6B', fontSize: 13, marginTop: 2 }}>Track all online and COD payments</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'paid', 'created', 'failed', 'refunded'].map(s => (
              <button key={s}
                className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
                {s ? `${STATUS_CFG[s]?.icon} ${STATUS_CFG[s]?.label}` : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-page fade-in">
          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Collected', value: `₹${stats.total_collected?.toLocaleString('en-IN')}`, icon: '💰', color: '#10B981', bg: '#ECFDF5' },
                { label: "Today's Collection", value: `₹${stats.today_collected?.toLocaleString('en-IN')}`, icon: '📅', color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Online Payments', value: stats.total_online, icon: '💳', color: '#8B5CF6', bg: '#F5F3FF' },
                { label: 'Failed Payments', value: stats.total_failed, icon: '❌', color: '#EF4444', bg: '#FEF2F2' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${s.bg}` }}>
                  <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 36, opacity: 0.12 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#6B7F6B', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF2EE', display: 'flex', gap: 12, alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search by order ID, payment ID, customer..."
                style={{ maxWidth: 380 }} />
              <span style={{ marginLeft: 'auto', color: '#6B7F6B', fontSize: 13 }}>{filtered.length} payments</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Razorpay ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#6B7F6B' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>No payments found
                    </td></tr>
                  ) : filtered.map(payment => {
                    const cfg = STATUS_CFG[payment.status] || {};
                    return (
                      <tr key={payment.id}>
                        <td><strong style={{ color: '#1B4332' }}>#{payment.order_id}</strong></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{payment.customer_name}</div>
                          <div style={{ fontSize: 12, color: '#6B7F6B' }}>{payment.customer_phone}</div>
                        </td>
                        <td>
                          {payment.razorpay_payment_id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <code style={{ fontSize: 11, background: '#F0FDF4', padding: '2px 6px', borderRadius: 4, color: '#1B4332' }}>
                                {payment.razorpay_payment_id.slice(0, 20)}...
                              </code>
                              <button onClick={() => copyToClipboard(payment.razorpay_payment_id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>📋</button>
                            </div>
                          ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        <td><span style={{ fontWeight: 800, fontSize: 15, color: '#1B4332' }}>₹{parseFloat(payment.amount).toLocaleString('en-IN')}</span></td>
                        <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{payment.payment_method === 'cod' ? '💵 COD' : '💳 Online'}</span></td>
                        <td>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td style={{ color: '#6B7F6B', fontSize: 13 }}>
                          {new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
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
