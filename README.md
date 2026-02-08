# React Testable Architecture

A didactic example of how to structure a React application for maximum testability. This project implements a simple **Shopping Cart** app, organized into four clean architectural layers — each independently testable.

> **31 tests • 6 test files • all passing in <1 second**

---

https://github.com/tonylampada/react-testable-architecture/raw/master/audio/section-1-introduction.mp4

## 1. Introduction — Why Testable Architecture Matters

Most React apps start simple, then grow into tangled messes where business logic, API calls, state management, and UI are all mixed together. Testing becomes painful — you need to spin up entire component trees just to verify a discount calculation.

**Testable architecture** solves this by separating concerns into layers. Each layer has a single responsibility, clear boundaries, and can be tested independently. The result:

- ⚡ **Fast tests** — pure function tests run in microseconds
- 🎯 **Focused tests** — each test verifies one thing
- 🔄 **Easy refactoring** — change the UI without breaking business logic tests
- 🛡️ **Confidence** — 31 tests cover every layer, running on every commit

---

🔊 **[Listen to this section](./audio/section-2-architecture.wav)**

## 2. The Architecture

```
┌─────────────────────────────────────────────┐
│           Components (Layer 4)              │
│   ProductCard, CartSummary                  │
│   Pure UI — props in, markup out            │
├─────────────────────────────────────────────┤
│           Custom Hooks (Layer 3)            │
│   useCart, useProducts                      │
│   All state logic — no rendering            │
├─────────────────────────────────────────────┤
│           Services (Layer 2)                │
│   ProductApi interface                      │
│   Mock + Fetch implementations              │
├─────────────────────────────────────────────┤
│           Pure Functions (Layer 1)          │
│   calculateDiscount, calculateTax           │
│   calculateTotal, formatCurrency            │
│   Zero dependencies — pure math             │
└─────────────────────────────────────────────┘
```

**Each layer only depends on the layers below it.** Components use hooks, hooks use services and utils, services use utils. Nothing reaches upward.

---

🔊 **[Listen to this section](./audio/section-3-pure-functions.wav)**

## 3. Layer 1: Pure Functions

Pure functions are the foundation. They take inputs, return outputs, and have absolutely no side effects.

### `src/utils/pricing.ts`

```typescript
export function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

export function calculateTax(price: number, taxRate: number = 0.1): number {
  return Math.round(price * taxRate * 100) / 100;
}

export function calculateTotal(items: { price: number; quantity: number }[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
```

### Testing Pure Functions

Testing is trivial — call function, check result:

```typescript
describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  it('throws on invalid discount', () => {
    expect(() => calculateDiscount(100, -5)).toThrow();
  });
});
```

**10 tests, zero dependencies, runs in 4ms.** This is the widest part of your testing pyramid.

---

🔊 **[Listen to this section](./audio/section-4-services.wav)**

## 4. Layer 2: Services

The service layer abstracts all external communication behind **interfaces**. This is the key to making hooks testable — they depend on an interface, not a concrete implementation.

### `src/services/api.ts`

```typescript
export interface ProductApi {
  fetchProducts(): Promise<Product[]>;
  fetchProduct(id: string): Promise<Product>;
}

// For development and tests
export function createMockApi(): ProductApi { /* ... */ }

// For production
export function createFetchApi(baseUrl: string): ProductApi { /* ... */ }
```

### Testing Services

The mock API is tested directly. The fetch API is tested with a stubbed `fetch`:

```typescript
describe('createFetchApi', () => {
  it('fetches products from URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    }));

    const api = createFetchApi('https://api.example.com');
    const products = await api.fetchProducts();
    expect(products).toEqual(mockData);
  });
});
```

---

🔊 **[Listen to this section](./audio/section-5-custom-hooks.wav)**

## 5. Layer 3: Custom Hooks

Hooks contain **all the state logic**. They manage state, call services, compute derived values. But they never render anything — that's the components' job.

### `src/hooks/useCart.ts`

