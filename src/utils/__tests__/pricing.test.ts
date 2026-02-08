import { describe, it, expect } from 'vitest';
import { calculateDiscount, calculateTax, calculateTotal, formatCurrency } from '../pricing';

describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });
  it('handles zero discount', () => {
    expect(calculateDiscount(49.99, 0)).toBe(49.99);
  });
  it('handles 100% discount', () => {
    expect(calculateDiscount(49.99, 100)).toBe(0);
  });
  it('throws on invalid discount', () => {
    expect(() => calculateDiscount(100, -5)).toThrow();
    expect(() => calculateDiscount(100, 101)).toThrow();
  });
  it('rounds to 2 decimals', () => {
    expect(calculateDiscount(10, 33)).toBe(6.7);
  });
});

describe('calculateTax', () => {
  it('calculates 10% tax by default', () => {
    expect(calculateTax(100)).toBe(10);
  });
  it('accepts custom rate', () => {
    expect(calculateTax(100, 0.25)).toBe(25);
  });
});

describe('calculateTotal', () => {
  it('sums price * quantity', () => {
    expect(calculateTotal([
      { price: 10, quantity: 2 },
      { price: 5.5, quantity: 3 },
    ])).toBe(36.5);
  });
  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats with dollar sign and 2 decimals', () => {
    expect(formatCurrency(9.9)).toBe('$9.90');
    expect(formatCurrency(1234.5)).toBe('$1234.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
