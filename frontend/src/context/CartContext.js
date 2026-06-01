import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total: 0, item_count: 0 });
      return;
    }
    if (user.role !== 'customer') return;
    try {
      const { data } = await orderAPI.getCart();
      console.log('Cart fetched:', data); // debug
      setCart(data);
    } catch (err) {
      console.error('Cart fetch error:', err);
    }
  }, [user]);

  // Fetch cart whenever user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await orderAPI.addToCart({
        product_id: productId,
        quantity,
      });
      console.log('Cart after add:', data); // debug
      setCart(data);
      return true;
    } catch (err) {
      console.error('Add to cart error:', err.response?.data);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const { data } = await orderAPI.updateCartItem({
        item_id: itemId,
        quantity,
      });
      setCart(data);
    } catch (err) {
      console.error('Update cart error:', err.response?.data);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await orderAPI.removeCartItem({ item_id: itemId });
      setCart(data);
    } catch (err) {
      console.error('Remove cart error:', err.response?.data);
    }
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateItem, removeItem, fetchCart, loading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);