import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

const product = { id: '1', name: 'Headphones', price: 79.99, image: '🎧' };

describe('ProductCard', () => {
  it('renders product info', () => {
    render(<ProductCard product={product} onAddToCart={() => {}} />);
    expect(screen.getByText('Headphones')).toBeTruthy();
    expect(screen.getByText('$79.99')).toBeTruthy();
    expect(screen.getByText('🎧')).toBeTruthy();
  });

  it('calls onAddToCart when button clicked', () => {
    const onAdd = vi.fn();
    render(<ProductCard product={product} onAddToCart={onAdd} />);
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(onAdd).toHaveBeenCalledWith(product);
  });
});
