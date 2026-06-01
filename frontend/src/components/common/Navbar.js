import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🥦</span>
          FreshMart
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>🏠 Home</Link>
          <Link to="/shop" className={`nav-link ${isActive('/shop')}`}>🛍 Shop</Link>
          <Link to="/offers" className={`nav-link ${isActive('/offers')}`}>🏷 Offers</Link>
          <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>📦 My Orders</Link>
          <Link to="/cart" className="cart-btn">
            🛒 Cart
            {cart.item_count > 0 && <span className="cart-count">{cart.item_count}</span>}
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
        </div>
      </div>
    </nav>
  );
}
