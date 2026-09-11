import { formatSignedRp } from "../utils/format";
import type { LedgerLine } from "../types";

export function LedgerList({
  lines,
  totalLabel = "Net",
}: {
  lines: LedgerLine[];
  totalLabel?: string;
}) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <div>
      <ul className="divide-y divide-ink-700">
        {lines.map((line, i) => (
          <li key={`${line.label}-${i}`} className="flex items-center justify-between py-2 text-[14px]">
            <span className="text-mist-300">{line.label}</span>
            <span
              className={`font-nums ${line.amount < 0 ? "text-rust-400" : "text-jade-400"}`}
            >
              {formatSignedRp(line.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-ink-600 pt-3">
        <span className="font-display text-[15px] text-paper-100">{totalLabel}</span>
        <span
          className={`font-nums font-display text-[17px] ${
            total < 0 ? "text-rust-400" : "text-jade-400"
          }`}
        >
          {formatSignedRp(total)}
        </span>
      </div>
    </div>
  );
}
