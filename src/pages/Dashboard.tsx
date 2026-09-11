import { Link } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { LedgerList } from "../components/LedgerList";
import { Meter } from "../components/Meter";
import { Sparkline } from "../components/Sparkline";
import { formatFullRp, formatSignedRp } from "../utils/format";
import { COMMODITIES } from "../engine/commodities";
import { VEHICLES as VEHICLES_MAP } from "../engine/vehicles";
import { formatDateForDay } from "../engine/calendar";
import { activeScheduledForDay } from "../engine/schedule";
import type { CommodityId } from "../types";

export function Dashboard() {
  const currentDay = useGameStore((s) => s.currentDay);
  const startDate = useGameStore((s) => s.startDate);
  const scheduledEvents = useGameStore((s) => s.scheduledEvents);
  const playerCash = useGameStore((s) => s.playerCash);
  const playerNetWorth = useGameStore((s) => s.playerNetWorth);
  const currentCity = useGameStore((s) => s.currentCity);
  const inventory = useGameStore((s) => s.inventory);
  const warehouses = useGameStore((s) => s.warehouses);
  const vehicles = useGameStore((s) => s.vehicles);
  const loans = useGameStore((s) => s.loans);
  const activeEvents = useGameStore((s) => s.activeEvents);
  const objectives = useGameStore((s) => s.objectives);
  const ledger = useGameStore((s) => s.todaysLedger);
  const cityMarkets = useGameStore((s) => s.cityMarkets);

  const netToday = ledger.reduce((sum, l) => sum + l.amount, 0);

  const dueSoonLoan = loans.find(
    (l) => l.status === "due_soon" || l.status === "overdue"
  );

  let inventoryValue = 0;
  const market = cityMarkets[currentCity];
  for (const [cid, qty] of Object.entries(inventory) as [CommodityId, number][]) {
    const price = market.prices[cid] ?? COMMODITIES[cid].basePrice;
    inventoryValue += qty * price;
  }

  let assetValue = 0;
  for (const v of vehicles) {
    const def = VEHICLES_MAP[v.typeId];
    assetValue += Math.round(def.price * (v.condition / 100));
  }
  for (const _wh of warehouses) {
    assetValue += 10_000_000 * (1 + 0.25 * _wh.level);
  }

  let totalDebt = 0;
  for (const loan of loans) {
    if (loan.status !== "paid") totalDebt += loan.remaining;
  }

  const citySignals = getCitySignals(cityMarkets[currentCity]);

  const cityName = currentCity.charAt(0).toUpperCase() + currentCity.slice(1);
  const todayLabel = formatDateForDay(startDate, currentDay);
  const scheduledActive = activeScheduledForDay(scheduledEvents, currentDay);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 border-b border-ink-700 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-mist-400">
            Net worth, {todayLabel} · day {currentDay}
          </p>
          <p className="font-nums font-display text-4xl font-semibold text-paper-100 sm:text-5xl md:text-6xl">
            {formatFullRp(playerNetWorth)}
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
            Bank payment of {formatFullRp(dueSoonLoan.remaining)} is due{" "}
            {formatDateForDay(startDate, dueSoonLoan.dueDay)} (day{" "}
            {dueSoonLoan.dueDay}).{" "}
            <Link to="/bank" className="underline underline-offset-2">
              Review at the bank
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <PaperPanel
          eyebrow="Statement"
          title="What you hold"
          className="lg:col-span-1"
        >
          <dl className="space-y-2.5 text-[14px]">
            <Row label="Cash" value={playerCash} />
            <Row label="Inventory" value={inventoryValue} />
            <Row label="Assets" value={assetValue} />
            <Row label="Debt" value={-totalDebt} />
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-ink-600 pt-3">
            <dt className="font-display text-[15px]">Net worth</dt>
            <dd className="font-nums font-display text-[17px] text-brass-300">
              {formatFullRp(playerNetWorth)}
            </dd>
          </div>
        </PaperPanel>

        <ReadoutPanel
          eyebrow="Today"
          title="Cash movement"
          className="lg:col-span-1"
        >
          {ledger.length > 0 ? (
            <LedgerList lines={ledger} totalLabel="Net today" />
          ) : (
            <p className="text-[14px] text-mist-400">
              No activity today. Advance time or make a trade.
            </p>
          )}
        </ReadoutPanel>

        <ReadoutPanel
          eyebrow="Standing goals"
          title="Objectives"
          className="lg:col-span-1"
        >
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
        <ReadoutPanel
          eyebrow={cityName}
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
            {citySignals.map((s) => (
              <li
                key={s.cid}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[14px] text-paper-100">{s.name}</p>
                  <p className="truncate text-[12px] text-mist-400">
                    {formatFullRp(s.price)} / {s.unit}
                  </p>
                </div>
                <Sparkline
                  history={s.history}
                  positive={s.changePct >= 0}
                  width={90}
                  height={30}
                />
              </li>
            ))}
          </ul>
        </ReadoutPanel>

        <ReadoutPanel eyebrow="Wider region" title="Active events">
          {activeEvents.length === 0 && scheduledActive.length === 0 ? (
            <p className="text-[14px] text-mist-400">
              No active market events right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeEvents.map((e) => (
                <li key={e.id} className="border-l-2 border-brass-400/60 pl-3">
                  <p className="text-[14px] text-paper-100">{e.name}</p>
                  <p className="text-[13px] text-mist-400">
                    {e.description}
                  </p>
                  <p className="text-[12px] text-mist-400">
                    {e.daysRemaining} days remaining
                  </p>
                </li>
              ))}
              {scheduledActive.map((e) => (
                <li
                  key={e.id}
                  className={`border-l-2 pl-3 ${
                    e.kind === "banned"
                      ? "border-rust-400/70"
                      : "border-brass-400/70"
                  }`}
                >
                  <p className="text-[14px] text-paper-100">
                    {e.kind === "banned" ? "No stock · " : ""}
                    {e.name}
                  </p>
                  <p className="text-[13px] text-mist-400">
                    {e.kind === "banned" ? "Supply shut down" : "Calendar condition"} until{" "}
                    {formatDateForDay(startDate, e.endDay)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ReadoutPanel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-mist-400">{label}</dt>
      <dd
        className={`font-nums ${value < 0 ? "text-rust-400" : "text-paper-100"}`}
      >
        {formatFullRp(value)}
      </dd>
    </div>
  );
}

function getCitySignals(market: any) {
  const signals: {
    cid: string;
    name: string;
    price: number;
    unit: string;
    history: number[];
    changePct: number;
  }[] = [];

  for (const cid of Object.keys(market.prices) as CommodityId[]) {
    const def = COMMODITIES[cid];
    const price = market.prices[cid];
    const history = market.priceHistory[cid] ?? [];
    const prev = history.length >= 2 ? history[history.length - 2] : price;
    const changePct = prev > 0 ? (price - prev) / prev : 0;

    signals.push({
      cid,
      name: `${def.emoji} ${def.name}`,
      price,
      unit: def.unit,
      history,
      changePct,
    });
  }

  return signals
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5);
}
