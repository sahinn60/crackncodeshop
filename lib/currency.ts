const formatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return formatter.format(amount).replace('BDT', '৳');
}

export function priceparts(amount: number): { symbol: string; value: string } {
  const raw = formatter.format(amount).replace('BDT', '').trim();
  return { symbol: '৳', value: raw };
}
