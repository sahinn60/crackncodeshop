const formatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Round to nearest integer — use for all final display values */
export function formatBDT(amount: number): number {
  return Math.round(amount);
}

/** Format as "৳ 15" string — rounded, no decimals */
export function formatPrice(amount: number): string {
  return formatter.format(Math.round(amount)).replace('BDT', '৳');
}

/** Get symbol + value parts — rounded, no decimals */
export function priceparts(amount: number): { symbol: string; value: string } {
  const rounded = Math.round(amount);
  const raw = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  return { symbol: '৳', value: raw };
}
