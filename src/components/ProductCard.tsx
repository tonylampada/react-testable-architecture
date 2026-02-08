import { Product } from '../services/api';
import { formatCurrency } from '../utils/pricing';

interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="product-card" data-testid={`product-${product.id}`}>
      <span className="product-image">{product.image}</span>
      <h3>{product.name}</h3>
      <p className="price">{formatCurrency(product.price)}</p>
      <button onClick={() => onAddToCart(product)}>Add to Cart</button>
    </div>
  );
}
