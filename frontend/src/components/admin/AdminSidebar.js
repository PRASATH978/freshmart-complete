import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin',          label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products',  icon: '🥦' },
  { path: '/admin/orders',   label: 'Orders',    icon: '📦' },
  { path: '/admin/payments', label: 'Payments',  icon: '💳' },
  { path: '/admin/users',    label: 'Users',     icon: '👥' },
  { path: '/admin/offers',   label: 'Offers',    icon: '🏷️' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div style={{ fontSize: 28, marginBottom: 4 }}>🥦</div>
        <div>FreshMart Admin</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{user?.username}</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <Link key={item.path} to={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}>
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', width: '100%', cursor: 'pointer', fontSize: 14 }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
