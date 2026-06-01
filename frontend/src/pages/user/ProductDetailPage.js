import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    productAPI.getProduct(id).then(r => setProduct(r.data));
    productAPI.getReviews(id).then(r => setReviews(r.data));
  }, [id]);

  const handleAdd = async () => {
    const ok = await addToCart(product.id, qty);
    if (ok) toast.success(`${qty} ${product.unit}(s) added to cart!`);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await productAPI.addReview(id, reviewForm);
      toast.success('Review submitted!');
      productAPI.getReviews(id).then(r => setReviews(r.data));
      setReviewForm({ rating: 5, comment: '' });
    } catch { toast.error('Failed to submit review'); }
  };

  if (!product) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container fade-in" style={{ padding: '32px 20px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 24 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* Product Image */}
          <div>
            <div style={{ background: '#D8F3DC', borderRadius: 24, height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120, marginBottom: 16 }}>
              {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} /> : '🥦'}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <span className="badge badge-green">{product.category_name}</span>
            {product.active_offer && <span className="badge badge-orange" style={{ marginLeft: 8 }}>🔥 {product.active_offer.title}</span>}
            <h1 style={{ fontSize: 36, margin: '12px 0' }}>{product.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ color: '#F59E0B' }}>{'⭐'.repeat(Math.round(product.avg_rating))}</span>
              <span style={{ color: '#6B7F6B', fontSize: 14 }}>{product.avg_rating} ({product.review_count} reviews)</span>
            </div>
            <p style={{ color: '#6B7F6B', marginBottom: 24 }}>{product.description}</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#2D6A4F' }}>₹{product.discounted_price}</span>
              <span style={{ color: '#6B7F6B', fontSize: 16 }}>per {product.unit}</span>
            </div>
            {product.active_offer && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ textDecoration: 'line-through', color: '#6B7F6B' }}>₹{product.price}</span>
                <span className="discount-badge" style={{ marginLeft: 8 }}>{product.active_offer.discount_percent}% OFF</span>
              </div>
            )}

            <div style={{ fontSize: 14, color: product.stock > 10 ? '#2D6A4F' : '#DC2626', marginBottom: 24 }}>
              {product.stock > 10 ? `✅ In Stock (${product.stock} available)` : product.stock > 0 ? `⚠️ Only ${product.stock} left!` : '❌ Out of Stock'}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 14 }}>Quantity:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleAdd} disabled={product.stock === 0} style={{ width: '100%' }}>
              🛒 Add {qty} {product.unit} to Cart — ₹{(product.discounted_price * qty).toFixed(2)}
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ marginBottom: 24 }}>Customer Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p style={{ color: '#6B7F6B' }}>No reviews yet. Be the first to review!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {reviews.map(r => (
                <div key={r.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, background: '#D8F3DC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1B4332' }}>
                      {r.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.username}</div>
                      <div style={{ color: '#F59E0B' }}>{'⭐'.repeat(r.rating)}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#6B7F6B', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <p style={{ color: '#3A4A3A' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Write a Review</h3>
            <form onSubmit={handleReview}>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewForm({...reviewForm, rating: n})}
                      style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', opacity: reviewForm.rating >= n ? 1 : 0.3 }}>⭐</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Review</label>
                <textarea rows={3} value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} placeholder="Tell others what you think..." />
              </div>
              <button className="btn btn-primary" type="submit">Submit Review</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
