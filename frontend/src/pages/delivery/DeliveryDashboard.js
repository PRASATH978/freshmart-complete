import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_CFG = {
  pending:          { color: '#F59E0B', bg: '#FFFBEB', icon: '⏳', label: 'Pending' },
  confirmed:        { color: '#3B82F6', bg: '#EFF6FF', icon: '✅', label: 'Confirmed' },
  preparing:        { color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳', label: 'Preparing' },
  out_for_delivery: { color: '#F97316', bg: '#FFF7ED', icon: '🚴', label: 'On the Way' },
  delivered:        { color: '#10B981', bg: '#ECFDF5', icon: '🎉', label: 'Delivered' },
  cancelled:        { color: '#EF4444', bg: '#FEF2F2', icon: '❌', label: 'Cancelled' },
};

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('active'); // active | history
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    const status = tab === 'active' ? 'out_for_delivery' : 'delivered';
    deliveryAPI.getMyDeliveries({ status }).then(r => setOrders(r.data.results || r.data)).finally(() => setLoading(false));
    deliveryAPI.getStats().then(r => setStats(r.data));
  };

  useEffect(() => { load(); }, [tab]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await deliveryAPI.updateDeliveryStatus(orderId, { status: newStatus });
      toast.success(newStatus === 'delivered' ? '🎉 Delivery completed!' : '🚴 Status updated!');
      load();
      setSelected(null);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF8' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', padding: '20px 24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 600, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>🚴 FreshMart Delivery</div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>Welcome, {user?.first_name || user?.username}!</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Assigned', value: stats?.total_assigned || 0, icon: '📦', color: '#3B82F6' },
            { label: 'Delivered', value: stats?.delivered || 0, icon: '✅', color: '#10B981' },
            { label: 'Pending', value: stats?.pending || 0, icon: '⏳', color: '#F97316' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6B7F6B' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'white', padding: 6, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { key: 'active', label: '🚴 Active Deliveries' },
            { key: 'history', label: '✅ Delivered' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: tab === t.key ? '#2D6A4F' : 'transparent', color: tab === t.key ? 'white' : '#3A4A3A', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7F6B' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>{tab === 'active' ? '🚴' : '📦'}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{tab === 'active' ? 'No active deliveries' : 'No deliveries yet'}</div>
            <div style={{ fontSize: 14 }}>{tab === 'active' ? 'New orders will appear here when assigned.' : 'Completed deliveries will show here.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map(order => {
              const cfg = STATUS_CFG[order.status] || {};
              return (
                <div key={order.id} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: selected?.id === order.id ? '2px solid #2D6A4F' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelected(selected?.id === order.id ? null : order)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>Order #{order.id}</div>
                      <div style={{ fontSize: 13, color: '#6B7F6B' }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '5px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Customer */}
                  <div style={{ background: '#F8FAF8', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1B4332', flexShrink: 0 }}>
                        {order.customer_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{order.customer_name}</div>
                        <div style={{ fontSize: 13, color: '#6B7F6B' }}>📱 {order.customer_phone}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, color: '#3A4A3A' }}>
                      📍 {order.delivery_address}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7F6B' }}>{order.delivery_city} — {order.delivery_pincode}</div>
                  </div>

                  {/* Items Summary */}
                  <div style={{ fontSize: 14, color: '#3A4A3A', marginBottom: 12 }}>
                    🛒 {order.items?.length} items • <strong style={{ color: '#1B4332' }}>₹{order.total}</strong>
                    {' '}<span style={{ color: '#6B7F6B', fontSize: 12, textTransform: 'uppercase' }}>({order.payment_method})</span>
                  </div>

                  {/* Expanded: Items list + Actions */}
                  {selected?.id === order.id && (
                    <div>
                      <div style={{ borderTop: '1px solid #EEF2EE', paddingTop: 12, marginBottom: 12 }}>
                        {order.items?.map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                            <span>{item.product_name} × {item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
                          </div>
                        ))}
                      </div>

                      {tab === 'active' && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          {order.status === 'confirmed' || order.status === 'preparing' ? (
                            <button onClick={() => updateStatus(order.id, 'out_for_delivery')}
                              className="btn btn-primary btn-block" disabled={updating}>
                              🚴 Start Delivery
                            </button>
                          ) : order.status === 'out_for_delivery' ? (
                            <>
                              <a href={`tel:${order.customer_phone}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                                📞 Call Customer
                              </a>
                              <button onClick={() => updateStatus(order.id, 'delivered')}
                                className="btn btn-primary" style={{ flex: 2 }} disabled={updating}>
                                {updating ? '⏳ Updating...' : '✅ Mark Delivered'}
                              </button>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
