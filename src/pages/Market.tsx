import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { DualMeter } from "../components/Meter";
import { Delta } from "../components/Badge";
import { Dropdown, type DropdownOption } from "../components/Dropdown";
import { confirmAction } from "../components/ConfirmDialog";
import { COMMODITIES } from "../engine/commodities";
import {
  availableCommoditiesForCity,
  citySellsCommodity,
  CITIES,
} from "../engine/cities";
import { delegationFee, warehouseSlotParts } from "../engine/warehouses";
import { VEHICLES } from "../engine/vehicles";
import { formatFullRp } from "../utils/format";
import type { CommodityId, CommodityMarket } from "../types";

type ContainerKey = string;

function keyOf(type: "vehicle" | "warehouse", id: string): ContainerKey {
  return `${type}:${id}`;
}

function parseKey(k: ContainerKey): { type: "vehicle" | "warehouse"; id: string } {
  const i = k.indexOf(":");
  return { type: k.slice(0, i) as "vehicle" | "warehouse", id: k.slice(i + 1) };
}

export function Market() {
  const [selectedId, setSelectedId] = useState<CommodityId | null>("coffee");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("100");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "trend" | "supply" | "demand" | "owned"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const currentCity = useGameStore((s) => s.currentCity);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const playerCash = useGameStore((s) => s.playerCash);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const vehicles = useGameStore((s) => s.vehicles);
  const warehouses = useGameStore((s) => s.warehouses);
  const actions = useGameStore((s) => s.actions);

  const market = cityMarkets[currentCity];
  const cityName = CITIES[currentCity]?.name ?? currentCity;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const [destKey, setDestKey] = useState<ContainerKey>(() => {
    const id = selectedVehicleId ?? vehicles[0]?.id ?? "";
    return id ? keyOf("vehicle", id) : "";
  });

  const buyOptions: DropdownOption[] = useMemo(
    () => [
      ...vehicles.map((v) => {
        const def = VEHICLES[v.typeId];
        const used = Object.values(v.inventory ?? {}).reduce((s, x) => s + x, 0);
        return {
          value: keyOf("vehicle", v.id),
          label: v.name,
          sublabel: def.name,
          meta: `${used} / ${def.capacity} units`,
          group: "Vehicles",
        };
      }),
      ...warehouses
        .filter((w) => w.cityId === currentCity)
        .map((w) => {
          const parts = warehouseSlotParts(w, warehouses.findIndex((x) => x.id === w.id) + 1);
          return {
            value: keyOf("warehouse", w.id),
            label: parts.label,
            sublabel: parts.sublabel,
            meta: `${parts.used} / ${w.capacity} units`,
            group: "Warehouses (this city)",
          };
        }),
    ],
    [vehicles, warehouses, currentCity]
  );

  const sellOptions: DropdownOption[] = useMemo(
    () => [
      ...vehicles.map((v) => {
        const def = VEHICLES[v.typeId];
        const used = Object.values(v.inventory ?? {}).reduce((s, x) => s + x, 0);
        return {
          value: keyOf("vehicle", v.id),
          label: v.name,
          sublabel: def.name,
          meta: `${used} / ${def.capacity} units`,
          group: "Vehicles",
        };
      }),
      ...warehouses
        .filter((w) => w.cityId === currentCity)
        .map((w) => {
          const parts = warehouseSlotParts(w, warehouses.findIndex((x) => x.id === w.id) + 1);
          return {
            value: keyOf("warehouse", w.id),
            label: parts.label,
            sublabel: parts.sublabel,
            meta: `${parts.used} / ${w.capacity} units`,
            group: "Warehouses (this city)",
          };
        }),
    ],
    [vehicles, warehouses, currentCity]
  );

  const destOptions = mode === "buy" ? buyOptions : sellOptions;

  useEffect(() => {
    const stillValid = destOptions.some((o) => o.value === destKey);
    if (!stillValid) {
      const fallback =
        vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];
      setDestKey(fallback ? keyOf("vehicle", fallback.id) : "");
    }
  }, [destOptions, destKey, vehicles, selectedVehicleId]);

  const available = useMemo(
    () => availableCommoditiesForCity(currentCity),
    [currentCity]
  );

  const currentCityWhInventory = useMemo(() => {
    const total = new Map<CommodityId, number>();
    for (const wh of warehouses) {
      if (wh.cityId !== currentCity) continue;
      for (const [cid, qty] of Object.entries(wh.inventory) as [CommodityId, number][]) {
        total.set(cid, (total.get(cid) ?? 0) + qty);
      }
    }
    return total;
  }, [warehouses, currentCity]);

  const commodities: CommodityMarket[] = available.map((cid) => {
    const def = COMMODITIES[cid];
    const price = market.prices[cid] ?? def.basePrice;
    const supply = market.supply[cid] ?? 100;
    const demand = market.demand[cid] ?? 100;
    const history = market.priceHistory[cid] ?? [price];
    const prev = history.length >= 2 ? history[history.length - 2] : price;
    const changePct = prev > 0 ? (price - prev) / prev : 0;

    const playerOwns =
      (selectedVehicle?.inventory?.[cid] ?? 0) + (currentCityWhInventory.get(cid) ?? 0);

    return {
      commodityId: cid,
      name: `${def.emoji} ${def.name}`,
      unit: def.unit,
      price,
      supply,
      demand,
      history,
      changePct,
      playerOwns,
      perishable: def.perishable,
    };
  });

  const query = search.trim().toLowerCase();
  const filtered = query
    ? commodities.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (COMMODITIES[c.commodityId].category as string).includes(query)
      )
    : commodities;
  const visible = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "price") return (a.price - b.price) * dir;
    if (sortBy === "trend") return (a.changePct - b.changePct) * dir;
    if (sortBy === "supply") return (a.supply - b.supply) * dir;
    if (sortBy === "demand") return (a.demand - b.demand) * dir;
    if (sortBy === "owned") {
      const aOwned = a.playerOwns > 0 ? 1 : 0;
      const bOwned = b.playerOwns > 0 ? 1 : 0;
      if (aOwned !== bOwned) return (bOwned - aOwned) * dir;
      return a.name.localeCompare(b.name) * dir;
    }
    return a.name.localeCompare(b.name) * dir;
  });

  const selected = commodities.find((c) => c.commodityId === selectedId) ?? null;

  const heldElsewhere = (() => {
    const totals = new Map<CommodityId, number>();
    for (const v of vehicles) {
      for (const [cid, qty] of Object.entries(v.inventory ?? {})) {
        if (!citySellsCommodity(currentCity, cid as CommodityId)) {
          totals.set(cid as CommodityId, (totals.get(cid as CommodityId) ?? 0) + qty);
        }
      }
    }
    for (const wh of warehouses) {
      for (const [cid, qty] of Object.entries(wh.inventory)) {
        if (!citySellsCommodity(currentCity, cid as CommodityId)) {
          totals.set(cid as CommodityId, (totals.get(cid as CommodityId) ?? 0) + qty);
        }
      }
    }
    return Array.from(totals.entries());
  })();

  const dest = parseKey(destKey || "vehicle:");
  const destWh =
    dest.type === "warehouse" ? warehouses.find((w) => w.id === dest.id) : undefined;
  const sellRemote = mode === "sell" && !!destWh && destWh.cityId !== currentCity;
  const destCapacity = (() => {
    if (dest.type === "vehicle") {
      const v = vehicles.find((x) => x.id === dest.id);
      if (!v) return { used: 0, capacity: 0 };
      const def = VEHICLES[v.typeId];
      return {
        used: Object.values(v.inventory ?? {}).reduce((s, x) => s + x, 0),
        capacity: def.capacity,
      };
    }
    if (destWh) {
      return {
        used: Object.values(destWh.inventory).reduce((s, x) => s + x, 0),
        capacity: destWh.capacity,
      };
    }
    return { used: 0, capacity: 0 };
  })();
  const sourceOwned = (() => {
    if (!selected) return 0;
    if (dest.type === "vehicle") {
      return vehicles.find((x) => x.id === dest.id)?.inventory?.[selected.commodityId] ?? 0;
    }
    return destWh?.inventory[selected.commodityId] ?? 0;
  })();

  const effectivePrice = (() => {
    if (!selected) return 0;
    if (sellRemote && destWh) {
      return (
        cityMarkets[destWh.cityId].prices[selected.commodityId] ??
        COMMODITIES[selected.commodityId].basePrice
      );
    }
    return market.prices[selected.commodityId] ?? COMMODITIES[selected.commodityId].basePrice;
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-mist-400">
            {cityName} market
          </p>
          <h1 className="font-display text-3xl font-medium text-paper-100">
            Market
          </h1>
        </div>
        <Link
          to="/market-remote"
          className="border border-ink-600 px-3 py-2 text-[13px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
        >
          Scout other cities →
        </Link>
      </header>

      {heldElsewhere.length > 0 && (
        <ReadoutPanel title="Held goods not traded here">
          <p className="mb-2 text-[13px] text-mist-400">
            These goods aren't sold in {cityName}, so you can't offload them
            here. Visit the market that trades them (check the Almanac) or work
            through a warehouse agent in another city.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {heldElsewhere.map(([cid, qty]) => {
              const def = COMMODITIES[cid as CommodityId];
              return (
                <span
                  key={cid}
                  className="px-2 py-0.5 text-[12px] text-rust-300 bg-rust-400/10"
                >
                  {def.emoji} {def.name} · {qty} held
                </span>
              );
            })}
          </div>
        </ReadoutPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ReadoutPanel bodyClassName="p-0">
          <div className="border-b border-ink-700 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[170px] flex-1">
                <Search
                  size={15}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search goods or category…"
                  className="w-full border border-ink-600 bg-ink-900 py-2 pl-9 pr-3 text-[13px] text-paper-100 placeholder:text-mist-400 focus:border-brass-400 focus:outline-none"
                />
              </div>
              <div className="w-[130px]">
                <Dropdown
                  value={sortBy}
                  onChange={(v) =>
                    setSortBy(v as "name" | "price" | "trend" | "supply" | "demand" | "owned")
                  }
                  options={[
                    { value: "name", label: "Name" },
                    { value: "price", label: "Price" },
                    { value: "trend", label: "Trend" },
                    { value: "supply", label: "Supply" },
                    { value: "demand", label: "Demand" },
                    { value: "owned", label: "Owned" },
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                className="border border-ink-600 bg-ink-900 px-2 py-2 text-[13px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
              >
                {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
          </div>
          <ul className="divide-y divide-ink-700">
            {visible.length === 0 ? (
              <li className="px-5 py-6 text-center text-[13px] text-mist-400">
                No goods match “{search}”.
              </li>
            ) : (
              visible.map((c) => (
                <CommodityRow
                  key={c.commodityId}
                  commodity={c}
                  selected={c.commodityId === selectedId}
                  onSelect={() => {
                    setSelectedId(c.commodityId);
                    setQuantity(
                      String(c.playerOwns > 0 ? Math.min(c.playerOwns, 100) : 100)
                    );
                  }}
                />
              ))
            )}
          </ul>
        </ReadoutPanel>

        <div className="lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <TradeTicket
              commodity={selected}
              mode={mode}
              setMode={setMode}
              quantity={quantity}
              setQuantity={setQuantity}
              playerCash={playerCash}
              destKey={destKey}
              setDestKey={setDestKey}
              destOptions={destOptions}
              destLabel={destOptions.find((o) => o.value === destKey)?.label}
              destCapacity={destCapacity}
              sourceOwned={sourceOwned}
              effectivePrice={effectivePrice}
              sellRemote={sellRemote}
              onConfirm={async (q) => {
                const unitPrice = effectivePrice;
                const def = COMMODITIES[selected.commodityId];
                const subtotal = q * unitPrice;

                if (mode === "buy") {
                  const fee = Math.round(subtotal * 0.015);
                  const ok = await confirmAction({
                    title: `Buy ${q} ${selected.unit}s of ${def.name}?`,
                    description: `${def.emoji} ${def.name} in ${cityName} at ${formatFullRp(unitPrice)} each`,
                    lines: [
                      { label: "Subtotal", value: formatFullRp(subtotal) },
                      { label: "Market fee (1.5%)", value: `-${formatFullRp(fee)}` },
                    ],
                    currentCash: playerCash,
                    cashChange: -(subtotal + fee),
                    confirmLabel: "Confirm purchase",
                    tone: "good",
                  });
                  if (!ok) return;
                  actions.buyCommodity(selected.commodityId, q, parseKey(destKey || keyOf("vehicle", vehicles[0]?.id ?? "")));
                } else {
                  const marketFee = Math.round(subtotal * 0.015);
                  const delegation = sellRemote ? delegationFee(subtotal) : 0;
                  const totalFee = marketFee + delegation;
                  const lines: { label: string; value: string }[] = [
                    { label: "Subtotal", value: formatFullRp(subtotal) },
                    { label: "Market fee (1.5%)", value: `-${formatFullRp(marketFee)}` },
                  ];
                  if (delegation > 0) {
                    lines.push({ label: "Delegation fee (6%)", value: `-${formatFullRp(delegation)}` });
                  }
                  const ok = await confirmAction({
                    title: `Sell ${q} ${selected.unit}s of ${def.name}?`,
                    description: `${def.emoji} Sold in ${sellRemote && destWh ? CITIES[destWh.cityId].name : cityName} at ${formatFullRp(unitPrice)} each`,
                    lines,
                    currentCash: playerCash,
                    cashChange: subtotal - totalFee,
                    confirmLabel: "Confirm sale",
                    tone: "danger",
                  });
                  if (!ok) return;
                  actions.sellCommodity(
                    selected.commodityId,
                    q,
                    parseKey(destKey || keyOf("vehicle", vehicles[0]?.id ?? ""))
                  );
                }
              }}
            />
          ) : (
            <ReadoutPanel>
              <p className="text-[14px] text-mist-300">
                Select a commodity on the left to prepare a trade.
              </p>
            </ReadoutPanel>
          )}
        </div>
      </div>
    </div>
  );
}

function CommodityRow({
  commodity,
  selected,
  onSelect,
}: {
  commodity: CommodityMarket;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors sm:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))_repeat(2,auto)] ${
          selected ? "bg-ink-700/50" : "hover:bg-ink-800/60"
        }`}
      >
        <div className="min-w-0">
          <p className="font-display text-[16px] text-paper-100">
            {commodity.name}
          </p>
          <p className="text-[12px] text-mist-400">
            {commodity.playerOwns > 0 ? (
              <span className="text-brass-300">
                you hold {commodity.playerOwns}{" "}
                {commodity.unit}
                {commodity.playerOwns === 1 ? "" : "s"}
              </span>
            ) : (
              <span>not holding</span>
            )}
          </p>
        </div>

        <div className="sm:col-start-2 sm:col-span-1">
          <p className="font-nums text-[14px] text-paper-100 text-right sm:text-left">
            {formatFullRp(commodity.price)}
          </p>
          <p className="text-[11px] text-mist-500 text-right sm:text-left">
            / {commodity.unit}
          </p>
        </div>

        <div className="hidden sm:flex sm:items-center sm:justify-center">
          <DualMeter supply={commodity.supply} demand={commodity.demand} />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Sparkline
            history={commodity.history}
            positive={commodity.changePct >= 0}
          />
        </div>

        <Delta value={commodity.changePct} />
      </button>
    </li>
  );
}

function TradeTicket({
  commodity,
  mode,
  setMode,
  quantity,
  setQuantity,
  playerCash,
  destKey,
  setDestKey,
  destOptions,
  destLabel,
  destCapacity,
  sourceOwned,
  effectivePrice,
  sellRemote,
  onConfirm,
}: {
  commodity: CommodityMarket;
  mode: "buy" | "sell";
  setMode: (m: "buy" | "sell") => void;
  quantity: string;
  setQuantity: (q: string) => void;
  playerCash: number;
  destKey: string;
  setDestKey: (k: string) => void;
  destOptions: DropdownOption[];
  destLabel?: ReactNode;
  destCapacity: { used: number; capacity: number };
  sourceOwned: number;
  effectivePrice: number;
  sellRemote: boolean;
  onConfirm: (quantity: number) => void;
}) {
  const FEE_RATE = 0.015;
  const DELEGATION_RATE = 0.06;

  useEffect(() => {
    if (mode === "sell" && sourceOwned > 0) {
      const n = Number(quantity) || 0;
      if (n < 1 || n > sourceOwned) setQuantity(String(sourceOwned));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, destKey, sourceOwned]);

  const qty = Math.max(0, Math.floor(Number(quantity) || 0));

  const { subtotal, fee, delegation, net } = useMemo(() => {
    const subtotal = qty * effectivePrice;
    const fee = Math.round(subtotal * FEE_RATE);
    const delegation = sellRemote ? Math.round(subtotal * DELEGATION_RATE) : 0;
    const net =
      mode === "buy"
        ? -(subtotal + fee)
        : subtotal - fee - delegation;
    return { subtotal, fee, delegation, net };
  }, [qty, effectivePrice, mode, sellRemote]);

  const hasDest = Boolean(destKey);
  const overCapacity =
    mode === "buy" && destCapacity.capacity > 0
      ? destCapacity.used + qty > destCapacity.capacity
      : false;
  const canAfford = mode === "buy" ? Math.abs(net) <= playerCash : qty <= sourceOwned;
  const valid = hasDest && qty >= 1 && !overCapacity && canAfford;

  return (
    <PaperPanel eyebrow={commodity.unit} title={commodity.name}>
      <div className="mb-3 flex justify-between text-[12px]">
        <span className="text-mist-400">
          {mode === "buy" ? "Purchase price" : "Sale price"}:{" "}
          <span className="font-nums text-paper-200">
            {formatFullRp(effectivePrice)}
          </span>
          {sellRemote && (
            <span className="ml-1 text-brass-300">· remote</span>
          )}
        </span>
      </div>

      <div className="mb-4 flex border border-ink-600">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-[13px] capitalize transition-colors ${
              mode === m
                ? m === "buy"
                  ? "bg-jade-500/50 text-paper-100"
                  : "bg-rust-500/50 text-paper-100"
                : "text-mist-300 hover:bg-ink-900/5 hover:text-paper-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[13px] text-mist-300">
          {mode === "buy" ? "Load into" : "Sell from"}
        </span>
        <Dropdown
          value={destKey}
          onChange={setDestKey}
          options={destOptions}
          placeholder={
            mode === "buy" ? "Choose a vehicle or warehouse…" : "Choose what to sell…"
          }
          emptyLabel="No targets available"
          searchable
        />
        {mode === "buy" && destCapacity.capacity > 0 && (
          <span className="mt-1 block text-[11px] text-mist-400">
            {destCapacity.used} / {destCapacity.capacity} units used
            {overCapacity && (
              <span className="text-rust-400">
                {" "}
                · +{quantity} would overflow
              </span>
            )}
          </span>
        )}
        {mode === "sell" && (
          <span className="mt-1 block text-[11px] text-mist-400">
            {sourceOwned} {commodity.unit}
            {sourceOwned === 1 ? "" : "s"} available in{" "}
            {typeof destLabel === "string" ? destLabel : "target"}
            {sellRemote && (
              <span className="text-brass-300"> · +6% delegation</span>
            )}
          </span>
        )}
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-[13px] text-mist-300">
          Quantity ({commodity.unit}s)
        </span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => {
            const n = Math.max(1, Math.floor(Number(quantity) || 0));
            if (String(n) !== quantity) setQuantity(String(n));
          }}
          className="w-full border border-ink-600 bg-ink-900 px-3 py-2 font-nums text-[15px] text-paper-100 focus:border-brass-400 focus:outline-none"
        />
      </label>

      <dl className="space-y-2 border-t border-ink-600 pt-3 text-[13px]">
        <Line
          label={mode === "buy" ? "Purchase cost" : "Sale revenue"}
          value={subtotal}
        />
        <Line label="Transaction fee" value={-fee} />
        {delegation > 0 && <Line label="Delegation fee (6%)" value={-delegation} />}
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-ink-600 pt-3">
        <span className="font-display text-[15px] text-paper-100">Net</span>
        <span
          className={`font-nums font-display text-[18px] ${
            net < 0 ? "text-rust-400" : "text-jade-400"
          }`}
        >
          {net < 0 ? "-" : "+"}
          {formatFullRp(Math.abs(net))}
        </span>
      </div>

      <button
        type="button"
        disabled={!valid}
        onClick={() => onConfirm(qty)}
        className={`mt-5 w-full py-2.5 text-[14px] font-medium text-paper-100 transition-colors disabled:cursor-not-allowed disabled:bg-ink-900/30 disabled:text-paper-200 ${
          mode === "buy"
            ? "bg-jade-500 hover:bg-jade-400"
            : "bg-rust-500 hover:bg-rust-400"
        }`}
      >
        {mode === "buy" ? "Confirm purchase" : "Confirm sale"}
      </button>
      {!hasDest && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          {mode === "buy"
            ? "Pick a vehicle or warehouse to load into"
            : "Pick a vehicle or warehouse to sell from"}
        </p>
      )}
      {hasDest && mode === "buy" && overCapacity && destCapacity.capacity > 0 && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Capacity exceeded — free up space or use another container
        </p>
      )}
      {hasDest && mode === "buy" && !overCapacity && !canAfford && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Not enough cash
        </p>
      )}
      {hasDest && mode === "sell" && !canAfford && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          You don't own enough in that container
        </p>
      )}
    </PaperPanel>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-mist-300">{label}</dt>
      <dd className={`font-nums ${value < 0 ? "text-rust-400" : "text-paper-100"}`}>
        {value < 0 ? "-" : ""}
        {formatFullRp(Math.abs(value))}
      </dd>
    </div>
  );
}