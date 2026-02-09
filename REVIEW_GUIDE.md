# React Testable Architecture — Review Guide

A practical checklist for reviewing React PRs. Designed for both AI reviewers (e.g., Claude Code) and humans.

---

## Quick Decision: Which Layer Is This File In?

| Path pattern | Layer | Key question |
|---|---|---|
| `src/utils/**` | Pure Functions | Is it pure? No imports from React, no side effects? |
| `src/services/**` | Services | Does it implement an interface? Is it injectable? |
| `src/hooks/**` | Custom Hooks | Does it own state logic? No JSX? |
| `src/components/**` | Components | Is it presentational? Props only, no hooks (except event handlers)? |
| `src/App.tsx` | Composition Root | Does it wire layers together without adding logic? |

---

## Layer-by-Layer Checklist

### ✅ Pure Functions (`utils/`)

- [ ] No imports from React, services, or hooks
- [ ] No side effects (no fetch, no console.log, no mutation of inputs)
- [ ] Throws on invalid input instead of returning magic values
- [ ] Has corresponding test file in `__tests__/`
- [ ] Tests cover: happy path, edge cases, error cases
- [ ] Functions are exported individually (not a class)

### ✅ Services (`services/`)

- [ ] Defines or implements an **interface** (e.g., `ProductApi`)
- [ ] No React imports
- [ ] Factory function pattern (e.g., `createMockApi()`, `createFetchApi(baseUrl)`)
- [ ] Throws meaningful errors on failure (not silent fallbacks)
- [ ] Has tests — mock implementation tested directly, fetch implementation tested with stubbed `fetch`
- [ ] Types are exported for consumers

### ✅ Custom Hooks (`hooks/`)

- [ ] Returns data + action functions (not JSX)
- [ ] Uses services via interface injection (parameter), not hardcoded
- [ ] Derived values are computed, not stored in state
- [ ] `useCallback` on functions returned to consumers
- [ ] Cleanup in `useEffect` (e.g., `cancelled` flag for async)
- [ ] Has tests using `renderHook` + `act`
- [ ] Tests inject mock services — no module-level mocking

### ✅ Components (`components/`)

- [ ] No `useState` or `useEffect`
- [ ] No direct API calls or service imports
- [ ] All data comes from props
- [ ] All actions are callback props (e.g., `onAddToCart`, `onRemove`)
- [ ] Uses utility functions for formatting (e.g., `formatCurrency`)
- [ ] Has tests that render with props and assert DOM output
- [ ] Tests verify callback invocation on user interaction

### ✅ Composition Root (`App.tsx`)

- [ ] Wires hooks and components together
- [ ] Minimal logic — no business calculations
- [ ] Creates service instances with `useMemo`
- [ ] Passes hook results as props to components

---

## 🚩 Red Flags

These patterns indicate architecture violations. Flag them in review.

| Red Flag | Why It's Bad | Suggested Fix |
|---|---|---|
| `fetch()` inside a component | Couples UI to network layer | Move to service, inject into hook |
| `useState` in a presentational component | Makes it hard to test without rendering | Extract state to a hook |
| Business logic in JSX (`{price * qty * 0.9}`) | Untestable, duplicatable | Extract to a pure utility function |
| `vi.mock('../services/...')` in hook tests | Fragile, coupled to file paths | Inject mock via parameter instead |
| Storing derived state (`setTotal(...)`) | Can go out of sync | Compute from source state |
| `useEffect` with missing cleanup | Memory leaks, race conditions | Add cleanup / cancelled flag |
| `any` type on props or return values | Defeats TypeScript safety | Define proper interfaces |
| Inline `new Promise` / `setTimeout` in components | Side effects in UI layer | Move to service layer |
| Component importing from `hooks/` | Component is no longer presentational | Pass hook results as props from parent |

---

## Questions to Ask Per File Changed

### For any new file:
1. Which layer does this belong to?
2. Does it only import from layers below it?
3. Does it have a corresponding test file?

### For a component change:
1. Did it gain a `useState` or `useEffect`? Should that be in a hook instead?
2. Are all new props properly typed?
3. Can I test this by just passing props?

### For a hook change:
1. Is new state truly needed, or can it be derived?
2. Are new async operations cleaned up properly?
3. Can the hook be tested without mounting a component?

### For a service change:
1. Does the interface still make sense? Or does it need a new method?
2. Are all implementations updated (mock + real)?
3. Are error cases handled and tested?

### For a utility change:
1. Is it still pure? No sneaky side effects?
2. Are edge cases tested (zero, negative, empty arrays)?
3. Could this break hooks or components that depend on it?

---

## Review Comment Examples

### ✅ Good Comments

```
This fetch call should live in the service layer rather than the component.
Consider adding a `fetchProduct` method to `ProductApi` and calling it
from `useProducts` instead.
```

```
`totalWithTax` can be derived from `subtotal` and `taxRate` — storing it
as separate state risks getting out of sync. Suggest:
  const totalWithTax = subtotal + calculateTax(subtotal);
```

```
Nice use of the cancelled flag in useEffect cleanup! This prevents
state updates after unmount. 👍
```

### ❌ Bad Comments

```
// Too vague
This doesn't look right.
```

```
// Opinion without reasoning
I would do this differently.
```

```
// Nitpick disguised as architecture
You should use `type` instead of `interface` here.
```

```
// Rewrite without explaining why
Just refactor this whole thing.
```

---

## How to Suggest Refactoring

When code violates the architecture, suggest a concrete path forward:

### 1. Identify the violation
> "This component fetches data directly — that's a service + hook responsibility."

### 2. Show the target structure
> "Extract the fetch into a service method, call it from a hook, and pass the result as props."

### 3. Provide a minimal example

```tsx
// Before (component does everything)
function ProductList() {
  const [products, setProducts] = useState([]);
  useEffect(() => { fetch('/api/products').then(r => r.json()).then(setProducts) }, []);
  return products.map(p => <div>{p.name}</div>);
}

// After (separated by layer)
// services/api.ts — add fetchProducts to ProductApi interface
// hooks/useProducts.ts — calls api.fetchProducts(), manages loading/error
// components/ProductList.tsx — receives products as props
function ProductList({ products }: { products: Product[] }) {
  return products.map(p => <div key={p.id}>{p.name}</div>);
}
```

### 4. Keep it incremental
Don't ask for a full rewrite. Suggest the smallest change that moves toward the pattern. One PR = one layer fix.
