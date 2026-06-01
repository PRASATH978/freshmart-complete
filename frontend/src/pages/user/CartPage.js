import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, updateItem, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const navigate = useNavigate();

  const deliveryCharge = cart.total >= 500 ? 0 : 40;
  const discountAmt = discount?.discount || 0;
  const finalTotal = cart.total + deliveryCharge - discountAmt;

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data } = await orderAPI.applyCoupon(coupon);
      setDiscount(data);
      toast.success(`Coupon applied! You save ₹${data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid coupon');
    }
  };

  if (!cart.items?.length) return (
    <div className="page-wrapper">
      <Navbar />
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p style={{ marginBottom: 24 }}>Add some fresh vegetables to get started!</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>🥦 Shop Now</button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container fade-in" style={{ padding: '32px 20px' }}>
        <h1 style={{ marginBottom: 32 }}>🛒 Your Cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          {/* Items */}
          <div>
            {cart.items.map(item => (
              <div key={item.id} className="card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 70, height: 70, background: '#D8F3DC', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                  {item.product.image ? <img src={item.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : '🥦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{item.product.name}</div>
                  <div style={{ color: '#6B7F6B', fontSize: 13 }}>₹{item.product.discounted_price} per {item.product.unit}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => updateItem(item.id, item.quantity - 1)}>−</button>
                  <span style={{ width: 36, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => updateItem(item.id, item.quantity + 1)}>+</button>
                </div>
                <div style={{ fontWeight: 700, color: '#2D6A4F', width: 80, textAlign: 'right' }}>₹{item.subtotal}</div>
                <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}>🗑</button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20 }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7F6B' }}>Subtotal</span>
                  <span>₹{cart.total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7F6B' }}>Delivery</span>
                  <span>{deliveryCharge === 0 ? <span style={{ color: '#2D6A4F' }}>FREE</span> : `₹${deliveryCharge}`}</span>
                </div>
                {discount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                    <span>Discount ({discount.discount_percent}%)</span>
                    <span>−₹{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid #EEF2EE' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}>
                  <span>Total</span>
                  <span style={{ color: '#2D6A4F' }}>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {cart.total < 500 && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 16, color: '#92400E' }}>
                  Add ₹{(500 - cart.total).toFixed(2)} more for FREE delivery!
                </div>
              )}

              {/* Coupon */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" style={{ flex: 1 }} />
                <button className="btn btn-secondary" onClick={applyCoupon}>Apply</button>
              </div>


              <button
  className="btn btn-primary btn-block btn-lg"
  onClick={() => {
    if (!cart.items || cart.items.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    navigate('/checkout', {
      state: {
        discount: discountAmt,
        coupon_applied: discount ? coupon : '',
      }
    });
  }}>
  Proceed to Checkout →
</button>

              



            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
