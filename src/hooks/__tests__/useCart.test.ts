import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '../useCart';
import { Product } from '../../services/api';

const product1: Product = { id: '1', name: 'Headphones', price: 80, image: '🎧' };
const product2: Product = { id: '2', name: 'Keyboard', price: 120, image: '⌨️' };

describe('useCart', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  it('adds items', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem(product1));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(1);
  });

  it('increments quantity for duplicate add', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addItem(product1);
      result.current.addItem(product1);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.itemCount).toBe(2);
  });

  it('removes items', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addItem(product1);
      result.current.addItem(product2);
    });
    act(() => result.current.removeItem('1'));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe('2');
  });

  it('updates quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem(product1));
    act(() => result.current.updateQuantity('1', 5));
    expect(result.current.items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem(product1));
    act(() => result.current.updateQuantity('1', 0));
    expect(result.current.items).toHaveLength(0);
  });

  it('calculates totals with discount', () => {
    const { result } = renderHook(() => useCart(10)); // 10% discount
    act(() => result.current.addItem(product1)); // $80
    expect(result.current.subtotal).toBe(80);
    expect(result.current.discountedTotal).toBe(72); // 80 - 10%
    expect(result.current.tax).toBe(7.2); // 10% tax on 72
    expect(result.current.total).toBe(79.2);
  });

  it('clears cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addItem(product1);
      result.current.addItem(product2);
    });
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
  });
});
