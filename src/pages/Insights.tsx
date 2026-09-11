import { TrendingUp, TrendingDown, Minus, UserPlus, Newspaper } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import { ALL_STAFF_IDS, STAFF, staffContractCost } from "../engine/staff";
import { predictPriceDirections } from "../engine/market";
import { COMMODITIES, ALL_COMMODITY_IDS } from "../engine/commodities";
import { ALL_CITY_IDS, CITIES } from "../engine/cities";
import { activeScheduledForDay, leakedUpcomingForDay, daysUntilStart } from "../engine/schedule";
import { formatDateForDay, formatMonthYear } from "../engine/calendar";
import { formatFullRp } from "../utils/format";
import { mulberry32 } from "../engine/rng";
import type { CommodityId, PriceForecast, ScheduledEvent } from "../types";

function describeScheduled(e: ScheduledEvent, startDate: number): string {
  const comm = COMMODITIES[e.commodityId].name;
  const city = CITIES[e.cityId].name;
  const when = formatMonthYear(new Date(e.startDateISO));
  if (e.kind === "banned") {
    return `${comm} is banned — no stock at all in ${when} at ${city}`;
  }
  if (e.kind === "surge") {
    return `${comm} is high in ${when} at ${city}`;
  }
  return `${comm} is low in ${when} at ${city}`;
}

