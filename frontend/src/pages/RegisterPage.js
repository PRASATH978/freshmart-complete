import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '', role: 'customer' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).forEach(msgs => toast.error(Array.isArray(msgs) ? msgs[0] : msgs));
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({...form, [key]: e.target.value});

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🛒</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#1B4332' }}>Create Account</h1>
          <p style={{ color: '#6B7F6B', fontSize: 13 }}>Join FreshMart for fresh deliveries!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">First Name</label><input value={form.first_name} onChange={set('first_name')} placeholder="First name" /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></div>
          </div>
          <div className="form-group"><label className="form-label">Username *</label><input value={form.username} onChange={set('username')} placeholder="Choose username" required /></div>
          <div className="form-group"><label className="form-label">Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required /></div>
          <div className="form-group"><label className="form-label">Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" /></div>
          <div className="form-group"><label className="form-label">Password *</label><input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required /></div>
          <div className="form-group">
            <label className="form-label">Register as</label>
            <select value={form.role} onChange={set('role')}>
              <option value="customer">Customer</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating...' : '✅ Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: '#6B7F6B', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: '#2D6A4F', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
