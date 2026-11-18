export function currencyLabel(code?: string | null): string {
  return code === 'AUD' || code === 'KRW' || code === 'USD' ? code : 'currency unknown';
}

export function formatStockPrice(value: unknown, code?: string | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const number = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const label = currencyLabel(code);
  return label === 'currency unknown' ? `${number} (currency unknown)` : `${label} ${number}`;
}
