import { useEffect, useState } from "react";
import { Radar } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { Dropdown, type DropdownOption } from "../components/Dropdown";
import { Sparkline } from "../components/Sparkline";
import { Delta } from "../components/Badge";
import { toast } from "../components/Toast";
import { confirmAction } from "../components/ConfirmDialog";
import {
  CITIES,
  ALL_CITY_IDS,
  availableCommoditiesForCity,
} from "../engine/cities";
import { COMMODITIES } from "../engine/commodities";
import { REMOTE_MARKET_INFO_FEE, delegationFee, warehouseUsedCapacity } from "../engine/warehouses";
import { warehouseSlotParts } from "../engine/warehouses";
import { formatFullRp } from "../utils/format";
import type { CityId, CommodityId } from "../types";

export function RemoteMarket() {
  const currentCity = useGameStore((s) => s.currentCity);
  const warehouses = useGameStore((s) => s.warehouses);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const playerCash = useGameStore((s) => s.playerCash);
  const actions = useGameStore((s) => s.actions);

  const [selectedCity, setSelectedCity] = useState<CityId | "">("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [revealed, setRevealed] = useState<Set<CityId>>(new Set());
  const [quantities, setQuantities] = useState<Partial<Record<CommodityId, string>>>({});

  const remoteCityIds = ALL_CITY_IDS.filter((c) => c !== currentCity);

  useEffect(() => {
    if (selectedCity && selectedCity === currentCity) {
      setSelectedCity("");
    }
  }, [currentCity, selectedCity]);

  const cityOptions: DropdownOption[] = remoteCityIds.map((cid) => {
    const whs = warehouses.filter((w) => w.cityId === cid);
    const hasWh = whs.length > 0;
    return {
      value: cid,
      label: CITIES[cid].name,
      sublabel: hasWh
        ? `${whs.length} warehouse${whs.length === 1 ? "" : "s"} here`
        : "no warehouse — can't buy here",
      meta: revealed.has(cid) ? "priced" : undefined,
      disabled: false,
    };
  });

  const whsHere = selectedCity
    ? warehouses.filter((w) => w.cityId === selectedCity)
    : [];

  const handleSelect = (value: string) => {
    const target = value as CityId;
    if (target === currentCity) return;
    if (revealed.has(target)) {
      setSelectedCity(target);
      setSelectedWarehouseId("");
      return;
    }
    void (async () => {
      const ok = await confirmAction({
        title: `Reveal ${CITIES[target].name} prices?`,
        description: `An informant in ${CITIES[target].name} sells you today's market data for a one-off fee. You pay it every time you switch to a city you haven't scouted before.`,
        lines: [
          { label: "Information fee", value: `-${formatFullRp(REMOTE_MARKET_INFO_FEE)}` },
          { label: "Cash after fee", value: formatFullRp(Math.max(0, playerCash - REMOTE_MARKET_INFO_FEE)) },
        ],
        currentCash: playerCash,
        cashChange: -REMOTE_MARKET_INFO_FEE,
        confirmLabel: `Pay ${formatFullRp(REMOTE_MARKET_INFO_FEE)}`,
        tone: "good",
      });
      if (!ok) {
        setSelectedCity("");
        return;
      }
      const result = actions.revealRemoteMarket(target);
      if (result) {
        setRevealed((prev) => new Set(prev).add(target));
        setSelectedCity(target);
        setSelectedWarehouseId("");
        toast({
          title: `${CITIES[target].name} market revealed`,
          message: `${formatFullRp(REMOTE_MARKET_INFO_FEE)} paid — live prices are now open here.`,
          tone: "good",
        });
      } else {
        setSelectedCity("");
        toast({
          title: "Couldn't pay information fee",
          message: `You need at least ${formatFullRp(REMOTE_MARKET_INFO_FEE)} to scout a foreign market.`,
          tone: "bad",
        });
      }
    })();
  };

  const cityName = selectedCity ? CITIES[selectedCity].name : "";
  const activeWh =
    whsHere.find((w) => w.id === selectedWarehouseId) ?? whsHere[0];
  const activeUsed = activeWh ? warehouseUsedCapacity(activeWh.inventory) : 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-mist-400">
          Scout foreign markets through warehouse agents
        </p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Market (Remote)
        </h1>
      </header>

      <ReadoutPanel
        eyebrow={`Information fee ${formatFullRp(REMOTE_MARKET_INFO_FEE)}`}
        title="Choose a city to scout"
        action={
          <div className="flex items-center gap-2 text-[13px] text-mist-300">
            <Radar size={16} strokeWidth={1.75} className="text-brass-300" />
            <span>
              Cash {formatFullRp(playerCash)}
            </span>
          </div>
        }
      >
        <p className="mb-4 text-[13px] text-mist-400">
          You pay an informant{" "}
          <span className="text-brass-300">
            {formatFullRp(REMOTE_MARKET_INFO_FEE)}
          </span>{" "}
          every time you switch cities to see live prices. Buying through an
          agent adds the 1.5% market fee plus a 6% delegation fee, and goods
          are stored in your warehouse there — you can never load them into a
          vehicle remotely. Compare these costs against travelling there
          yourself.
        </p>

        <div className="max-w-md">
          <Dropdown
            value={selectedCity}
            onChange={handleSelect}
            options={cityOptions}
            searchable
            placeholder="Select a city to scope out prices…"
          />
        </div>
      </ReadoutPanel>

      {selectedCity && revealed.has(selectedCity) && (
        <>
          {whsHere.length === 0 && (
            <ReadoutPanel title={`No warehouse in ${cityName}`}>
              <p className="text-[14px] text-mist-400">
                Without a warehouse in {cityName} you can only view prices
                here. Buy or travel first so the agent has somewhere to store
                the goods.
              </p>
            </ReadoutPanel>
          )}

          {whsHere.length > 0 && (
            <ReadoutPanel title={`Warehouses in ${cityName}`}>
              <div className="max-w-md">
                <Dropdown
                  value={activeWh?.id ?? ""}
                  onChange={(v) => setSelectedWarehouseId(v)}
                  options={whsHere.map((wh, i) => {
                    const parts = warehouseSlotParts(wh, i + 1);
                    const used = parts.used;
                    return {
                      value: wh.id,
                      label: parts.label,
                      sublabel: parts.sublabel,
                      meta: `${used} / ${wh.capacity} units`,
                      disabled: false,
                    };
                  })}
                  placeholder="Choose a warehouse to store into…"
                />
              </div>
              {activeWh && (
                <p className="mt-3 text-[13px] text-mist-400">
                  Purchases are stored in{" "}
                  <span className="text-paper-100">
                    {warehouseSlotParts(activeWh, 1).label}
                  </span>
                  <span className="text-mist-300">
                    {" "}
                    ({activeUsed} / {activeWh.capacity} units used ·{" "}
                    {activeWh.capacity - activeUsed} free)
                  </span>
                </p>
              )}
            </ReadoutPanel>
          )}

          <MarketList
            cityId={selectedCity}
            warehouseId={activeWh?.id ?? ""}
            canBuy={whsHere.length > 0}
            cash={playerCash}
            quantities={quantities}
            onQty={(cid, q) => setQuantities((prev) => ({ ...prev, [cid]: q }))}
            onBuy={async (cid, qty) => {
              const market = cityMarkets[selectedCity];
              const def = COMMODITIES[cid];
              const price = market.prices[cid] ?? def.basePrice;
              const subtotal = qty * price;
              const marketFee = Math.round(subtotal * 0.015);
              const deleg = delegationFee(subtotal);
              const total = subtotal + marketFee + deleg;

              const whName = activeWh
                ? warehouseSlotParts(activeWh, 1).label
                : "your warehouse there";

              const ok = await confirmAction({
                title: `Buy ${qty} ${def.unit}s of ${def.name} in ${cityName}?`,
                description: `${def.emoji} The agent buys in ${cityName} and stores it in ${whName} (delegation 6%).`,
                lines: [
                  { label: "Subtotal", value: formatFullRp(subtotal) },
                  { label: "Market fee (1.5%)", value: `-${formatFullRp(marketFee)}` },
                  { label: "Delegation fee (6%)", value: `-${formatFullRp(deleg)}` },
                ],
                currentCash: playerCash,
                cashChange: -total,
                confirmLabel: "Confirm purchase",
                tone: "good",
              });
              if (!ok) return;
              if (!activeWh) return;
              actions.buyRemoteCommodity(cid, qty, selectedCity, activeWh.id);
            }}
          />
        </>
      )}
    </div>
  );
}

