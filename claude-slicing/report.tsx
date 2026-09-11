import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { LedgerList } from "../components/LedgerList";
import { objectives, finalReport } from "../data/mockData";
import { formatFullRp } from "../utils/format";

export function Report() {
  const multiple = (finalReport.finalNetWorth / finalReport.startingCapital).toFixed(0);

  return (
    <div className="space-y-8">
      <header className="border-b border-ink-700 pb-6">
        <p className="text-[13px] text-mist-400">
          Day {finalReport.totalDays} of {finalReport.totalDays} — venture closed
        </p>
        <h1 className="font-display text-3xl font-medium text-paper-100">Economic report</h1>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        <StatBlock label="Starting capital" value={formatFullRp(finalReport.startingCapital)} />
        <StatBlock label="Final net worth" value={formatFullRp(finalReport.finalNetWorth)} emphasize />
        <StatBlock label="Grew by" value={`${multiple}×`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <PaperPanel eyebrow="Statement" title="Where the profit came from">
          <LedgerList lines={finalReport.lines} totalLabel="Total profit" variant="paper" />
        </PaperPanel>

        <div className="space-y-6">
          <ReadoutPanel eyebrow="Rank" title={`#${finalReport.finalRank} this season`} />

          <ReadoutPanel title="Highlights">
            <dl className="space-y-3 text-[14px]">
              <HighlightRow label="Best commodity" value={finalReport.bestCommodity} tone="jade" />
              <HighlightRow label="Worst commodity" value={finalReport.worstCommodity} tone="rust" />
              <HighlightRow label="Best city" value={finalReport.bestCity} tone="jade" />
              <HighlightRow label="Best investment" value={finalReport.bestInvestment} tone="jade" />
              <HighlightRow label="Worst investment" value={finalReport.worstInvestment} tone="rust" />
            </dl>
          </ReadoutPanel>
        </div>
      </div>

      <ReadoutPanel eyebrow="Season goals" title="Objectives">
        <ul className="grid gap-3 sm:grid-cols-2">
          {objectives.map((o) => (
            <li
              key={o.id}
              className={`border px-3 py-2 text-[14px] ${
                o.complete ? "border-jade-400/50 text-jade-300" : "border-ink-600 text-mist-300"
              }`}
            >
              {o.complete ? "✓ " : "— "}
              {o.label}
            </li>
          ))}
        </ul>
      </ReadoutPanel>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          className="border border-brass-400/70 px-6 py-3 text-[14px] text-brass-300 transition-colors hover:bg-brass-400/10"
        >
          Start a new venture
        </button>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[13px] text-mist-400">{label}</p>
      <p
        className={`font-nums font-display text-2xl sm:text-3xl ${
          emphasize ? "text-brass-300" : "text-paper-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function HighlightRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "jade" | "rust";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-mist-400">{label}</dt>
      <dd className={tone === "jade" ? "text-jade-300" : "text-rust-300"}>{value}</dd>
    </div>
  );
}