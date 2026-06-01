import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { productAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    productAPI.getCategories().then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (search) params.search = search;
    productAPI.getProducts(params)
      .then(r => setProducts(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    const ok = await addToCart(id);
    if (ok) toast.success('Added to cart!');
    else toast.error('Failed to add to cart');
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '32px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 32, flex: 1 }}>🛍 Fresh Vegetables</h1>
          <div className="search-bar" style={{ flex: '0 0 300px' }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vegetables..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Filters */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#6B7F6B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                className={`nav-link ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSearchParams({})}
                style={{ textAlign: 'left', border: 'none', background: !selectedCategory ? '#D8F3DC' : 'transparent', color: !selectedCategory ? '#1B4332' : '#3A4A3A' }}>
                All Vegetables
              </button>
              {categories.map(cat => (
                <button key={cat.id}
                  className="nav-link"
                  onClick={() => setSearchParams({ category: cat.id })}
                  style={{ textAlign: 'left', border: 'none', background: selectedCategory === String(cat.id) ? '#D8F3DC' : 'transparent', color: selectedCategory === String(cat.id) ? '#1B4332' : '#3A4A3A' }}>
                  {cat.name} ({cat.product_count})
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🥦</div>
                <h3>No products found</h3>
                <p>Try different search or category</p>
              </div>
            ) : (
              <div className="grid-4 fade-in">
                {products.map(product => (
                  <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="product-img">
                      {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🥦'}
                    </div>
                    {product.active_offer && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: '#FF6B35', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>
                        {product.active_offer.discount_percent}% OFF
                      </div>
                    )}
                    <div className="product-info">
                      <div className="product-category">{product.category_name}</div>
                      <div className="product-name">{product.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7F6B', marginBottom: 6 }}>
                        ⭐ {product.avg_rating} ({product.review_count} reviews)
                      </div>
                      <div className="product-price">
                        <span className="price-current">₹{product.discounted_price}/{product.unit}</span>
                        {product.active_offer && <span className="price-original">₹{product.price}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: product.stock > 10 ? '#2D6A4F' : '#DC2626', marginBottom: 10 }}>
                        {product.stock > 10 ? '✅ In Stock' : product.stock > 0 ? `⚠️ Only ${product.stock} left` : '❌ Out of Stock'}
                      </div>
                      <button className="btn btn-primary btn-block btn-sm"
                        onClick={(e) => handleAdd(e, product.id)}
                        disabled={product.stock === 0}>
                        {product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
