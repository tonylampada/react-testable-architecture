import { useState, useCallback } from 'react';
import type { Product } from '../services/api';
import { calculateTotal, calculateTax, calculateDiscount } from '../utils/pricing';

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useCart(discountPercent: number = 0) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = calculateTotal(
    items.map((i) => ({ price: i.product.price, quantity: i.quantity }))
  );
  const discountedTotal = calculateDiscount(subtotal, discountPercent);
  const tax = calculateTax(discountedTotal);
  const total = Math.round((discountedTotal + tax) * 100) / 100;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    discountedTotal,
    tax,
    total,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
