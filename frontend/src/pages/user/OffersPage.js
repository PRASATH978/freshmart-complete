import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { productAPI } from '../../api';
import toast from 'react-hot-toast';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productAPI.getOffers().then(r => setOffers(r.data));
    productAPI.getProducts({ }).then(r => setProducts(r.data.results || r.data));
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon ${code} copied!`);
  };

  const saleProducts = products.filter(p => p.active_offer);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 100%)', padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏷️</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40 }}>Exclusive Offers</h1>
        <p style={{ fontSize: 16, opacity: 0.9 }}>Fresh deals every day — save more on every order!</p>
      </div>

      <div className="container fade-in" style={{ padding: '40px 20px' }}>
        {/* Active Offers */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 24, fontSize: 28 }}>🔥 Active Deals</h2>
          {offers.length === 0 ? (
            <p style={{ color: '#6B7F6B' }}>No active offers right now. Check back soon!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {offers.map(offer => (
                <div key={offer.id} style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', borderRadius: 20, padding: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: 0.1 }}>🎁</div>
                  <div style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{offer.offer_type} Offer</div>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>{offer.title}</h3>
                  <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16 }}>{offer.description}</p>
                  <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>{offer.discount_percent}% OFF</div>
                  {offer.min_order_amount > 0 && (
                    <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>Min order: ₹{offer.min_order_amount}</div>
                  )}
                  {offer.coupon_code && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ fontWeight: 800, letterSpacing: 2, fontSize: 16 }}>{offer.coupon_code}</span>
                      <button onClick={() => copyCode(offer.coupon_code)} style={{ marginLeft: 'auto', background: 'white', color: '#1B4332', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                        Copy
                      </button>
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
                    Valid till {new Date(offer.end_date).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Products on Sale */}
        {saleProducts.length > 0 && (
          <section>
            <h2 style={{ marginBottom: 24, fontSize: 28 }}>🛍 Products on Sale</h2>
            <div className="grid-4">
              {saleProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div style={{ position: 'relative' }}>
                    <div className="product-img">{product.image ? <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥦'}</div>
                    <div style={{ position: 'absolute', top: 10, right: 10, background: '#FF6B35', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                      -{product.active_offer.discount_percent}%
                    </div>
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7F6B', marginBottom: 8 }}>{product.active_offer.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#2D6A4F' }}>₹{product.discounted_price}</span>
                      <span style={{ textDecoration: 'line-through', color: '#6B7F6B', fontSize: 14 }}>₹{product.price}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
                      You save ₹{(product.price - product.discounted_price).toFixed(2)}!
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
