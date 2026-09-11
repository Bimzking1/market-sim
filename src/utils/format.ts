const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatRp(n: number): string {
  return formatter.format(n);
}

export function formatFullRp(n: number): string {
  return formatter.format(n);
}

export function formatSignedRp(n: number): string {
  const prefix = n >= 0 ? "+" : "-";
  return `${prefix}${formatter.format(Math.abs(n))}`;
}

export function formatPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}