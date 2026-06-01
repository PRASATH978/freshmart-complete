import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { productAPI } from '../../api';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '',
  description: '',
  price: '',
  unit: 'kg',
  stock: '',
  category: '',
  is_active: true,
  is_featured: false
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [tab, setTab] = useState('products');
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  const loadData = () => {
    productAPI.getProducts({}).then(r => setProducts(r.data.results || r.data));
    productAPI.getCategories().then(r => setCategories(r.data));
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ ...p, category: p.category });
    setImageFile(null);
    // Show existing image as preview
    setImagePreview(p.image || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setImageFile(file);
    // Create local preview URL
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build FormData to support image upload
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('price', form.price);
      formData.append('unit', form.unit);
      formData.append('stock', form.stock);
      formData.append('category', form.category);
      formData.append('is_active', form.is_active);
      formData.append('is_featured', form.is_featured);

      // Only append image if a new file was selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editItem) {
        await productAPI.updateProductForm(editItem.id, formData);
        toast.success('Product updated!');
      } else {
        await productAPI.createProductForm(formData);
        toast.success('Product added!');
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.deleteProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await productAPI.createCategory(catForm);
      toast.success('Category added!');
      setCatForm({ name: '', description: '' });
      loadData();
    } catch { toast.error('Failed to add category'); }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await productAPI.deleteCategory(id);
      toast.success('Category deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>🥦 Products Management</h2>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>

        <div className="admin-page fade-in">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['products', 'categories'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}>
                {t === 'products' ? '🥦 Products' : '📂 Categories'}
              </button>
            ))}
          </div>

          {tab === 'products' && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="🔍 Search products..." style={{ maxWidth: 300 }} />
                <span style={{ marginLeft: 'auto', color: '#6B7F6B', fontSize: 14, alignSelf: 'center' }}>
                  {filtered.length} products
                </span>
              </div>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th><th>Category</th><th>Price</th>
                        <th>Stock</th><th>Status</th><th>Featured</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 44, height: 44, background: '#D8F3DC', borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, overflow: 'hidden', flexShrink: 0
                              }}>
                                {p.image
                                  ? <img src={p.image} alt={p.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : '🥦'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: 12, color: '#6B7F6B' }}>{p.unit}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-green">{p.category_name}</span></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>₹{p.discounted_price}</div>
                            {p.active_offer && (
                              <div style={{ fontSize: 12, textDecoration: 'line-through', color: '#6B7F6B' }}>
                                ₹{p.price}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{
                              color: p.stock < 10 ? '#DC2626' : p.stock < 30 ? '#F59E0B' : '#10B981',
                              fontWeight: 700
                            }}>
                              {p.stock}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{p.is_featured ? '⭐' : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6B7F6B' }}>
                            No products found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'categories' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              <div className="card">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Category</th><th>Products</th><th>Description</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td><span className="badge badge-green">{cat.product_count} items</span></td>
                          <td style={{ color: '#6B7F6B', fontSize: 13 }}>{cat.description || '—'}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCat(cat.id)}>
                              🗑 Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card" style={{ padding: 24, height: 'fit-content' }}>
                <h3 style={{ marginBottom: 20 }}>Add New Category</h3>
                <form onSubmit={handleAddCategory}>
                  <div className="form-group">
                    <label className="form-label">Category Name *</label>
                    <input value={catForm.name}
                      onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="e.g. Leafy Greens" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea rows={3} value={catForm.description}
                      onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Short description..." />
                  </div>
                  <button className="btn btn-primary btn-block" type="submit">+ Add Category</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Product' : '➕ Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>

              {/* ── IMAGE UPLOAD SECTION ── */}
              <div className="form-group">
                <label className="form-label">Product Image</label>

                {/* Image Preview Box */}
                <div style={{
                  width: '100%', height: 180, borderRadius: 14,
                  border: '2px dashed #C8D5C8', background: '#F8FAF8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: 10, position: 'relative',
                  cursor: 'pointer'
                }} onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {/* Hover overlay */}
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                          🖼 Click to change image
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6B7F6B' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Click to upload image</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>JPG, PNG, WebP — max 5MB</div>
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}>
                    📁 {imagePreview ? 'Change Image' : 'Choose Image'}
                  </button>
                  {imagePreview && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={removeImage}>
                      🗑 Remove
                    </button>
                  )}
                </div>

                {imageFile && (
                  <div style={{
                    marginTop: 8, padding: '6px 12px', background: '#D8F3DC',
                    borderRadius: 8, fontSize: 12, color: '#1B4332'
                  }}>
                    ✅ {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
              </div>
              {/* ── END IMAGE SECTION ── */}

              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input value={form.name} onChange={set('name')}
                  placeholder="e.g. Fresh Spinach" required />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select value={form.category} onChange={set('category')} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={2} value={form.description} onChange={set('description')}
                  placeholder="Product description..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input type="number" step="0.01" value={form.price}
                    onChange={set('price')} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select value={form.unit} onChange={set('unit')}>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="bunch">Bunch</option>
                    <option value="piece">Piece</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input type="number" value={form.stock}
                    onChange={set('stock')} placeholder="0" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: 'auto' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_featured}
                    onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                    style={{ width: 'auto' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Featured ⭐</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" type="button"
                  onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit"
                  disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Saving...' : editItem ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
