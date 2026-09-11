import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { DualMeter } from "../components/Meter";
import { Delta } from "../components/Badge";
import { confirmAction } from "../components/ConfirmDialog";
import { COMMODITIES, ALL_COMMODITY_IDS } from "../engine/commodities";
import { VEHICLES } from "../engine/vehicles";
import { formatFullRp } from "../utils/format";
import type { CommodityId, CommodityMarket } from "../types";

export function Market() {
  const [selectedId, setSelectedId] = useState<CommodityId | null>("coffee");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(100);
  const [search, setSearch] = useState("");

  const currentCity = useGameStore((s) => s.currentCity);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const inventory = useGameStore((s) => s.inventory);
  const playerCash = useGameStore((s) => s.playerCash);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const vehicles = useGameStore((s) => s.vehicles);
  const actions = useGameStore((s) => s.actions);

  const market = cityMarkets[currentCity];
  const cityName = currentCity.charAt(0).toUpperCase() + currentCity.slice(1);

  const carriedUnits = Object.values(inventory).reduce((s, v) => s + v, 0);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const vehicleCapacity = selectedVehicle
    ? VEHICLES[selectedVehicle.typeId].capacity
    : Infinity;

  const commodities: CommodityMarket[] = ALL_COMMODITY_IDS.map((cid) => {
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
      playerOwns: inventory[cid] ?? 0,
      perishable: def.perishable,
    };
  });

  const query = search.trim().toLowerCase();
  const visible = query
    ? commodities.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (COMMODITIES[c.commodityId].category as string).includes(query)
      )
    : commodities;

  const selected = commodities.find((c) => c.commodityId === selectedId) ?? null;

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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ReadoutPanel bodyClassName="p-0">
          <div className="border-b border-ink-700 px-5 py-3">
            <div className="relative">
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
                    setMode(c.playerOwns > 0 ? "sell" : "buy");
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
        className={`grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors sm:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))_auto] ${
          selected ? "bg-ink-700/50" : "hover:bg-ink-800/60"
        }`}
      >
        <div className="min-w-0">
          <p className="font-display text-[16px] text-paper-100">
            {commodity.name}
          </p>
          <p className="text-[12px] text-mist-400">
            {formatFullRp(commodity.price)} / {commodity.unit}
            {commodity.playerOwns > 0 && (
              <span className="text-brass-300">
                {" "}
                · you hold {commodity.playerOwns}
              </span>
            )}
          </p>
        </div>

        <div className="hidden sm:block">
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
                ? "bg-ink-900 text-paper-100"
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
        className="mt-5 w-full bg-ink-950 py-2.5 text-[14px] text-paper-100 transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:bg-ink-900/30"
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