```typescript
export function useCart(discountPercent: number = 0) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => { /* ... */ }, []);
  const removeItem = useCallback((productId: string) => { /* ... */ }, []);

  const subtotal = calculateTotal(items.map(/*...*/));
  const discountedTotal = calculateDiscount(subtotal, discountPercent);
  const tax = calculateTax(discountedTotal);
  const total = Math.round((discountedTotal + tax) * 100) / 100;

  return { items, addItem, removeItem, subtotal, tax, total, /* ... */ };
}
```

### Testing Hooks with `renderHook`

No component needed — `renderHook` runs the hook in isolation:

```typescript
it('adds items and calculates totals with discount', () => {
  const { result } = renderHook(() => useCart(10)); // 10% discount
  act(() => result.current.addItem(product)); // $80

  expect(result.current.subtotal).toBe(80);
  expect(result.current.discountedTotal).toBe(72);  // 80 - 10%
  expect(result.current.tax).toBe(7.2);              // 10% of 72
  expect(result.current.total).toBe(79.2);
});
```

---

🔊 **[Listen to this section](./audio/section-6-components.wav)**

## 6. Layer 4: Components

Components are **pure UI**. They receive data and callbacks via props. No `useState`, no `useEffect`, no API calls. Just rendering.

### `src/components/ProductCard.tsx`

```tsx
export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="product-card">
      <span>{product.image}</span>
      <h3>{product.name}</h3>
      <p>{formatCurrency(product.price)}</p>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  );
}
```

### Testing Components

Render with props, assert the DOM, simulate events:

```typescript
it('renders product info', () => {
  render(<ProductCard product={product} onAddToCart={() => {}} />);
  expect(screen.getByText('Headphones')).toBeTruthy();
  expect(screen.getByText('$79.99')).toBeTruthy();
});

it('calls onAddToCart when button clicked', () => {
  const onAdd = vi.fn();
  render(<ProductCard product={product} onAddToCart={onAdd} />);
  fireEvent.click(screen.getByText('Add to Cart'));
  expect(onAdd).toHaveBeenCalledWith(product);
});
```

---

🔊 **[Listen to this section](./audio/section-7-testing-pyramid.wav)**

## 7. The Testing Pyramid

```
        ╱╲
       ╱  ╲        Component Tests (6)
      ╱    ╲       @testing-library/react + jsdom
     ╱──────╲
    ╱        ╲     Hook & Service Tests (15)
   ╱          ╲    renderHook, mocked fetch
  ╱────────────╲
 ╱              ╲  Pure Function Tests (10)
╱________________╲ Zero deps, instant
```

| Layer | Test Count | Speed | Dependencies |
|-------|-----------|-------|-------------|
| Pure Functions | 10 | ~4ms | None |
| Services | 5 | ~200ms | Mocked fetch |
| Hooks | 10 | ~130ms | renderHook |
| Components | 6 | ~60ms | jsdom + RTL |
| **Total** | **31** | **<1s** | |

**Key insight:** Most of your tests should be at the bottom — fast, simple, and stable. As you move up the pyramid, tests get slower and more complex, so you write fewer of them.

---

🔊 **[Listen to this section](./audio/section-8-running-tests.wav)**

## 8. Running the Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest src/utils/__tests__/pricing.test.ts
```

### Expected output:

```
 ✓ src/utils/__tests__/pricing.test.ts (10 tests) 4ms
 ✓ src/hooks/__tests__/useCart.test.ts (8 tests) 21ms
 ✓ src/components/__tests__/ProductCard.test.tsx (2 tests) 25ms
 ✓ src/components/__tests__/CartSummary.test.tsx (4 tests) 36ms
 ✓ src/hooks/__tests__/useProducts.test.ts (2 tests) 116ms
 ✓ src/services/__tests__/api.test.ts (5 tests) 206ms

 Test Files  6 passed (6)
      Tests  31 passed (31)
   Duration  <1s
```

### CI

Tests run automatically on every push and pull request via GitHub Actions. See [`.github/workflows/test.yml`](.github/workflows/test.yml).

---

## License

MIT
