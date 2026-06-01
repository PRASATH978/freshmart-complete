import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'customer') return;
    try {
      const { data } = await orderAPI.getCart();
      setCart(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await orderAPI.addToCart({ product_id: productId, quantity });
      setCart(data);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const { data } = await orderAPI.updateCartItem({ item_id: itemId, quantity });
      setCart(data);
    } catch {}
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await orderAPI.removeCartItem({ item_id: itemId });
      setCart(data);
    } catch {}
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateItem, removeItem, fetchCart, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
