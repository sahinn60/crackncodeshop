import { priceparts } from '@/lib/currency';

export function Price({ amount, className = '' }: { amount: number; className?: string }) {
  const { symbol, value } = priceparts(amount);
  return (
    <span className={className}>
      <span className="font-extrabold text-[1.15em]">{symbol}</span>{' '}{value}
    </span>
  );
}
