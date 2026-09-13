import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Building2 } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { DualMeter } from "../components/Meter";
import { Delta } from "../components/Badge";
import { confirmAction } from "../components/ConfirmDialog";
import { COMMODITIES } from "../engine/commodities";
import {
  availableCommoditiesForCity,
  citySellsCommodity,
  CITIES,
} from "../engine/cities";
import { warehouseUsedCapacity, delegationFee } from "../engine/warehouses";
import { VEHICLES } from "../engine/vehicles";
import { formatFullRp } from "../utils/format";
import type { CommodityId, CommodityMarket, CityId } from "../types";

export function Market() {
  const [selectedId, setSelectedId] = useState<CommodityId | null>("coffee");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(100);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "trend">("name");
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
  const vehicleInventory = selectedVehicle?.inventory ?? {};
  const carriedUnits = Object.values(vehicleInventory).reduce((s, v) => s + v, 0);
  const vehicleCapacity = selectedVehicle
    ? VEHICLES[selectedVehicle.typeId].capacity
    : Infinity;

  const available = useMemo(
    () => availableCommoditiesForCity(currentCity),
    [currentCity]
  );

  const commodities: CommodityMarket[] = available.map((cid) => {
    const def = COMMODITIES[cid];
    const price = market.prices[cid] ?? def.basePrice;
    const supply = market.supply[cid] ?? 100;
    const demand = market.demand[cid] ?? 100;
    const history = market.priceHistory[cid] ?? [price];
    const prev = history.length >= 2 ? history[history.length - 2] : price;
    const changePct = prev > 0 ? (price - prev) / prev : 0;

    return {
      commodityId: cid,
      name: `${def.emoji} ${def.name}`,
      unit: def.unit,
      price,
      supply,
      demand,
      history,
      changePct,
      playerOwns: vehicleInventory[cid] ?? 0,
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
          to="/map"
          className="border border-ink-600 px-3 py-2 text-[13px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
        >
          Compare other cities
        </Link>
      </header>

      {heldElsewhere.length > 0 && (
        <ReadoutPanel title="Held goods not traded here">
          <p className="mb-2 text-[13px] text-mist-400">
            These goods aren't sold in {cityName}, so you can't offload them
            here. Visit the market that trades them (check the Almanac) or buy
            through a warehouse agent.
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "price" | "trend")}
                className="border border-ink-600 bg-ink-900 px-2 py-2 text-[13px] text-paper-200 focus:border-brass-400 focus:outline-none"
              >
                <option value="name">Sort: name</option>
                <option value="price">Sort: price</option>
                <option value="trend">Sort: trend</option>
              </select>
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
                      c.playerOwns > 0 ? Math.min(c.playerOwns, 100) : 100
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
              carriedUnits={carriedUnits}
              vehicleCapacity={vehicleCapacity}
              onConfirm={async (q) => {
                const unitPrice =
                  market.prices[selected.commodityId] ??
                  COMMODITIES[selected.commodityId].basePrice;
                const subtotal = q * unitPrice;
                const fee = Math.round(subtotal * 0.015);
                const def = COMMODITIES[selected.commodityId];

                if (mode === "buy") {
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
                  actions.buyCommodity(selected.commodityId, q);
                } else {
                  const ok = await confirmAction({
                    title: `Sell ${q} ${selected.unit}s of ${def.name}?`,
                    description: `${def.emoji} ${def.name} in ${cityName} at ${formatFullRp(unitPrice)} each`,
                    lines: [
                      { label: "Subtotal", value: formatFullRp(subtotal) },
                      { label: "Market fee (1.5%)", value: `-${formatFullRp(fee)}` },
                    ],
                    currentCash: playerCash,
                    cashChange: subtotal - fee,
                    confirmLabel: "Confirm sale",
                    tone: "danger",
                  });
                  if (!ok) return;
                  actions.sellCommodity(selected.commodityId, q);
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

      <RemoteBuyPanel />
    </div>
  );
}

function RemoteBuyPanel() {
  const warehouses = useGameStore((s) => s.warehouses);
  const currentCity = useGameStore((s) => s.currentCity);
  const playerCash = useGameStore((s) => s.playerCash);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const actions = useGameStore((s) => s.actions);

  const remoteWhs = warehouses.filter((w) => w.cityId !== currentCity);
  const [city, setCity] = useState<CityId | "">("");
  const [cid, setCid] = useState<CommodityId>("rice");
  const [qty, setQty] = useState(100);

  const cityKeys = remoteWhs.map((w) => w.cityId).join(",");

  useEffect(() => {
    if (city && remoteWhs.some((w) => w.cityId === city)) return;
    if (remoteWhs.length > 0) setCity(remoteWhs[0].cityId);
  }, [cityKeys, city, remoteWhs.length]);

  useEffect(() => {
    if (!city) return;
    const avail = availableCommoditiesForCity(city);
    if (!avail.includes(cid)) setCid(avail[0] ?? "rice");
  }, [city, cid]);

  if (remoteWhs.length === 0) return null;

  const wh = warehouses.find((w) => w.cityId === city);
  if (!wh || !city) return null;

  const avail = availableCommoditiesForCity(city);
  const market = cityMarkets[city];
  const def = COMMODITIES[cid];
  const price = market.prices[cid] ?? def.basePrice;
  const subtotal = qty * price;
  const marketFee = Math.round(subtotal * 0.015);
  const agents = delegationFee(subtotal);
  const total = subtotal + marketFee + agents;
  const used = warehouseUsedCapacity(wh.inventory);
  const overCapacity = used + qty > wh.capacity;
  const canAfford = total <= playerCash;

  return (
    <ReadoutPanel
      eyebrow="Warehouse agents"
      title="Buy from other cities"
      action={
        <div className="flex items-center gap-2 text-[13px] text-mist-300">
          <Building2 size={16} strokeWidth={1.75} className="text-brass-300" />
          <span>You own {warehouses.length} warehouse{warehouses.length === 1 ? "" : "s"}</span>
        </div>
      }
    >
      <p className="mb-4 text-[13px] text-mist-400">
        You can only buy in cities where you own a warehouse. The agent charges
        a 6% delegation fee on top of the 1.5% market fee, and the goods are
        stored straight into that warehouse.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
        <label className="block">
          <span className="mb-1 block text-[13px] text-mist-300">Warehouse city</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as CityId)}
            className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
          >
            {remoteWhs.map((w) => (
              <option key={w.id} value={w.cityId}>
                {CITIES[w.cityId]?.name ?? w.cityId}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] text-mist-300">Goods</span>
          <select
            value={cid}
            onChange={(e) => setCid(e.target.value as CommodityId)}
            className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
          >
            {avail.map((a) => (
              <option key={a} value={a}>
                {COMMODITIES[a].emoji} {COMMODITIES[a].name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] text-mist-300">Quantity</span>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 0))}
            className="w-full border border-ink-600 bg-ink-900 px-3 py-2 font-nums text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
          />
        </label>
      </div>

      <dl className="space-y-2 border-t border-ink-700 pt-3 text-[13px]">
        <RemoteLine label="Subtotal" value={subtotal} />
        <RemoteLine label="Market fee (1.5%)" value={-marketFee} />
        <RemoteLine label="Agent fee (6%)" value={-agents} />
        <div className="flex items-center justify-between pt-1">
          <dt className="text-mist-400">
            Warehouse space {used} / {wh.capacity}
          </dt>
          <dd className={`font-nums ${overCapacity ? "text-rust-400" : "text-mist-300"}`}>
            {overCapacity ? "overflow" : "fits"}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={!canAfford || overCapacity}
        onClick={async () => {
          const ok = await confirmAction({
            title: `Buy ${qty} ${def.unit}s of ${def.name} in ${CITIES[city]?.name ?? city}?`,
            description: `${def.emoji} The agent picks up ${def.name} in ${CITIES[city]?.name ?? city} and stores it in your warehouse there.`,
            lines: [
              { label: "Subtotal", value: formatFullRp(subtotal) },
              { label: "Market fee (1.5%)", value: `-${formatFullRp(marketFee)}` },
              { label: "Agent fee (6%)", value: `-${formatFullRp(agents)}` },
            ],
            currentCash: playerCash,
            cashChange: -total,
            confirmLabel: "Confirm purchase",
            tone: "good",
          });
          if (!ok) return;
          actions.buyRemoteCommodity(cid, qty, city);
        }}
        className="mt-5 w-full bg-jade-500 py-2.5 text-[14px] font-medium text-paper-100 transition-colors hover:bg-jade-400 disabled:cursor-not-allowed disabled:bg-ink-900/30 disabled:text-paper-200"
      >
        Confirm purchase · {formatFullRp(total)}
      </button>
      {overCapacity && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Warehouse capacity exceeded
        </p>
      )}
      {!overCapacity && !canAfford && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Not enough cash
        </p>
      )}
    </ReadoutPanel>
  );
}

function RemoteLine({ label, value }: { label: string; value: number }) {
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
  carriedUnits,
  vehicleCapacity,
  onConfirm,
}: {
  commodity: CommodityMarket;
  mode: "buy" | "sell";
  setMode: (m: "buy" | "sell") => void;
  quantity: number;
  setQuantity: (q: number) => void;
  playerCash: number;
  carriedUnits: number;
  vehicleCapacity: number;
  onConfirm: (quantity: number) => void;
}) {
  const FEE_RATE = 0.015;

  const { subtotal, fee, net } = useMemo(() => {
    const subtotal = quantity * commodity.price;
    const fee = Math.round(subtotal * FEE_RATE);
    const net = mode === "buy" ? -(subtotal + fee) : subtotal - fee;
    return { subtotal, fee, net };
  }, [quantity, commodity.price, mode]);

  const canAfford = mode === "buy" ? Math.abs(net) <= playerCash : quantity <= commodity.playerOwns;
  const overCapacity = mode === "buy" && carriedUnits + quantity > vehicleCapacity;

  return (
    <PaperPanel eyebrow={commodity.unit} title={commodity.name}>
      <div className="mb-3 flex justify-between text-[12px]">
        <span className="text-mist-400">
          Carrying {carriedUnits} / {Number.isFinite(vehicleCapacity) ? vehicleCapacity : "∞"} units
        </span>
        {overCapacity && (
          <span className="text-rust-400">
            +{quantity} would overflow the vehicle
          </span>
        )}
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

      <label className="mb-4 block">
        <span className="mb-1 block text-[13px] text-mist-300">
          Quantity ({commodity.unit}s)
        </span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, Number(e.target.value) || 0))
          }
          className="w-full border border-ink-600 bg-ink-900 px-3 py-2 font-nums text-[15px] text-paper-100 focus:border-brass-400 focus:outline-none"
        />
      </label>

      <dl className="space-y-2 border-t border-ink-600 pt-3 text-[13px]">
        <Line
          label={mode === "buy" ? "Purchase cost" : "Sale revenue"}
          value={subtotal}
        />
        <Line label="Transaction fee" value={-fee} />
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
        disabled={canAfford === false || overCapacity}
        onClick={() => onConfirm(quantity)}
        className={`mt-5 w-full py-2.5 text-[14px] font-medium text-paper-100 transition-colors disabled:cursor-not-allowed disabled:bg-ink-900/30 disabled:text-paper-200 ${
          mode === "buy"
            ? "bg-jade-500 hover:bg-jade-400"
            : "bg-rust-500 hover:bg-rust-400"
        }`}
      >
        {mode === "buy" ? "Confirm purchase" : "Confirm sale"}
      </button>
      {overCapacity && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Capacity exceeded — free up space in your vehicle or use a warehouse
        </p>
      )}
      {!overCapacity && mode === "buy" && !canAfford && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          Not enough cash
        </p>
      )}
      {mode === "sell" && !canAfford && (
        <p className="mt-2 text-center text-[11px] text-rust-400">
          You don't own enough
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