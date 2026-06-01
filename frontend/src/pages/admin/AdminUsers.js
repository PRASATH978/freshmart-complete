import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { authAPI } from '../../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    authAPI.getUsers(roleFilter).then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const ROLE_CFG = {
    admin:    { color: '#8B5CF6', bg: '#F5F3FF', icon: '👑' },
    customer: { color: '#3B82F6', bg: '#EFF6FF', icon: '🛒' },
    delivery: { color: '#F97316', bg: '#FFF7ED', icon: '🚴' },
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex' }}>
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24 }}>👥 Users Management</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['', 'customer', 'delivery', 'admin'].map(r => (
              <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter(r)} style={{ textTransform: 'capitalize' }}>
                {r || 'All'} {r && ROLE_CFG[r]?.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-page fade-in">
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { role: 'customer', label: 'Customers', icon: '🛒', color: '#3B82F6' },
              { role: 'delivery', label: 'Delivery Boys', icon: '🚴', color: '#F97316' },
              { role: 'admin', label: 'Admins', icon: '👑', color: '#8B5CF6' },
            ].map(item => (
              <div key={item.role} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 16, top: 16, fontSize: 36, opacity: 0.15 }}>{item.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>
                  {users.filter(u => u.role === item.role).length}
                </div>
                <div style={{ fontSize: 13, color: '#6B7F6B' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF2EE' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by username or email..." style={{ maxWidth: 320 }} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>User</th><th>Role</th><th>Phone</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#6B7F6B' }}>No users found</td></tr>
                  ) : filtered.map(user => {
                    const cfg = ROLE_CFG[user.role] || {};
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, background: cfg.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: cfg.color, fontSize: 16 }}>
                              {user.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{user.first_name ? `${user.first_name} ${user.last_name}` : user.username}</div>
                              <div style={{ fontSize: 12, color: '#6B7F6B' }}>{user.email}</div>
                              <div style={{ fontSize: 12, color: '#6B7F6B' }}>@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                            {cfg.icon} {user.role}
                          </span>
                        </td>
                        <td style={{ color: '#6B7F6B' }}>{user.phone || '—'}</td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                            {user.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td style={{ color: '#6B7F6B', fontSize: 13 }}>{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
