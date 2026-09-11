export function Delta({ value }: { value: number }) {
  const pct = (value * 100).toFixed(1);
  const isPositive = value >= 0;

  return (
    <span
      className={`font-nums text-[13px] px-2 py-0.5 ${
        isPositive
          ? "text-jade-400 bg-jade-400/10"
          : "text-rust-400 bg-rust-400/10"
      }`}
    >
      {isPositive ? "+" : ""}
      {pct}%
    </span>
  );
}
