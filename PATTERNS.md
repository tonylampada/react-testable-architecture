# React Testable Architecture — Patterns & Best Practices

A catalog of patterns used in this project. Each pattern includes what to do, what to avoid, and why it matters.

---

## 1. Separate Components, Hooks, Services, and Utils

✅ **Do:** Organize code into four distinct layers with clear responsibilities.

```
src/
  utils/          # Pure functions — zero dependencies
  services/       # API abstraction — injectable interfaces
  hooks/          # State logic — no rendering
  components/     # UI — props in, markup out
```

❌ **Don't:** Mix concerns in a single file.

```tsx
// ❌ Component that fetches data, manages state, AND renders
function ProductPage() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);
  const total = products.reduce((s, p) => s + p.price, 0);
  return <div>{products.map(p => <div>{p.name} ${p.price}</div>)}</div>;
}
```

💡 Separation makes each layer independently testable and replaceable. You can test business logic without rendering anything.

---

## 2. Presentational Components (No useState/useEffect)

✅ **Do:** Components receive everything via props — data and callbacks.

```tsx
interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{formatCurrency(product.price)}</p>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  );
}
```

❌ **Don't:** Put state or effects inside presentational components.

```tsx
// ❌ Component owns state it shouldn't
export function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const handleClick = () => {
    fetch('/api/cart', { method: 'POST', body: JSON.stringify(product) });
    setAdded(true);
  };
  return <button onClick={handleClick}>{added ? 'Added' : 'Add'}</button>;
}
```

💡 Pure components are trivial to test — render with props, assert the DOM. No mocking, no async, no side effects.

---

## 3. Custom Hooks for State Logic

✅ **Do:** Extract all state management into custom hooks that return data + actions.

```ts
export function useCart(discountPercent: number = 0) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems(prev => { /* immutable update */ });
  }, []);

  const subtotal = calculateTotal(items.map(/* ... */));
  const total = calculateDiscount(subtotal, discountPercent);

  return { items, addItem, subtotal, total };
}
```

❌ **Don't:** Scatter state logic across components.

```tsx
// ❌ State logic lives in the component
function App() {
  const [items, setItems] = useState([]);
  const addItem = (p) => setItems(prev => [...prev, p]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = total * 0.1; // business logic in component!
  return <div>...</div>;
}
```

💡 Hooks can be tested with `renderHook` — no DOM needed. This isolates state logic from rendering.

---

## 4. Service Layer with Injectable Interfaces

✅ **Do:** Define an interface, then provide multiple implementations (mock, fetch, etc.).

```ts
export interface ProductApi {
  fetchProducts(): Promise<Product[]>;
  fetchProduct(id: string): Promise<Product>;
}

export function createMockApi(): ProductApi { /* ... */ }
export function createFetchApi(baseUrl: string): ProductApi { /* ... */ }
```

Usage — inject at the call site:

```ts
const api = useMemo(() => createMockApi(), []);
const { products } = useProducts(api);
```

❌ **Don't:** Hardcode API calls inside hooks or components.

```ts
// ❌ Hook tightly coupled to fetch
export function useProducts() {
  useEffect(() => {
    fetch('https://api.example.com/products')
      .then(r => r.json())
      .then(setProducts);
  }, []);
}
```

💡 Dependency injection lets you swap implementations without changing consumers. Tests use mocks; production uses real APIs.

---

## 5. Testing Pyramid — More Unit Tests, Fewer Integration Tests

✅ **Do:** Write many fast unit tests at the bottom, fewer complex tests at the top.

```
Layer            Tests    Speed
─────────────────────────────────
Pure Functions   10       ~4ms      ← most tests here
Services         5        ~200ms
Hooks            10       ~130ms
Components       6        ~60ms    ← fewest tests here
```

❌ **Don't:** Write only end-to-end or component tests.

```tsx
// ❌ Testing business logic through the UI
it('calculates discount', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Add to Cart'));
  // Now you need to find the total in the DOM, parse it...
  expect(screen.getByText('$72.00')).toBeTruthy();
});
```

💡 Unit tests for pure functions are instant and stable. Test calculations directly — don't force them through a UI layer.

---

## 6. Colocate Tests with Source Code

✅ **Do:** Place `__tests__/` directories next to the code they test.

```
src/
  utils/
    pricing.ts
    __tests__/
      pricing.test.ts
  hooks/
    useCart.ts
    __tests__/
      useCart.test.ts
```

❌ **Don't:** Put all tests in a separate top-level `tests/` directory.

```
src/
  utils/pricing.ts
  hooks/useCart.ts
tests/                    # ❌ far from source
  utils/pricing.test.ts
  hooks/useCart.test.ts
```

💡 Colocation makes tests discoverable. When you open a module, its tests are right there. Moves and renames stay in sync.

---

## 7. Mock Services in Hook Tests

✅ **Do:** Create a mock that satisfies the interface and inject it.

```ts
it('loads products from API', async () => {
  const mockApi: ProductApi = {
    fetchProducts: vi.fn().mockResolvedValue([mockProduct]),
    fetchProduct: vi.fn(),
  };

  const { result } = renderHook(() => useProducts(mockApi));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.products).toEqual([mockProduct]);
});
```

