import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { orderAPI, authAPI } from '../../api';
import toast from 'react-hot-toast';

const STATUS_LIST = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_CFG = {
  pending:          { color: '#F59E0B', bg: '#FFFBEB', icon: '⏳' },
  confirmed:        { color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  preparing:        { color: '#8B5CF6', bg: '#F5F3FF', icon: '👨‍🍳' },
  out_for_delivery: { color: '#F97316', bg: '#FFF7ED', icon: '🚴' },
  delivered:        { color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  cancelled:        { color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params = filterStatus ? { status: filterStatus } : {};
    orderAPI.getOrders(params).then(r => setOrders(r.data.results || r.data)).finally(() => setLoading(false));
    authAPI.getUsers('delivery').then(r => setDeliveryBoys(r.data));
  };

  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  const updateStatus = async (orderId, status, delivery_boy) => {
    try {
      await orderAPI.updateOrder(orderId, { status, delivery_boy });
      toast.success(`Order #${orderId} updated to ${status}`);
      load();
      setSelected(prev => prev ? { ...prev, status, delivery_boy_id: delivery_boy } : null);
    } catch { toast.error('Update failed'); }
  };

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>📦 Orders Management</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${!filterStatus ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus('')}>All</button>
            {STATUS_LIST.map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterStatus(s)} style={{ textTransform: 'capitalize' }}>
                {STATUS_CFG[s].icon} {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-page fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 24 }}>
            {/* Orders Table */}
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#6B7F6B' }}>No orders found</td></tr>
                    ) : orders.map(order => {
                      const cfg = STATUS_CFG[order.status] || {};
                      return (
                        <tr key={order.id} style={{ cursor: 'pointer', background: selected?.id === order.id ? '#F0FDF4' : '' }} onClick={() => setSelected(order)}>
                          <td><strong>#{order.id}</strong></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                            <div style={{ fontSize: 12, color: '#6B7F6B' }}>{order.customer_phone}</div>
                          </td>
                          <td>{order.items?.length} items</td>
                          <td style={{ fontWeight: 700 }}>₹{order.total}</td>
                          <td>
                            <span className="badge badge-gray" style={{ textTransform: 'uppercase', fontSize: 11 }}>{order.payment_method}</span>
                          </td>
                          <td>
                            <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {cfg.icon} {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ color: '#6B7F6B', fontSize: 13 }}>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setSelected(order); }}>View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Detail Panel */}
            {selected && (
              <div className="card" style={{ padding: 24, height: 'fit-content', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3>Order #{selected.id}</h3>
                  <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {STATUS_LIST.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s, selected.delivery_boy)}
                      className="btn btn-sm"
                      style={{ background: selected.status === s ? STATUS_CFG[s].color : STATUS_CFG[s].bg, color: selected.status === s ? 'white' : STATUS_CFG[s].color, fontSize: 12, textTransform: 'capitalize' }}>
                      {STATUS_CFG[s].icon} {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Assign Delivery Boy */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Assign Delivery Boy</label>
                  <select value={selected.delivery_boy || ''} onChange={e => updateStatus(selected.id, selected.status, e.target.value)}>
                    <option value="">— Not Assigned —</option>
                    {deliveryBoys.map(d => <option key={d.id} value={d.id}>{d.first_name || d.username} ({d.username})</option>)}
                  </select>
                </div>

                {/* Customer Info */}
                <div style={{ background: '#F8FAF8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>👤 Customer</div>
                  <div style={{ fontSize: 14, color: '#3A4A3A' }}>{selected.customer_name}</div>
                  <div style={{ fontSize: 13, color: '#6B7F6B' }}>📱 {selected.customer_phone}</div>
                  <div style={{ fontSize: 13, color: '#6B7F6B', marginTop: 8 }}>📍 {selected.delivery_address}, {selected.delivery_city} — {selected.delivery_pincode}</div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>🛒 Items</div>
                  {selected.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EEF2EE', fontSize: 14 }}>
                      <span>{item.product_name} × {item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, padding: 12, background: '#F8FAF8', borderRadius: 10, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7F6B' }}>Subtotal</span><span>₹{selected.subtotal}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6B7F6B' }}>Delivery</span><span>₹{selected.delivery_charge}</span></div>
                    {selected.discount_amount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}><span>Discount</span><span>−₹{selected.discount_amount}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid #EEF2EE', paddingTop: 8 }}><span>Total</span><span style={{ color: '#1B4332' }}>₹{selected.total}</span></div>
                  </div>
                </div>

                {/* Status History */}
                {selected.status_history?.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 Status History</div>
                    {selected.status_history.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2D6A4F', marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{h.status.replace('_', ' ')}</span>
                          {h.note && <span style={{ color: '#6B7F6B' }}> — {h.note}</span>}
                          <div style={{ color: '#6B7F6B', fontSize: 12 }}>{new Date(h.created_at).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