export function Insights() {
  const currentDay = useGameStore((s) => s.currentDay);
  const startDate = useGameStore((s) => s.startDate);
  const scheduledEvents = useGameStore((s) => s.scheduledEvents);
  const currentCity = useGameStore((s) => s.currentCity);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const seed = useGameStore((s) => s.seed);
  const playerCash = useGameStore((s) => s.playerCash);
  const staffHires = useGameStore((s) => s.staffHires);
  const activeEvents = useGameStore((s) => s.activeEvents);
  const actions = useGameStore((s) => s.actions);

  const analystsHired = (staffHires["analyst"] ?? 0) > 0;
  const cargoManagerHired = (staffHires["cargoManager"] ?? 0) > 0;
  const brokerHired = (staffHires["broker"] ?? 0) > 0;

  const [paidNews, setPaidNews] = useState<
    { title: string; body: string; joke?: boolean }[]
  >([]);

  const forecasts = predictPriceDirections(
    cityMarkets,
    currentCity,
    currentDay,
    seed,
    mulberry32
  );

  const cityName = currentCity.charAt(0).toUpperCase() + currentCity.slice(1);

  const ranked = ALL_COMMODITY_IDS.map((cid) => ({
    cid,
    def: COMMODITIES[cid],
    forecast: forecasts[cid],
  })).sort((a, b) => Math.abs(b.forecast.pct) - Math.abs(a.forecast.pct));

  const riser = ranked.find((r) => r.forecast.pct > 0) ?? null;
  const faller = [...ranked].reverse().find((r) => r.forecast.pct < 0) ?? null;

  const upcomingScheduled = leakedUpcomingForDay(scheduledEvents, currentDay);
  const activeScheduled = activeScheduledForDay(scheduledEvents, currentDay);
  const todayDate = formatDateForDay(startDate, currentDay);

  const JOKES = [
    "Market so quiet, even the pigeons haven't flown here.",
    "Hot tip: buy low, sell high. You're welcome.",
    "Analyst claims cargo space is 'bigger than it looks'. Van drivers disagree.",
    "Local moneylender now accepting firstborns as collateral at a 4% rate.",
    "Witness reports a truck doing 120 km/h 'with the cargo smiley stickers'.",
    "Warehouse guard arrested for charging tours. Details at 11.",
    "Rumour: Bandung truckers union starts a secret noodle exchange.",
    "Economists baffled by why people pay tolls. 'The shortcut is free', they whisper.",
    "Roadside thieves union complaints: 'No one buys the usual spice mix anymore'.",
    "Weatherman predicts rain. Market forecasters predict they'll blame the rain.",
  ];

  const handleBuyNews = async () => {
    if (!riser && !faller) return;
    const ok = await confirmAction({
      title: "Buy the premium wire?",
      description: "One extra exclusive market story, straight to this desk.",
      lines: [{ label: "Price per story", value: formatFullRp(1_000) }],
      currentCash: playerCash,
      cashChange: -1_000,
      confirmLabel: "Buy story",
    });
    if (!ok) return;

    const bought = actions.buyNews();
    if (!bought) return;

    const joke = paidNews.length >= 8;
    let title: string;
    let body: string;
    if (joke) {
      const idx = paidNews.length - 8;
      const line = JOKES[idx % JOKES.length];
      title = line.split(".")[0] + ".";
      body = line;
    } else if (riser && faller && Math.abs(riser.forecast.pct) >= Math.abs(faller.forecast.pct)) {
      title = `${riser.def.name} soars in ${cityName}`;
      body = `Sources whisper demand is high and supply is thin — prices could climb ~${(riser.forecast.pct * 100).toFixed(1)}% in the coming days.`;
    } else if (faller) {
      title = `${faller.def.name} losing steam`;
      body = `Traders say overstock is pushing prices down — expect ~${(faller.forecast.pct * 100).toFixed(1)}% softer prices if you hold.`;
    } else {
      title = `${cityName} markets flat`;
      body = "No meaningful move expected in the next few days. Steady as she goes.";
    }

    setPaidNews((prev) => [...prev, { title, body, joke }]);
    toast({ title: joke ? "Wire clerk is out of news" : "Premium wire delivered", tone: "good" });
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-mist-400">
          Intelligence desk · {todayDate} · day {currentDay}
        </p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Insights
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReadoutPanel
          eyebrow="Free · updated daily"
          title={`${cityName} Daily Herald`}
        >
          <div className="space-y-4">
            {activeEvents.length > 0 ? (
              activeEvents.map((e) => (
                <div key={e.id} className="border-l-2 border-brass-400/60 pl-3">
                  <p className="text-[14px] text-paper-100">{e.name}</p>
                  <p className="text-[13px] text-mist-400">{e.description}</p>
                  <p className="text-[12px] text-mist-400">
                    {e.daysRemaining} days remaining
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[14px] text-mist-400">
                No major stories today. Markets are quiet.
              </p>
            )}
            <div className="space-y-1 border-t border-ink-600 pt-3 text-[13px]">
              {riser && (
                <p className="text-mist-300">
                  Trending up: <span className="text-jade-300">{riser.def.emoji} {riser.def.name}</span>{" "}
                  <span className="text-mist-400">(+{(riser.forecast.pct * 100).toFixed(1)}% expected)</span>
                </p>
              )}
              {faller && (
                <p className="text-mist-300">
                  Trending down: <span className="text-rust-300">{faller.def.emoji} {faller.def.name}</span>{" "}
                  <span className="text-mist-400">({(faller.forecast.pct * 100).toFixed(1)}% expected)</span>
                </p>
              )}
            </div>
          </div>
        </ReadoutPanel>

        <ReadoutPanel eyebrow="Staff" title="Hire professionals">
          <div className="space-y-3">
            {ALL_STAFF_IDS.map((staffId) => {
              const def = STAFF[staffId];
              const days = staffHires[staffId] ?? 0;
              const cost = staffContractCost(def);
              const alreadyHired = days > 0;
              const canAfford = playerCash >= cost;
              return (
                <div key={staffId} className="border border-ink-600 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[15px] text-paper-100">
                        {def.name}
                      </p>
                      <p className="text-[12px] text-mist-400">{def.role}</p>
                    </div>
                    {alreadyHired ? (
                      <span className="font-nums text-[12px] text-jade-300">
                        {days}d left
                      </span>
                    ) : (
                      <span className="font-nums text-[13px] text-brass-300">
                        {formatFullRp(cost)}/30d
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] text-mist-300">
                    {def.description}
                  </p>
                  <button
                    type="button"
                    disabled={alreadyHired || !canAfford}
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: `Hire ${def.name}?`,
                        description: def.description,
                        lines: [
                          { label: "Contract", value: "30 days" },
                          { label: "Daily rate", value: formatFullRp(def.dailyRate) },
                          { label: "Total upfront", value: formatFullRp(cost) },
                        ],
                        currentCash: playerCash,
                        cashChange: -cost,
                        confirmLabel: "Hire now",
                      });
                      if (ok) actions.hireStaff(staffId);
                    }}
                    className="mt-3 flex items-center gap-2 border border-ink-600 px-3 py-1.5 text-[12px] text-brass-300 hover:border-brass-400 hover:bg-brass-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserPlus size={14} strokeWidth={1.75} />
                    {alreadyHired
                      ? "On contract"
                      : `Hire · ${formatFullRp(def.dailyRate)}/day`}
                  </button>
                </div>
              );
            })}
          </div>
        </ReadoutPanel>
      </div>

      <ReadoutPanel eyebrow="Forecast desk" title="Calendar & rare conditions">
        {activeScheduled.length === 0 && upcomingScheduled.length === 0 ? (
          <p className="text-[14px] text-mist-400">
            Nothing on the calendar right now — markets will drift on their own.
          </p>
        ) : (
          <div className="space-y-4">
            {activeScheduled.map((e) => (
              <div
                key={e.id}
                className={`border-l-2 pl-3 ${
                  e.kind === "banned" ? "border-rust-400/80" : "border-jade-400/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-paper-100">
                    {COMMODITIES[e.commodityId].emoji} {describeScheduled(e, startDate)}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] uppercase tracking-wide ${
                      e.kind === "banned" ? "text-rust-300" : "text-jade-300"
                    }`}
                  >
                    Active now
                  </span>
                </div>
                <p className="text-[12px] text-mist-400">
                  Until {formatDateForDay(startDate, e.endDay)} — {e.kind === "banned" ? "buyers pay a fortune; sellers hold the market" : e.kind === "surge" ? "prices are climbing" : "prices are soft"}
                </p>
              </div>
            ))}

            {upcomingScheduled.length > 0 && (
              <div className="border-t border-ink-600 pt-4">
                <p className="mb-3 text-[12px] text-mist-400">
                  Leaked reports — the desk only catches these within ~30 days of
                  the occasion.
                </p>
                <ul className="space-y-3">
                  {upcomingScheduled.map((e) => {
                    const days = daysUntilStart(e, currentDay);
                    const lead = e.leadDays;
                    return (
                      <li
                        key={e.id}
                        className={`border-l-2 pl-3 ${
                          e.kind === "banned" ? "border-rust-400/80" : "border-brass-400/70"
                        }`}
                      >
                        <p className="text-[14px] text-paper-100">
                          {COMMODITIES[e.commodityId].emoji} {describeScheduled(e, startDate)}
                        </p>
                        <p className="text-[12px] text-mist-400">
                          {days === 0
                            ? "Breaks today"
                            : `Starts ${formatDateForDay(startDate, e.startDay)} — ${days} day(s) to prepare`}
                          {lead < 30 && (
                            <span className="text-mist-500"> · intel surfaced {lead} days out</span>
                          )}
                          {e.kind === "banned" && (
                            <span className="text-rust-300">
                              {" "}
                              · stock a warehouse in {CITIES[e.cityId].name} to profit
                            </span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </ReadoutPanel>

      <ReadoutPanel eyebrow="Premium wire" title="Paid desk reports">
        <p className="mb-3 text-[13px] text-mist-400">
          Rp 1.000 per story. Reputable. Mostly. Daily paper employees read it.
        </p>
        {paidNews.length > 0 && (
          <div className="mb-4 space-y-3">
            {paidNews.map((n, i) => (
              <div key={i} className="border-l-2 border-ink-500 pl-3">
                <p className="text-[14px] text-paper-100">
                  {n.joke && <span className="mr-1.5 text-[12px] text-brass-400">Spoof</span>}
                  {n.title}
                </p>
                <p className="text-[13px] text-mist-400">{n.body}</p>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={!riser && !faller}
          onClick={handleBuyNews}
          className="flex items-center gap-2 border border-ink-600 px-3 py-1.5 text-[12px] text-brass-300 hover:border-brass-400 hover:bg-brass-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Newspaper size={14} strokeWidth={1.75} />
          Buy one story · Rp 1.000
        </button>
      </ReadoutPanel>

      {analystsHired && (
        <ReadoutPanel eyebrow="Market Analyst report" title="Price forecast">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ink-600 text-left text-[12px] text-mist-400">
                  <th className="py-2 pr-4 font-normal">Good</th>
                  <th className="py-2 pr-4 font-normal text-right">Now</th>
                  <th className="py-2 pr-4 font-normal text-right">In 3 days</th>
                  <th className="py-2 pr-4 font-normal">Expected move</th>
                  <th className="py-2 font-normal">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {ranked.map((r) => (
                  <ForecastRow
                    key={r.cid}
                    def={r.def}
                    forecast={r.forecast}
                    price={
                      cityMarkets[currentCity].prices[r.cid] ?? r.def.basePrice
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </ReadoutPanel>
      )}

      {cargoManagerHired && (
        <ReadoutPanel eyebrow="Govt. Cargo Manager report" title="Buy & sell cities">
          <ul className="divide-y divide-ink-700">
            {ALL_COMMODITY_IDS.map((cid) => {
              const def = COMMODITIES[cid];
              let bestCity: CityId | null = null;
              let bestPrice = -1;
              let cheapestCity: CityId | null = null;
              let cheapestPrice = Infinity;
              for (const cityId of ALL_CITY_IDS) {
                const price =
                  cityMarkets[cityId].prices[cid] ?? def.basePrice;
                if (cityId !== currentCity) {
                  if (price > bestPrice) {
                    bestPrice = price;
                    bestCity = cityId;
                  }
                  if (price < cheapestPrice) {
                    cheapestPrice = price;
                    cheapestCity = cityId;
                  }
                }
              }
              return (
                <li
                  key={cid}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span className="min-w-[160px] text-[14px] text-paper-100">
                    {def.emoji} {def.name}
                  </span>
                  <span className="text-[13px] text-mist-300">
                    Buy <span className="text-jade-300">{cheapestCity ? CITIES[cheapestCity].name : "—"} {formatFullRp(cheapestPrice)}</span>
                  </span>
                  <span className="text-[13px] text-mist-300">
                    Sell <span className="text-brass-300">{bestCity ? CITIES[bestCity].name : "—"} {formatFullRp(bestPrice)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ReadoutPanel>
      )}

      {brokerHired && (
        <ReadoutPanel eyebrow="Trade Insider tip sheet" title="Hot goods">
          <ul className="divide-y divide-ink-700">
            {ranked.slice(0, 5).map((r) => (
              <li
                key={r.cid}
                className="flex items-center justify-between py-3 text-[13px]"
              >
                <span className="text-paper-100">
                  {r.def.emoji} {r.def.name}
                </span>
                <span
                  className={`font-nums ${
                    r.forecast.direction === "up"
                      ? "text-jade-300"
                      : r.forecast.direction === "down"
                      ? "text-rust-300"
                      : "text-mist-300"
                  }`}
                >
                  {(r.forecast.pct * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </ReadoutPanel>
      )}

      {!analystsHired && !cargoManagerHired && !brokerHired && (
        <p className="text-[13px] text-mist-400">
          Hire a professional above to unlock forecasts, city pricing, and trading
          tips.
        </p>
      )}
    </div>
  );
}

function ForecastRow({
  def,
  forecast,
  price,
}: {
  def: (typeof COMMODITIES)[CommodityId];
  forecast: PriceForecast;
  price: number;
}) {
  return (
    <tr>
      <td className="py-2 pr-4 text-paper-100">
        {def.emoji} {def.name}
      </td>
      <td className="py-2 pr-4 text-right font-nums text-mist-300">
        {formatFullRp(price)}
      </td>
      <td className="py-2 pr-4 text-right font-nums text-paper-200">
        {formatFullRp(forecast.predictedPrice)}
      </td>
      <td className="py-2 pr-4">
        <span
          className={`inline-flex items-center gap-1 ${
            forecast.direction === "up"
              ? "text-jade-300"
              : forecast.direction === "down"
              ? "text-rust-300"
              : "text-mist-300"
          }`}
        >
          {forecast.direction === "up" ? (
            <TrendingUp size={14} strokeWidth={1.75} />
          ) : forecast.direction === "down" ? (
            <TrendingDown size={14} strokeWidth={1.75} />
          ) : (
            <Minus size={14} strokeWidth={1.75} />
          )}
          {(forecast.pct * 100).toFixed(1)}%
        </span>
      </td>
      <td className="py-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-ink-700">
            <div
              className={`h-full ${
                forecast.direction === "up"
                  ? "bg-jade-400"
                  : forecast.direction === "down"
                  ? "bg-rust-400"
                  : "bg-mist-400"
              }`}
              style={{ width: `${forecast.confidence}%` }}
            />
          </div>
          <span className="font-nums text-[12px] text-mist-400">
            {forecast.confidence}%
          </span>
        </div>
      </td>
    </tr>
  );
}