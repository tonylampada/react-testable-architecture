export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface ProductApi {
  fetchProducts(): Promise<Product[]>;
  fetchProduct(id: string): Promise<Product>;
}

const mockProducts: Product[] = [
  { id: '1', name: 'Wireless Headphones', price: 79.99, image: '🎧' },
  { id: '2', name: 'Mechanical Keyboard', price: 129.99, image: '⌨️' },
  { id: '3', name: 'USB-C Hub', price: 49.99, image: '🔌' },
  { id: '4', name: 'Webcam HD', price: 59.99, image: '📷' },
];

export function createMockApi(): ProductApi {
  return {
    async fetchProducts(): Promise<Product[]> {
      await new Promise((r) => setTimeout(r, 100));
      return [...mockProducts];
    },
    async fetchProduct(id: string): Promise<Product> {
      await new Promise((r) => setTimeout(r, 50));
      const product = mockProducts.find((p) => p.id === id);
      if (!product) throw new Error(`Product ${id} not found`);
      return { ...product };
    },
  };
}

export function createFetchApi(baseUrl: string): ProductApi {
  return {
    async fetchProducts(): Promise<Product[]> {
      const res = await fetch(`${baseUrl}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    async fetchProduct(id: string): Promise<Product> {
      const res = await fetch(`${baseUrl}/products/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
      return res.json();
    },
  };
}
