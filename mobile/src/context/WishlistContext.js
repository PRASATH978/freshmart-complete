import React, { createContext, useContext, useState, useEffect } from 'react';
import { productAPI } from '../api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = async () => {
    try {
      const { data } = await productAPI.getWishlist();
      setWishlist(data.map(item => item.product.id));
    } catch {}
  };

  useEffect(() => { loadWishlist(); }, []);

  const toggleWishlist = async (product_id) => {
    const isWishlisted = wishlist.includes(product_id);
    if (isWishlisted) {
      await productAPI.removeFromWishlist(product_id);
      setWishlist(prev => prev.filter(id => id !== product_id));
    } else {
      await productAPI.addToWishlist(product_id);
      setWishlist(prev => [...prev, product_id]);
    }
    return !isWishlisted;
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);