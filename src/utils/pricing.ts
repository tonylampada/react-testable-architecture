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
