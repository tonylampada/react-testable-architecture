import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, createFetchApi } from '../api';

describe('createMockApi', () => {
  it('returns products', async () => {
    const api = createMockApi();
    const products = await api.fetchProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty('id');
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('price');
  });

  it('returns a single product by id', async () => {
    const api = createMockApi();
    const product = await api.fetchProduct('1');
    expect(product.id).toBe('1');
  });

  it('throws for unknown product', async () => {
    const api = createMockApi();
    await expect(api.fetchProduct('999')).rejects.toThrow('Product 999 not found');
  });
});

describe('createFetchApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches products from URL', async () => {
    const mockData = [{ id: '1', name: 'Test', price: 10, image: '🧪' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const api = createFetchApi('https://api.example.com');
    const products = await api.fetchProducts();
    expect(products).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/products');
  });

  it('throws on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const api = createFetchApi('https://api.example.com');
    await expect(api.fetchProducts()).rejects.toThrow('Failed to fetch products');
  });
});
