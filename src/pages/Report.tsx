import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { LedgerList } from "../components/LedgerList";
import { getRank } from "../engine/game";
import { COMMODITIES } from "../engine/commodities";
import { formatFullRp } from "../utils/format";
import { useNavigate } from "react-router-dom";
import type { LedgerLine, CommodityId } from "../types";

export function Report() {
  const navigate = useNavigate();
  const currentDay = useGameStore((s) => s.currentDay);
  const totalDays = useGameStore((s) => s.totalDays);
  const playerNetWorth = useGameStore((s) => s.playerNetWorth);
  const transactions = useGameStore((s) => s.transactions);
  const objectives = useGameStore((s) => s.objectives);
  const gameOver = useGameStore((s) => s.gameOver);
  const actions = useGameStore((s) => s.actions);
  const creditRating = useGameStore((s) => s.creditRating);

  const STARTING_CAPITAL = 10_000_000;

  const totalTradingProfit = transactions.reduce((sum, t) => {
    return sum + (t.type === "sell" ? t.total : -t.total);
  }, 0);

  const bestCommodity = getBestCommodity(transactions);
  const worstCommodity = getWorstCommodity(transactions);

  const rank = getRank(playerNetWorth);
  const multiple = (playerNetWorth / STARTING_CAPITAL).toFixed(1);

  const lines: LedgerLine[] = [
    { label: "Trading profit", amount: totalTradingProfit },
  ];

  return (
    <div className="space-y-8">
      <header className="border-b border-ink-700 pb-6">
        <p className="text-[13px] text-mist-400">
          Day {gameOver ? totalDays : currentDay} of {totalDays}
          {gameOver ? " — venture closed" : " — venture in progress"}
        </p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Economic Report
        </h1>
      </header>

      <section className="grid gap-6 sm:grid-cols-3">
        <StatBlock
          label="Starting capital"
          value={formatFullRp(STARTING_CAPITAL)}
        />
        <StatBlock
          label="Current net worth"
          value={formatFullRp(playerNetWorth)}
          emphasize
        />
        <StatBlock label="Grew by" value={`${multiple}×`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <PaperPanel
          eyebrow="Statement"
          title="Where the profit came from"
        >
          <LedgerList lines={lines} totalLabel="Total profit" />
        </PaperPanel>

        <div className="space-y-6">
          <ReadoutPanel
            eyebrow="Rank"
            title={`#${rank} this season`}
          />

          <ReadoutPanel title="Highlights">
            <dl className="space-y-3 text-[14px]">
              <HighlightRow
                label="Best commodity"
                value={bestCommodity}
                tone="jade"
              />
              <HighlightRow
                label="Worst commodity"
                value={worstCommodity}
                tone="rust"
              />
              <HighlightRow
                label="Total trades"
                value={`${transactions.length}`}
                tone="jade"
              />
              <HighlightRow
                label="Credit rating"
                value={`${creditRating}`}
                tone="jade"
              />
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
                o.complete
                  ? "border-jade-400/50 text-jade-300"
                  : "border-ink-600 text-mist-300"
              }`}
            >
              {o.complete ? "✓ " : "— "}
              {o.label}
            </li>
          ))}
        </ul>
      </ReadoutPanel>

      <div className="flex flex-wrap justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => {
            actions.newGame();
            navigate("/dashboard");
          }}
          className="border border-brass-400/70 px-6 py-3 text-[14px] text-brass-300 transition-colors hover:bg-brass-400/10"
        >
          Start a new venture
        </button>
        <button
          type="button"
          onClick={() => {
            const json = actions.saveGame();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `kongsi-final-day${currentDay}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="border border-ink-600 px-6 py-3 text-[14px] text-mist-300 transition-colors hover:border-brass-400 hover:text-brass-300"
        >
          Save final report
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
      <dd className={tone === "jade" ? "text-jade-300" : "text-rust-300"}>
        {value}
      </dd>
    </div>
  );
}

function getBestCommodity(transactions: any[]): string {
  const profitByCommodity: Record<string, number> = {};
  for (const t of transactions) {
    if (!profitByCommodity[t.commodityId]) profitByCommodity[t.commodityId] = 0;
    profitByCommodity[t.commodityId] += t.type === "sell" ? t.total : -t.total;
  }
  const best = Object.entries(profitByCommodity).sort(
    ([, a], [, b]) => b - a
  )[0];
  if (!best) return "None";
  const def = COMMODITIES[best[0] as CommodityId];
  return def ? `${def.emoji} ${def.name}` : best[0];
}

function getWorstCommodity(transactions: any[]): string {
  const profitByCommodity: Record<string, number> = {};
  for (const t of transactions) {
    if (!profitByCommodity[t.commodityId]) profitByCommodity[t.commodityId] = 0;
    profitByCommodity[t.commodityId] += t.type === "sell" ? t.total : -t.total;
  }
  const worst = Object.entries(profitByCommodity).sort(
    ([, a], [, b]) => a - b
  )[0];
  if (!worst) return "None";
  const def = COMMODITIES[worst[0] as CommodityId];
  return def ? `${def.emoji} ${def.name}` : worst[0];
}
