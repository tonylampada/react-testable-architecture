import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../useProducts';
import { ProductApi } from '../../services/api';

describe('useProducts', () => {
  it('loads products from api', async () => {
    const mockApi: ProductApi = {
      fetchProducts: vi.fn().mockResolvedValue([
        { id: '1', name: 'Test', price: 10, image: '🧪' },
      ]),
      fetchProduct: vi.fn(),
    };

    const { result } = renderHook(() => useProducts(mockApi));
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('handles errors', async () => {
    const mockApi: ProductApi = {
      fetchProducts: vi.fn().mockRejectedValue(new Error('Network error')),
      fetchProduct: vi.fn(),
    };

    const { result } = renderHook(() => useProducts(mockApi));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.products).toEqual([]);
  });
});
