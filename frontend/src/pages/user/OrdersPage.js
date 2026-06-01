import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { orderAPI } from '../../api';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  preparing: { label: 'Preparing', color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳' },
  out_for_delivery: { label: 'On the Way', color: '#F97316', bg: '#FFF7ED', icon: '🚴' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

const STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    orderAPI.getOrders().then(r => setOrders(r.data.results || r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container fade-in" style={{ padding: '32px 20px' }}>
        <h1 style={{ marginBottom: 32 }}>📦 My Orders</h1>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || {};
              const stepIdx = STEPS.indexOf(order.status);
              return (
                <div key={order.id} className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>Order #{order.id}</div>
                      <div style={{ color: '#6B7F6B', fontSize: 13 }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
                      {STEPS.map((step, i) => (
                        <React.Fragment key={step}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STEPS.length - 1 ? 'none' : 1 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= stepIdx ? '#2D6A4F' : '#EEF2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: i <= stepIdx ? 'white' : '#C8D5C8', fontWeight: 700, transition: 'all 0.3s' }}>
                              {i <= stepIdx ? '✓' : i + 1}
                            </div>
                            <div style={{ fontSize: 10, color: i <= stepIdx ? '#2D6A4F' : '#C8D5C8', marginTop: 4, textAlign: 'center', fontWeight: i <= stepIdx ? 700 : 400 }}>
                              {STATUS_CONFIG[step]?.label}
                            </div>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#2D6A4F' : '#EEF2EE', transition: 'background 0.3s', marginBottom: 20 }} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ borderTop: '1px solid #EEF2EE', paddingTop: 16, marginBottom: 16 }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                        <span>{item.product_name} × {item.quantity}</span>
                        <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#6B7F6B' }}>{order.payment_method.toUpperCase()} • {order.payment_status}</div>
                      {order.delivery_boy_name && (
                        <div style={{ fontSize: 13, color: '#2D6A4F' }}>🚴 Delivery by: {order.delivery_boy_name}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: '#1B4332' }}>₹{order.total}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