function MarketList({
  cityId,
  warehouseId,
  canBuy,
  cash,
  quantities,
  onQty,
  onBuy,
}: {
  cityId: CityId;
  warehouseId: string;
  canBuy: boolean;
  cash: number;
  quantities: Partial<Record<CommodityId, string>>;
  onQty: (cid: CommodityId, qty: string) => void;
  onBuy: (cid: CommodityId, qty: number) => Promise<void>;
}) {
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const warehouses = useGameStore((s) => s.warehouses);
  const wh = warehouses.find((w) => w.id === warehouseId);
  const market = cityMarkets[cityId];
  const avail = availableCommoditiesForCity(cityId);

  return (
    <ReadoutPanel title={`${CITIES[cityId].name} prices`} bodyClassName="p-0">
      <ul className="divide-y divide-ink-700">
        {avail.map((cid) => {
          const def = COMMODITIES[cid];
          const price = market.prices[cid] ?? def.basePrice;
          const history = market.priceHistory[cid] ?? [price];
          const prev = history.length >= 2 ? history[history.length - 2] : price;
          const changePct = prev > 0 ? (price - prev) / prev : 0;
          const qtyText = quantities[cid] ?? "100";
          const qty = Math.max(1, Math.floor(Number(qtyText) || 0));
          const subtotal = qty * price;
          const deleg = delegationFee(subtotal);
          const total = subtotal + Math.round(subtotal * 0.015) + deleg;
          const overCap = wh
            ? warehouseUsedCapacity(wh.inventory) + qty > wh.capacity
            : true;
          const canAfford = total <= cash;

          return (
            <li
              key={cid}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[1.4fr_130px_110px_90px_auto]"
            >
              <div className="min-w-0">
                <p className="font-display text-[15px] text-paper-100">
                  {def.emoji} {def.name}
                </p>
                <p className="text-[11px] text-mist-400">{def.unit}</p>
              </div>
              <div className="text-right sm:text-left">
                <p className="font-nums text-[14px] text-paper-100">
                  {formatFullRp(price)}
                </p>
                <p className="text-[11px] text-mist-500">/ {def.unit}</p>
              </div>
              <div className="hidden sm:block">
                <Sparkline history={history} positive={changePct >= 0} />
              </div>
              <div className="hidden sm:block">
                <Delta value={changePct} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <input
                  type="number"
                  min={1}
                  value={qtyText}
                  onChange={(e) => onQty(cid, e.target.value)}
                  onBlur={() => {
                    const n = Math.max(1, Math.floor(Number(qtyText) || 0));
                    if (String(n) !== qtyText) onQty(cid, String(n));
                  }}
                  className="w-20 border border-ink-600 bg-ink-900 px-2 py-1.5 font-nums text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!canBuy || overCap || !canAfford}
                  onClick={() => onBuy(cid, qty)}
                  className="bg-jade-500 px-3 py-1.5 text-[12px] font-medium text-paper-100 transition-colors hover:bg-jade-400 disabled:cursor-not-allowed disabled:bg-ink-900/30 disabled:text-paper-200"
                >
                  Buy
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {!canBuy && (
        <p className="border-t border-ink-700 px-5 py-3 text-[12px] text-rust-300">
          Buying is disabled — you don't own a warehouse in{" "}
          {CITIES[cityId].name}.
        </p>
      )}
    </ReadoutPanel>
  );
}