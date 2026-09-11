import { Link } from "react-router-dom";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { LedgerList } from "../components/LedgerList";
import { Meter } from "../components/Meter";
import { Sparkline } from "../components/Sparkline";
import {
  commodities,
  cities,
  loans,
  objectives,
  player,
  todaysLedger,
} from "../data/mockData";
import { formatFullRp, formatSignedRp } from "../utils/format";

export function Dashboard() {
  const netToday = todaysLedger.reduce((sum, l) => sum + l.amount, 0);
  const dueSoonLoan = loans.find((l) => l.status === "due_soon" || l.status === "overdue");
  const signals = commodities.filter((c) => c.note).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Hero: net worth is the one number this whole game is about. */}
      <section className="flex flex-col gap-6 border-b border-ink-700 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-mist-400">Net worth, day {player.day}</p>
          <p className="font-nums font-display text-5xl font-semibold text-paper-100 sm:text-6xl">
            {formatFullRp(player.netWorth)}
          </p>
          <p
            className={`mt-2 font-nums text-[15px] ${
              netToday < 0 ? "text-rust-400" : "text-jade-400"
            }`}
          >
            {formatSignedRp(netToday)} today
          </p>
        </div>
        {dueSoonLoan && (
          <div className="border border-rust-400/60 bg-rust-500/10 px-4 py-3 text-[13px] text-rust-300">
            Bank payment of {formatFullRp(dueSoonLoan.remaining)} is due day{" "}
            {dueSoonLoan.dueDay}.{" "}
            <Link to="/bank" className="underline underline-offset-2">
              Review at the bank
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial statement */}
        <PaperPanel eyebrow="Statement" title="What you hold" className="lg:col-span-1">
          <dl className="space-y-2.5 text-[14px]">
            <Row label="Cash" value={player.cash} />
            <Row label="Inventory" value={player.inventoryValue} />
            <Row label="Assets" value={player.assetValue} />
            <Row label="Debt" value={player.debt} />
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-ink-900/15 pt-3">
            <dt className="font-display text-[15px]">Net worth</dt>
            <dd className="font-nums font-display text-[17px] text-brass-600">
              {formatFullRp(player.netWorth)}
            </dd>
          </div>
        </PaperPanel>

        {/* Today's ledger */}
        <ReadoutPanel eyebrow="Today" title="Cash movement" className="lg:col-span-1">
          <LedgerList lines={todaysLedger} totalLabel="Net today" />
        </ReadoutPanel>

        {/* Objectives */}
        <ReadoutPanel eyebrow="Standing goals" title="Objectives" className="lg:col-span-1">
          <ul className="space-y-4">
            {objectives.slice(0, 4).map((o) => (
              <li key={o.id}>
                <Meter
                  value={o.progress}
                  max={1}
                  tone={o.complete ? "jade" : "brass"}
                  label={o.label}
                  valueLabel={o.complete ? "Done" : o.target}
                />
              </li>
            ))}
          </ul>
        </ReadoutPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Market signals */}
        <ReadoutPanel
          eyebrow="Bandung"
          title="Market signals"
          action={
            <Link
              to="/market"
              className="shrink-0 whitespace-nowrap text-[13px] text-brass-300 hover:text-brass-200"
            >
              Open market
            </Link>
          }
        >
          <ul className="divide-y divide-ink-700">
            {signals.map((c) => (
              <li key={c.commodityId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[14px] text-paper-100">{c.name}</p>
                  <p className="truncate text-[12px] text-mist-400">{c.note}</p>
                </div>
                <Sparkline history={c.history} positive={c.changePct >= 0} width={90} height={30} />
              </li>
            ))}
          </ul>
        </ReadoutPanel>

        {/* Active events across cities you know about */}
        <ReadoutPanel eyebrow="Wider region" title="Active events">
          <ul className="space-y-3">
            {cities
              .flatMap((city) => city.events.map((e) => ({ city, e })))
              .map(({ city, e }) => (
                <li key={e.id} className="border-l-2 border-brass-400/60 pl-3">
                  <p className="text-[14px] text-paper-100">
                    {e.label} — {city.name}
                  </p>
                  <p className="text-[13px] text-mist-400">{e.effect}</p>
                  <p className="text-[12px] text-mist-400">{e.daysRemaining} days remaining</p>
                </li>
              ))}
          </ul>
        </ReadoutPanel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-700/80">{label}</dt>
      <dd className={`font-nums ${value < 0 ? "text-rust-500" : "text-ink-900"}`}>
        {formatFullRp(value)}
      </dd>
    </div>
  );
}