import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

// ─── Load Razorpay SDK dynamically ───────────────────────────────────────────
function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const { state } = useLocation();

  const discountAmt   = state?.discount       || 0;
  const couponApplied = state?.coupon_applied  || '';
  const deliveryCharge = parseFloat(cart.total || 0) >= 500 ? 0 : 40;
  const finalTotal     = parseFloat(cart.total || 0) + deliveryCharge - discountAmt;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    delivery_address: user?.address || '',
    delivery_city:    '',
    delivery_pincode: '',
    payment_method:   'cod',
    notes:            '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // ─── Step 1: Create Django order ─────────────────────────────────────────
  const createDjangoOrder = async () => {
    const { data } = await orderAPI.createOrder({
      ...form,
      discount_amount: discountAmt,
      coupon_applied:  couponApplied,
    });
    return data;
  };

  // ─── COD Flow ────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    await createDjangoOrder();
    await fetchCart();
    toast.success('Order placed! 🎉');
    navigate('/orders');
  };

  // ─── Online Payment Flow ─────────────────────────────────────────────────
  const handleOnlinePayment = async () => {
    // 1. Create order in Django
    const djangoOrder = await createDjangoOrder();

    // 2. Load Razorpay script
    const sdkLoaded = await loadRazorpaySDK();
    if (!sdkLoaded) {
      toast.error('Razorpay failed to load. Check your internet connection.');
      return;
    }

    // 3. Create Razorpay order on backend
    let rzpData;
    try {
      const res = await orderAPI.createRazorpayOrder({ order_id: djangoOrder.id });
      rzpData = res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate payment. Try again.');
      return;
    }

    // 4. Open Razorpay checkout popup
    const options = {
      key:         rzpData.razorpay_key_id,
      amount:      rzpData.amount,        // paise
      currency:    rzpData.currency,
      name:        'FreshMart',
      description: `Order #${djangoOrder.id} — Fresh Vegetables`,
      order_id:    rzpData.razorpay_order_id,
      prefill: {
        name:    rzpData.customer_name,
        email:   rzpData.customer_email,
        contact: rzpData.customer_phone,
      },
      theme:       { color: '#2D6A4F' },
      // 5a. Payment SUCCESS handler
      handler: async (response) => {
        try {
          await orderAPI.verifyPayment({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
          await fetchCart();
          toast.success('Payment successful! Order confirmed 🎉');
          navigate('/orders');
        } catch {
          toast.error('Payment verification failed. Contact support.');
          navigate('/orders');
        }
      },
      // 5b. Modal dismissed / cancelled
      modal: {
        ondismiss: async () => {
          await orderAPI.paymentFailed({ razorpay_order_id: rzpData.razorpay_order_id });
          toast.error('Payment cancelled');
          navigate('/orders');
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // 5c. Payment FAILED handler (card declined, etc.)
    rzp.on('payment.failed', async (response) => {
      await orderAPI.paymentFailed({
        razorpay_order_id: rzpData.razorpay_order_id,
        error_description: response.error.description,
      });
      toast.error(`Payment failed: ${response.error.description}`);
      navigate('/orders');
    });

    rzp.open();
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_address.trim() || !form.delivery_city.trim() || !form.delivery_pincode.trim()) {
      toast.error('Please fill all address fields');
      return;
    }
    if (!cart.items?.length) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setLoading(true);
    try {
      if (form.payment_method === 'cod') {
        await handleCOD();
      } else {
        await handleOnlinePayment();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENT_OPTIONS = [
    {
      value: 'cod',
      label: '💵 Cash on Delivery',
      desc: 'Pay when you receive your order',
      badge: null,
    },
    {
      value: 'online',
      label: '💳 Pay Online',
      desc: 'UPI · Debit/Credit Card · Net Banking · Wallets',
      badge: 'RECOMMENDED',
    },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container fade-in" style={{ padding: '32px 20px' }}>
        <h1 style={{ marginBottom: 32 }}>📋 Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          {/* ── Left: Form ── */}
          <form onSubmit={handleSubmit}>

            {/* Address */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 20 }}>📍 Delivery Address</h3>
              <div className="form-group">
                <label className="form-label">Street Address *</label>
                <textarea rows={2} value={form.delivery_address} onChange={set('delivery_address')}
                  placeholder="House no, street, area..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input value={form.delivery_city} onChange={set('delivery_city')} placeholder="City" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input value={form.delivery_pincode} onChange={set('delivery_pincode')} placeholder="620001" required />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ marginBottom: 20 }}>💳 Payment Method</h3>
              {PAYMENT_OPTIONS.map(opt => (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: 16, borderRadius: 12, cursor: 'pointer', marginBottom: 12,
                  border: `2px solid ${form.payment_method === opt.value ? '#2D6A4F' : '#EEF2EE'}`,
                  background: form.payment_method === opt.value ? '#D8F3DC' : 'white',
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={form.payment_method === opt.value}
                    onChange={set('payment_method')} style={{ width: 'auto', accentColor: '#2D6A4F' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</span>
                      {opt.badge && (
                        <span style={{ background: '#2D6A4F', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7F6B', marginTop: 3 }}>{opt.desc}</div>
                  </div>
                  {opt.value === 'online' && (
                    <div style={{ display: 'flex', gap: 4, fontSize: 18 }}>
                      <span title="UPI">📱</span>
                      <span title="Card">💳</span>
                      <span title="NetBanking">🏦</span>
                    </div>
                  )}
                </label>
              ))}

              {/* Razorpay trust badges */}
              {form.payment_method === 'online' && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 14, marginTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                    🔒 Secured by Razorpay
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['📱 UPI / GPay / PhonePe', '💳 Debit Card', '💳 Credit Card', '🏦 Net Banking', '👛 Wallets'].map(m => (
                      <span key={m} style={{ background: 'white', fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid #86EFAC', color: '#166534' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Special Instructions (optional)</label>
                <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Any delivery instructions..." />
              </div>
            </div>

            {/* Submit */}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ fontSize: 17 }}>
              {loading
                ? '⏳ Processing...'
                : form.payment_method === 'cod'
                  ? `✅ Place Order — ₹${finalTotal.toFixed(2)}`
                  : `💳 Pay ₹${finalTotal.toFixed(2)} with Razorpay`}
            </button>

            {form.payment_method === 'online' && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#6B7F6B', marginTop: 10 }}>
                🔒 100% secure • PCI DSS compliant • 256-bit SSL
              </p>
            )}
          </form>

          {/* ── Right: Summary ── */}
          <div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Order Summary</h3>

              {cart.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: '#374151' }}>{item.product?.name} × {item.quantity}</span>
                  <span style={{ fontWeight: 700 }}>₹{item.subtotal}</span>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid #EEF2EE', margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6B7F6B' }}>Subtotal</span>
                <span>₹{parseFloat(cart.total || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6B7F6B' }}>Delivery</span>
                <span style={{ color: deliveryCharge === 0 ? '#2D6A4F' : undefined }}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#DC2626' }}>
                  <span>Discount</span>
                  <span>−₹{discountAmt.toFixed(2)}</span>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #EEF2EE', margin: '14px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20 }}>
                <span>Total</span>
                <span style={{ color: '#2D6A4F' }}>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div style={{ marginTop: 16, background: '#D8F3DC', borderRadius: 10, padding: 12, fontSize: 13, color: '#1B4332' }}>
                ⏰ Estimated delivery: within 2 hours
              </div>
            </div>

            {/* Razorpay badge */}
            {form.payment_method === 'online' && (
              <div style={{ marginTop: 12, background: 'white', border: '1px solid #EEF2EE', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6B7F6B', marginBottom: 4 }}>Powered by</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2D6A4F' }}>Razorpay</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>🔒 Safe · Secure · Trusted</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}