❌ **Don't:** Mock module internals or global fetch in hook tests.

```ts
// ❌ Fragile — coupled to implementation details
vi.mock('../services/api', () => ({
  createFetchApi: () => ({
    fetchProducts: () => Promise.resolve([mockProduct]),
  }),
}));
```

💡 Interface-based mocking is explicit and resilient. If the interface changes, TypeScript catches it at compile time.

---

## 8. Derived State vs Stored State

✅ **Do:** Compute values from existing state instead of storing them separately.

```ts
// items is stored state
const [items, setItems] = useState<CartItem[]>([]);

// these are derived — computed on every render
const subtotal = calculateTotal(items.map(i => ({ price: i.product.price, quantity: i.quantity })));
const tax = calculateTax(subtotal);
const total = subtotal + tax;
```

❌ **Don't:** Store values that can be computed.

```ts
// ❌ Redundant state — can go out of sync
const [items, setItems] = useState([]);
const [subtotal, setSubtotal] = useState(0);
const [tax, setTax] = useState(0);

const addItem = (product) => {
  const newItems = [...items, product];
  setItems(newItems);
  setSubtotal(calcTotal(newItems));  // easy to forget!
  setTax(calcTax(calcTotal(newItems)));
};
```

💡 Derived state can never be out of sync. One source of truth (stored state), everything else computed from it.

---

## 9. Props Drilling vs Composition

✅ **Do:** Wire hooks at the top level and pass data down as props.

```tsx
function App() {
  const { products } = useProducts(api);
  const { items, addItem, removeItem, total } = useCart(10);

  return (
    <>
      {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={addItem} />)}
      <CartSummary items={items} total={total} onRemove={removeItem} />
    </>
  );
}
```

❌ **Don't:** Use hooks inside deeply nested components (makes them untestable in isolation).

```tsx
// ❌ Each component manages its own data
function ProductList() {
  const { products } = useProducts(createFetchApi('/api'));
  return products.map(p => <ProductCard key={p.id} product={p} />);
}

function ProductCard({ product }) {
  const { addItem } = useCart(); // ❌ hook inside presentational component
  return <button onClick={() => addItem(product)}>Add</button>;
}
```

💡 In small-to-medium apps, props drilling keeps data flow explicit and components testable. For deep trees, consider Context or composition patterns.

---

## 10. useCallback/useMemo When Necessary

✅ **Do:** Memoize callbacks passed to children and expensive computations.

```ts
// Stable callback — won't cause unnecessary re-renders of children
const addItem = useCallback((product: Product) => {
  setItems(prev => { /* ... */ });
}, []);

// Stable reference — api object created once
const api = useMemo(() => createMockApi(), []);
```

❌ **Don't:** Memoize everything or skip memoization for object/function props.

```ts
// ❌ Unnecessary — primitive value
const formattedTotal = useMemo(() => `$${total.toFixed(2)}`, [total]);

// ❌ Missing — new object every render causes useEffect to re-fire
const api = createMockApi(); // new reference each render!
const { products } = useProducts(api); // infinite loop!
```

💡 Memoize when: (a) the value is passed as a prop or dependency, and (b) creating a new reference would cause unnecessary work. Don't memoize cheap operations.

---

## 11. Error Handling by Layer

✅ **Do:** Each layer handles errors appropriate to its level.

```ts
// Utils — throw on invalid input (fail fast)
if (discountPercent < 0 || discountPercent > 100) {
  throw new Error('Discount must be between 0 and 100');
}

// Services — throw on network/API failures
if (!res.ok) throw new Error('Failed to fetch products');

// Hooks — catch and expose as state
const [error, setError] = useState<string | null>(null);
api.fetchProducts()
  .then(data => setProducts(data))
  .catch(err => setError(err.message));

// Components — render error state from props
if (error) return <div className="error">Error: {error}</div>;
```

❌ **Don't:** Catch errors at the wrong layer or swallow them.

```ts
// ❌ Service silently returns empty array on error
async fetchProducts() {
  try {
    const res = await fetch(url);
    return res.json();
  } catch {
    return []; // caller has no idea something went wrong
  }
}
```

💡 Let errors propagate upward. Utils validate, services throw, hooks catch, components display. Each layer adds its own handling.

---

## 12. TypeScript: Interfaces for Contracts, Types for Data

✅ **Do:** Use `interface` for contracts (APIs, props) and `type` for data shapes. Use generics for reusable services.

```ts
// Interface — contract for dependency injection
export interface ProductApi {
  fetchProducts(): Promise<Product[]>;
  fetchProduct(id: string): Promise<Product>;
}

// Type — data shape
export type Product = {
  id: string;
  name: string;
  price: number;
};

// Interface — component props
interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
}
```

❌ **Don't:** Use `any`, skip typing callback props, or inline complex types.

```ts
// ❌ Untyped callback — what does onAction receive?
interface Props {
  data: any;
  onAction: Function;
}

// ❌ Inline types — not reusable, hard to read
function useCart(): { items: { product: { id: string; name: string; price: number }; quantity: number }[] } {
```

💡 Interfaces enable TypeScript to catch contract violations at compile time. When you change `ProductApi`, every mock and implementation must update — the compiler enforces it.
