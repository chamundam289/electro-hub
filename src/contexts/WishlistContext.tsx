import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  offer_price?: number;
  image_url?: string;
  slug: string;
  stock_quantity: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  getTotalItems: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const addItem = (product: WishlistItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        toast.info('Item already in wishlist');
        return currentItems;
      } else {
        toast.success('Added to wishlist!');
        return [...currentItems, product];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const value = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    getTotalItems,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};