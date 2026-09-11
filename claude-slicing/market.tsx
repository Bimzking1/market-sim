import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PaperPanel, ReadoutPanel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { DualMeter } from "../components/Meter";
import { Delta } from "../components/Badge";
import { commodities, player } from "../data/mockData";
import { formatFullRp } from "../utils/format";
import type { CommodityMarket } from "../types";

const TRANSPORT_RATE_PER_UNIT = 2_500; // TODO: derive from selected vehicle + distance
const FEE_RATE = 0.015; // TODO: derive from market information tier / city tax rules

export function Market() {
  const [selectedId, setSelectedId] = useState<string | null>("coffee");
  const [mode, setMode] = useState<"buy" | "sell">("sell");
  const [quantity, setQuantity] = useState(100);

  const selected = commodities.find((c) => c.commodityId === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-mist-400">Bandung · Agricultural city</p>
          <h1 className="font-display text-3xl font-medium text-paper-100">Market</h1>
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
          <ul className="divide-y divide-ink-700">
            {commodities.map((c) => (
              <CommodityRow
                key={c.commodityId}
                commodity={c}
                selected={c.commodityId === selectedId}
                onSelect={() => {
                  setSelectedId(c.commodityId);
                  setQuantity(c.playerOwns > 0 ? Math.min(c.playerOwns, 100) : 100);
                  setMode(c.playerOwns > 0 ? "sell" : "buy");
                }}
              />
            ))}
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
          <p className="font-display text-[16px] text-paper-100">{commodity.name}</p>
          <p className="text-[12px] text-mist-400">
            {formatFullRp(commodity.price)} / {commodity.unit}
            {commodity.playerOwns > 0 && (
              <span className="text-brass-300"> · you hold {commodity.playerOwns}</span>
            )}
          </p>
        </div>

        <div className="hidden sm:block">
          <DualMeter supply={commodity.supply} demand={commodity.demand} />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Sparkline history={commodity.history} positive={commodity.changePct >= 0} />
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
}: {
  commodity: CommodityMarket;
  mode: "buy" | "sell";
  setMode: (m: "buy" | "sell") => void;
  quantity: number;
  setQuantity: (q: number) => void;
}) {
  const { subtotal, transport, fee, net } = useMemo(() => {
    const subtotal = quantity * commodity.price;
    const transport = quantity * TRANSPORT_RATE_PER_UNIT;
    const fee = Math.round(subtotal * FEE_RATE);
    const net = mode === "buy" ? -(subtotal + transport + fee) : subtotal - transport - fee;
    return { subtotal, transport, fee, net };
  }, [quantity, commodity.price, mode]);

  return (
    <PaperPanel eyebrow={commodity.unit} title={commodity.name}>
      <div className="mb-4 flex border border-ink-900/15">
        {(["buy", "sell"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-[13px] capitalize transition-colors ${
              mode === m ? "bg-ink-900 text-paper-100" : "text-ink-900/60 hover:bg-ink-900/5"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-[13px] text-ink-900/70">Quantity ({commodity.unit}s)</span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
          className="w-full border border-ink-900/20 bg-paper-100 px-3 py-2 font-nums text-[15px] text-ink-900 focus:border-brass-500 focus:outline-none"
        />
      </label>

      <dl className="space-y-2 border-t border-ink-900/15 pt-3 text-[13px]">
        <Line label={mode === "buy" ? "Purchase cost" : "Sale revenue"} value={subtotal} />
        <Line label="Transport (est.)" value={-transport} />
        <Line label="Transaction fee" value={-fee} />
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-ink-900/20 pt-3">
        <span className="font-display text-[15px] text-ink-900">Net</span>
        <span className={`font-nums font-display text-[18px] ${net < 0 ? "text-rust-500" : "text-jade-500"}`}>
          {net < 0 ? "-" : "+"}
          {formatFullRp(Math.abs(net))}
        </span>
      </div>

      <button
        type="button"
        disabled={mode === "buy" && Math.abs(net) > player.cash}
        className="mt-5 w-full bg-ink-900 py-2.5 text-[14px] text-paper-100 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-900/30"
      >
        {mode === "buy" ? "Confirm purchase" : "Confirm sale"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-900/50">
        Wire this ticket to the trading engine to affect cash & inventory.
      </p>
    </PaperPanel>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-900/70">{label}</dt>
      <dd className={`font-nums ${value < 0 ? "text-rust-500" : "text-ink-900"}`}>
        {value < 0 ? "-" : ""}
        {formatFullRp(Math.abs(value))}
      </dd>
    </div>
  );
}