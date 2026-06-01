import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { productAPI, orderAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [offers, setOffers] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    productAPI.getCategories().then(r => setCategories(r.data));
    productAPI.getProducts({ featured: true }).then(r => setFeatured(r.data.results || r.data));
    productAPI.getOffers().then(r => setOffers(r.data));
  }, []);

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    const ok = await addToCart(id);
    if (ok) toast.success('Added to cart!');
  };

  const vegEmojis = { 'Leafy Greens': '🥬', 'Root Vegetables': '🥕', 'Fruits': '🍅', 'Herbs': '🌿', 'Exotic': '🫑', default: '🥦' };

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>Fresh Vegetables, <br />Delivered to Your Door 🚚</h1>
          <p>Farm-fresh produce sourced daily from local farmers. Quality guaranteed!</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/shop')} className="btn btn-lg" style={{ background: 'white', color: '#1B4332', fontWeight: 700 }}>
              🛍 Shop Now
            </button>
            <button onClick={() => navigate('/offers')} className="btn btn-lg btn-orange">
              🏷 View Offers
            </button>
          </div>
        </div>
      </div>

      <div className="container fade-in" style={{ padding: '40px 20px' }}>
        {/* Offer Banners */}
        {offers.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ marginBottom: 20, fontSize: 28 }}>🔥 Hot Deals</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {offers.slice(0, 3).map(offer => (
                <div key={offer.id} className="offer-banner">
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>LIMITED OFFER</div>
                  <h3 style={{ fontSize: 20, marginBottom: 6 }}>{offer.title}</h3>
                  <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 12 }}>{offer.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{offer.discount_percent}% OFF</span>
                    {offer.coupon_code && (
                      <span style={{ background: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                        {offer.coupon_code}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ marginBottom: 20, fontSize: 28 }}>Shop by Category</h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
            {categories.map(cat => (
              <Link to={`/shop?category=${cat.id}`} key={cat.id} style={{ minWidth: 120, textAlign: 'center', textDecoration: 'none' }}>
                <div style={{ background: '#D8F3DC', borderRadius: 16, padding: '20px 16px', marginBottom: 8, fontSize: 36, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  {vegEmojis[cat.name] || vegEmojis.default}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#3A4A3A' }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: '#6B7F6B' }}>{cat.product_count} items</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        {featured.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 28 }}>⭐ Featured Products</h2>
              <Link to="/shop" className="btn btn-secondary">View All →</Link>
            </div>
            <div className="grid-4">
              {featured.slice(0, 8).map(product => (
                <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="product-img">
                    {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥦'}
                  </div>
                  <div className="product-info">
                    <div className="product-category">{product.category_name}</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">
                      <span className="price-current">₹{product.discounted_price}/{product.unit}</span>
                      {product.active_offer && (
                        <>
                          <span className="price-original">₹{product.price}</span>
                          <span className="discount-badge">{product.active_offer.discount_percent}% OFF</span>
                        </>
                      )}
                    </div>
                    <button className="btn btn-primary btn-block btn-sm" onClick={(e) => handleAdd(e, product.id)}>
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section style={{ background: '#1B4332', borderRadius: 24, padding: '40px', color: 'white', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, marginBottom: 32 }}>Why Choose FreshMart? 🌱</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '🌾', title: 'Farm Fresh', desc: 'Direct from local farmers every morning' },
              { icon: '⚡', title: 'Fast Delivery', desc: 'Delivered within 2 hours of ordering' },
              { icon: '💰', title: 'Best Prices', desc: 'Daily deals and exclusive offers' },
              { icon: '🔄', title: 'Easy Returns', desc: 'Not satisfied? We\'ll replace it' },
            ].map(item => (
              <div key={item.title}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ opacity: 0.75, fontSize: 13 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
