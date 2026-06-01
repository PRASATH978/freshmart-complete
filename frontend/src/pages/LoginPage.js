import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch {
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '40px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🥦</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1B4332', marginBottom: 4 }}>FreshMart</h1>
          <p style={{ color: '#6B7F6B', fontSize: 14 }}>Your fresh vegetables, delivered fresh</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Enter password" required />
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#6B7F6B', fontSize: 14 }}>
          New customer? <Link to="/register" style={{ color: '#2D6A4F', fontWeight: 600 }}>Create account</Link>
        </p>

        <div style={{ marginTop: 24, padding: 16, background: '#D8F3DC', borderRadius: 12, fontSize: 13 }}>
          <strong>Demo accounts:</strong><br />
          Admin: admin / admin123<br />
          Customer: customer / pass123<br />
          Delivery: delivery / pass123
        </div>
      </div>
    </div>
  );
}
