import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { productAPI } from '../../api';
import toast from 'react-hot-toast';

const EMPTY_OFFER = {
  title: '', description: '', offer_type: 'product',
  discount_percent: '', min_order_amount: 0,
  coupon_code: '', is_active: true,
  start_date: '', end_date: '',
};

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_OFFER);
  const [loading, setLoading] = useState(false);

  const load = () => productAPI.getOffers().then(r => setOffers(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_OFFER); setShowModal(true); };
  const openEdit = (o) => { setEditItem(o); setForm({ ...o, start_date: o.start_date?.slice(0, 16), end_date: o.end_date?.slice(0, 16) }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editItem) await productAPI.updateOffer(editItem.id, form);
      else await productAPI.createOffer(form);
      toast.success(editItem ? 'Offer updated!' : 'Offer created!');
      setShowModal(false);
      load();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(msg ? JSON.stringify(msg) : 'Failed to save');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try { await productAPI.deleteOffer(id); toast.success('Offer deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>🏷️ Offers Management</h2>
          <button className="btn btn-primary" onClick={openAdd}>+ Create Offer</button>
        </div>

        <div className="admin-page fade-in">
          {/* Offer Cards */}
          {offers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <h3>No offers yet</h3>
              <p>Create your first offer to attract more customers!</p>
              <button className="btn btn-primary btn-lg" onClick={openAdd} style={{ marginTop: 16 }}>+ Create First Offer</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {offers.map(offer => {
                const expired = isExpired(offer.end_date);
                return (
                  <div key={offer.id} style={{ background: expired ? '#F8FAF8' : 'linear-gradient(135deg, #1B4332, #2D6A4F)', borderRadius: 20, padding: 24, color: expired ? '#3A4A3A' : 'white', position: 'relative', overflow: 'hidden', border: expired ? '1px solid #EEF2EE' : 'none' }}>
                    <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 70, opacity: 0.1 }}>🎁</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>{offer.offer_type}</span>
                        <h3 style={{ fontSize: 18, marginTop: 4 }}>{offer.title}</h3>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ background: offer.is_active && !expired ? '#52B788' : '#EF4444', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                          {offer.is_active && !expired ? 'LIVE' : expired ? 'EXPIRED' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>{offer.description}</p>

                    <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>{offer.discount_percent}% OFF</div>

                    {offer.min_order_amount > 0 && (
                      <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>Min order: ₹{offer.min_order_amount}</div>
                    )}

                    {offer.coupon_code && (
                      <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 8, fontWeight: 800, letterSpacing: 2, fontSize: 15, marginBottom: 12 }}>
                        🎟 {offer.coupon_code}
                      </div>
                    )}

                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
                      📅 {new Date(offer.start_date).toLocaleDateString('en-IN')} → {new Date(offer.end_date).toLocaleDateString('en-IN')}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(offer)} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: expired ? '#3A4A3A' : 'white', flex: 1 }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(offer.id)} className="btn btn-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Offer' : '🏷️ Create Offer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Offer Title *</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Weekend Mega Sale" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Tell customers about this offer..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Offer Type</label>
                  <select value={form.offer_type} onChange={set('offer_type')}>
                    <option value="product">Product Offer</option>
                    <option value="category">Category Offer</option>
                    <option value="flat">Flat Offer</option>
                    <option value="banner">Banner Offer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount % *</label>
                  <input type="number" min="1" max="100" value={form.discount_percent} onChange={set('discount_percent')} placeholder="e.g. 20" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Min Order Amount (₹)</label>
                  <input type="number" value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Coupon Code</label>
                  <input value={form.coupon_code} onChange={e => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} placeholder="e.g. FRESH20" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="datetime-local" value={form.start_date} onChange={set('start_date')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="datetime-local" value={form.end_date} onChange={set('end_date')} required />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ width: 'auto' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Active (visible to customers)</span>
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" type="button" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Saving...' : editItem ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
