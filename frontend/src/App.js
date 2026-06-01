import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/user/HomePage';
import ProductsPage from './pages/user/ProductsPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import OffersPage from './pages/user/OffersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOffers from './pages/admin/AdminOffers';
import AdminPayments from './pages/admin/AdminPayments';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const getHome = () => {
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'delivery') return <Navigate to="/delivery" />;
    return <HomePage />;
  };
  return (
    <Routes>
      <Route path="/" element={getHome()} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shop" element={<PrivateRoute roles={['customer']}><ProductsPage /></PrivateRoute>} />
      <Route path="/product/:id" element={<PrivateRoute roles={['customer']}><ProductDetailPage /></PrivateRoute>} />
      <Route path="/cart" element={<PrivateRoute roles={['customer']}><CartPage /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute roles={['customer']}><CheckoutPage /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute roles={['customer']}><OrdersPage /></PrivateRoute>} />
      <Route path="/offers" element={<PrivateRoute roles={['customer']}><OffersPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/products" element={<PrivateRoute roles={['admin']}><AdminProducts /></PrivateRoute>} />
      <Route path="/admin/orders" element={<PrivateRoute roles={['admin']}><AdminOrders /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/offers" element={<PrivateRoute roles={['admin']}><AdminOffers /></PrivateRoute>} />
      <Route path="/admin/payments" element={<PrivateRoute roles={['admin']}><AdminPayments /></PrivateRoute>} />
      <Route path="/delivery" element={<PrivateRoute roles={['delivery']}><DeliveryDashboard /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
