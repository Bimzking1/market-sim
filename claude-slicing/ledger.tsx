import { formatSignedRp } from "../utils/format";
import type { LedgerLine } from "../types";

/**
 * Reusable ledger line list with a computed total row. Used inside both the
 * dark ReadoutPanel (Dashboard) and the light PaperPanel (Report), so the
 * neutral text/border colors are theme-aware — only the amount colors
 * (jade/rust) stay constant since they read fine on both surfaces.
 */
export function LedgerList({
  lines,
  totalLabel = "Net",
  variant = "dark",
}: {
  lines: LedgerLine[];
  totalLabel?: string;
  variant?: "dark" | "paper";
}) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const theme =
    variant === "paper"
      ? {
          divider: "divide-ink-900/15",
          label: "text-ink-900/70",
          border: "border-ink-900/20",
          totalLabel: "text-ink-900",
        }
      : {
          divider: "divide-ink-700",
          label: "text-mist-300",
          border: "border-ink-600",
          totalLabel: "text-paper-100",
        };

  return (
    <div>
      <ul className={`divide-y ${theme.divider}`}>
        {lines.map((line) => (
          <li key={line.label} className="flex items-center justify-between py-2 text-[14px]">
            <span className={theme.label}>{line.label}</span>
            <span
              className={`font-nums ${line.amount < 0 ? "text-rust-500" : "text-jade-500"}`}
            >
              {formatSignedRp(line.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div className={`mt-2 flex items-center justify-between border-t ${theme.border} pt-3`}>
        <span className={`font-display text-[15px] ${theme.totalLabel}`}>{totalLabel}</span>
        <span
          className={`font-nums font-display text-[17px] ${
            total < 0 ? "text-rust-500" : "text-jade-500"
          }`}
        >
          {formatSignedRp(total)}
        </span>
      </div>
    </div>
  );
}