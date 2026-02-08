import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartSummary } from '../CartSummary';
import { CartItem } from '../../hooks/useCart';

const items: CartItem[] = [
  { product: { id: '1', name: 'Headphones', price: 80, image: '🎧' }, quantity: 2 },
];

describe('CartSummary', () => {
  it('shows empty message when no items', () => {
    render(
      <CartSummary items={[]} subtotal={0} discountedTotal={0} tax={0} total={0}
        onRemove={() => {}} onUpdateQuantity={() => {}} onClear={() => {}} />
    );
    expect(screen.getByTestId('cart-empty')).toBeTruthy();
  });

  it('renders cart items', () => {
    render(
      <CartSummary items={items} subtotal={160} discountedTotal={160} tax={16} total={176}
        onRemove={() => {}} onUpdateQuantity={() => {}} onClear={() => {}} />
    );
    expect(screen.getByText(/Headphones/)).toBeTruthy();
    expect(screen.getByText(/\$176\.00/)).toBeTruthy();
  });

  it('calls onRemove when remove clicked', () => {
    const onRemove = vi.fn();
    render(
      <CartSummary items={items} subtotal={160} discountedTotal={160} tax={16} total={176}
        onRemove={onRemove} onUpdateQuantity={() => {}} onClear={() => {}} />
    );
    fireEvent.click(screen.getByLabelText('Remove Headphones'));
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('calls onClear when clear clicked', () => {
    const onClear = vi.fn();
    render(
      <CartSummary items={items} subtotal={160} discountedTotal={160} tax={16} total={176}
        onRemove={() => {}} onUpdateQuantity={() => {}} onClear={onClear} />
    );
    fireEvent.click(screen.getByText('Clear Cart'));
    expect(onClear).toHaveBeenCalled();
  });
});
