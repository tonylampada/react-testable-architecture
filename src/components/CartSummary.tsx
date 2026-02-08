import { CartItem } from '../hooks/useCart';
import { formatCurrency } from '../utils/pricing';

interface Props {
  items: CartItem[];
  subtotal: number;
  discountedTotal: number;
  tax: number;
  total: number;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClear: () => void;
}

export function CartSummary({
  items, subtotal, discountedTotal, tax, total,
  onRemove, onUpdateQuantity, onClear,
}: Props) {
  if (items.length === 0) {
    return <div className="cart-empty" data-testid="cart-empty">Your cart is empty</div>;
  }

  return (
    <div className="cart-summary" data-testid="cart-summary">
      <h2>Shopping Cart</h2>
      <ul>
        {items.map((item) => (
          <li key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
            <span>{item.product.image} {item.product.name}</span>
            <span>{formatCurrency(item.product.price)} × </span>
            <input
              type="number"
              value={item.quantity}
              min={1}
              onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)}
              aria-label={`Quantity for ${item.product.name}`}
            />
            <button onClick={() => onRemove(item.product.id)} aria-label={`Remove ${item.product.name}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="cart-totals">
        <p>Subtotal: {formatCurrency(subtotal)}</p>
        {subtotal !== discountedTotal && <p>After discount: {formatCurrency(discountedTotal)}</p>}
        <p>Tax: {formatCurrency(tax)}</p>
        <p><strong>Total: {formatCurrency(total)}</strong></p>
      </div>
      <button onClick={onClear}>Clear Cart</button>
    </div>
  );
}
