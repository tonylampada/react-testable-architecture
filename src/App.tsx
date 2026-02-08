import { useMemo } from 'react'
import { createMockApi } from './services/api'
import { useProducts } from './hooks/useProducts'
import { useCart } from './hooks/useCart'
import { ProductCard } from './components/ProductCard'
import { CartSummary } from './components/CartSummary'
import './App.css'

function App() {
  const api = useMemo(() => createMockApi(), [])
  const { products, loading, error } = useProducts(api)
  const {
    items, addItem, removeItem, updateQuantity, clearCart,
    subtotal, discountedTotal, tax, total, itemCount,
  } = useCart(10) // 10% discount

  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="app">
      <header>
        <h1>🛒 React Testable Architecture</h1>
        <p className="subtitle">A shopping cart demo — see the <a href="https://github.com/tonylampada/react-testable-architecture" target="_blank">README</a> for the architecture walkthrough</p>
        {itemCount > 0 && <span className="badge">{itemCount} items in cart</span>}
      </header>

      <main>
        <section className="products">
          <h2>Products</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addItem} />
              ))}
            </div>
          )}
        </section>

        <section className="cart">
          <CartSummary
            items={items}
            subtotal={subtotal}
            discountedTotal={discountedTotal}
            tax={tax}
            total={total}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
            onClear={clearCart}
          />
          {items.length > 0 && (
            <p className="discount-note">🏷️ 10% discount applied!</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
