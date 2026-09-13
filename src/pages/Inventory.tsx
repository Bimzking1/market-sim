import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { COMMODITIES } from "../engine/commodities";
import { CITIES, ALL_CITY_IDS } from "../engine/cities";
import { formatFullRp } from "../utils/format";
import { formatDateForDay } from "../engine/calendar";
import type { CityId, CommodityId, InventoryLot } from "../types";

interface DetailLot {
  location: string;
  qty: number;
  unitPrice: number;
  cityName: string;
  dateLabel: string;
}

interface Holding {
  locKey: string;
  label: string;
  cityId: CityId;
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined;
}

type Mode = "byCity" | "all" | "custom";

type Row = {
  qty: number;
  cost: number;
  detail: DetailLot[];
};

export function Inventory() {
  const [expanded, setExpanded] = useState<CommodityId | null>(null);
  const [mode, setMode] = useState<Mode>("byCity");
  const vehicles = useGameStore((s) => s.vehicles);
  const warehouses = useGameStore((s) => s.warehouses);
  const startDate = useGameStore((s) => s.startDate);
  const currentCity = useGameStore((s) => s.currentCity);
  const [customCities, setCustomCities] = useState<CityId[]>(() =>
    [currentCity, ...new Set(warehouses.map((w) => w.cityId))].filter(
      (c, i, a) => a.indexOf(c) === i
    )
  );

  const holdings: Holding[] = [
    ...vehicles.map((v) => ({
      locKey: `v-${v.id}`,
      label: `Vehicle · ${v.name}`,
      cityId: currentCity,
      lots: v.lots,
    })),
    ...warehouses.map((wh) => ({
      locKey: `w-${wh.id}`,
      label: `Warehouse · ${CITIES[wh.cityId]?.name ?? wh.cityId}`,
      cityId: wh.cityId,
      lots: wh.lots,
    })),
  ];

  const availableCities = (
    Array.from(new Set(holdings.map((h) => h.cityId))) as CityId[]
  ).sort((a, b) => CITIES[a].name.localeCompare(CITIES[b].name));

  const aggregate = (scope: Holding[]): Map<CommodityId, Row> => {
    const map = new Map<CommodityId, Row>();
    for (const loc of scope) {
      for (const [cid, lots] of Object.entries(loc.lots ?? {}) as [
        CommodityId,
        InventoryLot[]
      ][]) {
        const qty = lots.reduce((s, l) => s + l.qty, 0);
        if (qty <= 0) continue;
        const cur = map.get(cid) ?? { qty: 0, cost: 0, detail: [] as DetailLot[] };
        for (const lot of lots) {
          if (lot.qty <= 0) continue;
          cur.qty += lot.qty;
          cur.cost += lot.qty * lot.unitPrice;
          cur.detail.push({
            location: loc.label,
            qty: lot.qty,
            unitPrice: lot.unitPrice,
            cityName: lot.cityId ? (CITIES[lot.cityId]?.name ?? lot.cityId) : "—",
            dateLabel: lot.day != null ? formatDateForDay(startDate, lot.day) : "—",
          });
        }
        map.set(cid, cur);
      }
    }
    return map;
  };

  const scopeHoldings =
    mode === "byCity"
      ? holdings
      : mode === "all"
      ? holdings
      : holdings.filter((h) => customCities.includes(h.cityId));

  const scopeRows = (() => {
    const map = aggregate(scopeHoldings);
    return [...map.entries()].sort((a, b) =>
      COMMODITIES[a[0]].name.localeCompare(COMMODITIES[b[0]].name)
    );
  })();

  const grandQty = scopeRows.reduce((s, [, v]) => s + v.qty, 0);
  const grandCost = scopeRows.reduce((s, [, v]) => s + v.cost, 0);
  const grandAvg = grandQty > 0 ? Math.round(grandCost / grandQty) : 0;

  const groupRows = useGroupByCity(holdings, startDate);
  const totalCities = groupRows.length;

  const toggleCity = (c: CityId) =>
    setCustomCities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const showCities = new Set(
    mode === "byCity" ? availableCities : customCities
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Everything you hold</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Inventory
        </h1>
      </header>

      <ReadoutPanel title="Group by" eyebrow="How to list your goods">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "byCity", label: "By city" },
              { key: "all", label: "All cities" },
              { key: "custom", label: "Selected cities" },
            ] as { key: Mode; label: string }[]
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`px-3 py-1.5 text-[13px] ${
                mode === m.key
                  ? "bg-brass-400 text-ink-900"
                  : "border border-ink-600 text-mist-300 hover:bg-ink-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === "custom" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_CITY_IDS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCity(c)}
                disabled={!availableCities.includes(c)}
                className={`px-3 py-1 text-[12px] disabled:opacity-30 ${
                  customCities.includes(c)
                    ? "bg-brass-400/20 text-brass-300"
                    : "border border-ink-600 text-mist-400"
                }`}
              >
                {CITIES[c].name}
              </button>
            ))}
          </div>
        )}
      </ReadoutPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <ReadoutPanel eyebrow="Holding locations" title={String(scopeHoldings.length)}>
          <p className="text-[12px] text-mist-400">
            {totalCities} {totalCities === 1 ? "city" : "cities"} in view
          </p>
        </ReadoutPanel>
        <ReadoutPanel eyebrow="Units in stock" title={String(grandQty)}>
          <p className="text-[12px] text-mist-400">across the current scope</p>
        </ReadoutPanel>
        <ReadoutPanel eyebrow="Total purchase value" title={formatFullRp(grandCost)}>
          <p className="text-[12px] text-mist-400">cost basis of what you hold</p>
        </ReadoutPanel>
      </div>

      {scopeRows.length === 0 && (
        <ReadoutPanel title="Nothing stored here">
          <p className="text-[14px] text-mist-400">
            Buy goods in the Market or at your warehouses to see your lots here.
          </p>
        </ReadoutPanel>
      )}

      {mode === "byCity" && scopeRows.length > 0 && (
        <div className="space-y-3">
          {groupRows.map(({ cityId, rows }) => {
            if (!showCities.has(cityId)) return null;
            const cityQty = rows.reduce((s, [, v]) => s + v.qty, 0);
            const cityCost = rows.reduce((s, [, v]) => s + v.cost, 0);
            return (
              <ReadoutPanel
                key={cityId}
                title={CITIES[cityId].name}
                eyebrow={`${rows.length} items · ${cityQty.toLocaleString("en-US")} units · ${formatFullRp(cityCost)}`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-ink-800/60 text-[12px] uppercase tracking-wider text-mist-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item</th>
                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                        <th className="px-4 py-2 text-right font-medium">Avg cost</th>
                        <th className="px-4 py-2 text-right font-medium">Total spent</th>
                        <th className="px-4 py-2 text-right font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700">
                      {rows.map(([cid, v]) => {
                        const def = COMMODITIES[cid];
                        const isOpen = expanded === cid;
                        const avg = v.qty > 0 ? Math.round(v.cost / v.qty) : 0;
                        const detail = [...v.detail].sort(
                          (a, b) =>
                            a.location.localeCompare(b.location) ||
                            b.unitPrice - a.unitPrice
                        );
                        return (
                          <RowGroup
                            key={cid}
                            def={def}
                            qty={v.qty}
                            avg={avg}
                            cost={v.cost}
                            isOpen={isOpen}
                            onToggle={() => setExpanded(isOpen ? null : cid)}
                            detail={detail}
                          />
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-ink-800/40 text-[13px] text-paper-200">
                      <tr>
                        <td className="px-4 py-2 font-medium" colSpan={3}>
                          {CITIES[cityId].name} total · {rows.length}{" "}
                          {rows.length === 1 ? "item" : "items"} · avg{" "}
                          {formatFullRp(cityQty > 0 ? Math.round(cityCost / cityQty) : 0)}
                          /unit
                        </td>
                        <td className="px-4 py-2 text-right font-nums font-medium">
                          {formatFullRp(cityCost)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </ReadoutPanel>
            );
          })}
        </div>
      )}

      {mode !== "byCity" && scopeRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink-700 bg-ink-900/40">
          <table className="w-full text-left">
            <thead className="bg-ink-800/60 text-[12px] uppercase tracking-wider text-mist-400">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 text-right font-medium">Qty</th>
                <th className="px-4 py-3 text-right font-medium">Avg cost</th>
                <th className="px-4 py-3 text-right font-medium">Total spent</th>
                <th className="px-4 py-3 text-right font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700">
              {scopeRows.map(([cid, v]) => {
                const def = COMMODITIES[cid];
                const isOpen = expanded === cid;
                const avg = v.qty > 0 ? Math.round(v.cost / v.qty) : 0;
                const detail = [...v.detail].sort(
                  (a, b) =>
                    a.cityName.localeCompare(b.cityName) || b.unitPrice - a.unitPrice
                );
                return (
                  <RowGroup
                    key={cid}
                    def={def}
                    qty={v.qty}
                    avg={avg}
                    cost={v.cost}
                    isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : cid)}
                    detail={detail}
                  />
                );
              })}
            </tbody>
            <tfoot className="bg-ink-800/40 text-[13px] text-paper-200">
              <tr>
                <td className="px-4 py-3 font-medium" colSpan={3}>
                  Total · {scopeRows.length}{" "}
                  {scopeRows.length === 1 ? "item" : "items"} · avg{" "}
                  {formatFullRp(grandAvg)}/unit
                </td>
                <td className="px-4 py-3 text-right font-nums font-medium">
                  {formatFullRp(grandCost)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function useGroupByCity(
  holdings: Holding[],
  startDate: number
): { cityId: CityId; rows: [CommodityId, Row][] }[] {
  const map = new Map<CityId, Map<CommodityId, Row>>();
  for (const loc of holdings) {
    for (const [cid, lots] of Object.entries(loc.lots ?? {}) as [
      CommodityId,
      InventoryLot[]
    ][]) {
      const empty: Row = { qty: 0, cost: 0, detail: [] as DetailLot[] };
      const cityMap = map.get(loc.cityId) ?? new Map<CommodityId, Row>();
      const cur = cityMap.get(cid) ?? { ...empty, detail: [] as DetailLot[] };
      for (const lot of lots) {
        if (lot.qty <= 0) continue;
        cur.qty += lot.qty;
        cur.cost += lot.qty * lot.unitPrice;
        cur.detail.push({
          location: loc.label,
          qty: lot.qty,
          unitPrice: lot.unitPrice,
          cityName: lot.cityId ? (CITIES[lot.cityId]?.name ?? lot.cityId) : "—",
          dateLabel: lot.day != null ? formatDateForDay(startDate, lot.day) : "—",
        });
      }
      cityMap.set(cid, cur);
      map.set(loc.cityId, cityMap);
    }
  }
  return [...map.entries()]
    .sort((a, b) => (CITIES[a[0]]?.name ?? "").localeCompare(CITIES[b[0]]?.name ?? ""))
    .map(([cityId, m]) => ({
      cityId,
      rows: [...m.entries()].sort((a, b) =>
        COMMODITIES[a[0]].name.localeCompare(COMMODITIES[b[0]].name)
      ),
    }));
}

function RowGroup({
  def,
  qty,
  avg,
  cost,
  isOpen,
  onToggle,
  detail,
}: {
  def: (typeof COMMODITIES)[CommodityId];
  qty: number;
  avg: number;
  cost: number;
  isOpen: boolean;
  onToggle: () => void;
  detail: DetailLot[];
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer bg-ink-900/40 transition-colors hover:bg-ink-800/50 ${
          isOpen ? "bg-ink-800/40" : ""
        }`}
      >
        <td className="px-4 py-3">
          <p className="text-[14px] text-paper-100">
            {def.emoji} {def.name}
          </p>
          <p className="text-[12px] text-mist-400">{def.unit}</p>
        </td>
        <td className="px-4 py-3 text-right font-nums text-[14px] text-paper-100">
          {qty}
        </td>
        <td className="px-4 py-3 text-right font-nums text-[14px] text-paper-100">
          {formatFullRp(avg)}/unit
        </td>
        <td className="px-4 py-3 text-right font-nums text-[14px] text-mist-300">
          {formatFullRp(cost)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-ink-600 px-2 py-1 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {isOpen ? "Hide" : "Show"}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-ink-900/20">
          <td colSpan={5} className="px-4 pb-4 pt-1">
            <div className="overflow-x-auto rounded-lg border border-ink-700">
              <table className="w-full text-left">
                <thead className="text-[12px] uppercase tracking-wider text-mist-400">
                  <tr className="border-b border-ink-700">
                    <th className="px-4 py-2 font-medium">Location</th>
                    <th className="px-4 py-2 text-right font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Bought at</th>
                    <th className="px-4 py-2 text-right font-medium">City</th>
                    <th className="px-4 py-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/70">
                  {detail.map((lot, i) => (
                    <tr key={i} className="text-[13px]">
                      <td className="px-4 py-2 text-paper-100">{lot.location}</td>
                      <td className="px-4 py-2 text-right font-nums text-paper-100">
                        {lot.qty} {def.unit}
                      </td>
                      <td className="px-4 py-2 text-right font-nums text-mist-300">
                        {formatFullRp(lot.unitPrice)}/unit
                      </td>
                      <td className="px-4 py-2 text-right text-mist-300">
                        {lot.cityName}
                      </td>
                      <td className="px-4 py-2 text-right text-mist-300">
                        {lot.dateLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-ink-700 text-[13px] text-paper-200">
                  <tr>
                    <td className="px-4 py-2">
                      Average · {formatFullRp(Math.round(cost / qty))}/unit
                    </td>
                    <td className="px-4 py-2 text-right font-nums">{qty}</td>
                    <td className="px-4 py-2 text-right font-nums">
                      {formatFullRp(cost)}
                    </td>
                    <td />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Array.from(new Set(detail.map((d) => d.location))).map((loc) => (
                <span
                  key={loc}
                  className="rounded-full border border-ink-600 px-2 py-0.5 text-[11px] text-mist-400"
                >
                  {loc}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}