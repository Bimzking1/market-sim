import { useMemo, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { Dropdown, type DropdownOption } from "../components/Dropdown";
import { confirmAction } from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import {
  ALL_WAREHOUSE_TYPE_IDS,
  WAREHOUSES,
  warehouseUsedCapacity,
  warehouseBuyCost,
  warehouseCapacity,
  warehouseUpgradeCost,
  warehouseCostLines,
  warehouseSlotParts,
  warehouseRefundValue,
  WAREHOUSE_MAX_UPGRADES,
  DELEGATION_FEE_RATE,
  delegationFee,
} from "../engine/warehouses";
import { COMMODITIES } from "../engine/commodities";
import { CITIES, ALL_CITY_IDS, CITY_COST_MULTIPLIER } from "../engine/cities";
import { formatFullRp } from "../utils/format";
import { formatDateForDay } from "../engine/calendar";
import type { CityId, CommodityId, WarehouseTypeId } from "../types";

const PAGE_SIZE = 10;

export function WarehousePage() {
  const warehouses = useGameStore((s) => s.warehouses);
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const currentCity = useGameStore((s) => s.currentCity);
  const playerCash = useGameStore((s) => s.playerCash);
  const startDate = useGameStore((s) => s.startDate);
  const actions = useGameStore((s) => s.actions);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const vehicleInventory = selectedVehicle?.inventory ?? {};

  const [cityFilter, setCityFilter] = useState<CityId | "all">(currentCity);
  const [search, setSearch] = useState("");
  const [goodsOpen, setGoodsOpen] = useState<Record<string, boolean>>({});
  const [goodsPage, setGoodsPage] = useState<Record<string, number>>({});

  const [buyCity, setBuyCity] = useState<CityId>(currentCity);
  const buyMult = CITY_COST_MULTIPLIER[buyCity] ?? 1;
  const buyRemote = buyCity !== currentCity;

  const cityOptions: DropdownOption[] = [
    { value: "all", label: "All cities" },
    ...ALL_CITY_IDS.map((cid) => ({
      value: cid,
      label: CITIES[cid].name,
      sublabel: `${warehouses.filter((w) => w.cityId === cid).length} owned`,
    })),
  ];

  const q = search.trim().toLowerCase();
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (cityFilter !== "all" && wh.cityId !== cityFilter) return false;
      if (!q) return true;
      const def = WAREHOUSES[wh.typeId];
      const cityName = CITIES[wh.cityId].name.toLowerCase();
      const header = `${def.name} ${cityName}`.toLowerCase();
      if (header.includes(q)) return true;
      const goodsMatch = Object.keys(wh.inventory).some((cid) =>
        COMMODITIES[cid as CommodityId].name.toLowerCase().includes(q)
      );
      return goodsMatch;
    });
  }, [warehouses, cityFilter, q]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Storage facilities</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Warehouse
        </h1>
      </header>

      <ReadoutPanel
        eyebrow={`${filteredWarehouses.length} shown`}
        title="Warehouses"
        collapsible
        defaultOpen
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-52">
            <Dropdown
              value={cityFilter}
              onChange={(v) => setCityFilter(v as CityId | "all")}
              options={cityOptions}
              searchable
            />
          </div>
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setGoodsPage({});
              }}
              placeholder="Search warehouse or goods…"
              className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-100 placeholder:text-mist-400 focus:border-brass-400 focus:outline-none"
            />
          </div>
          <span className="text-[12px] text-mist-400">
            {cityFilter === "all"
              ? "showing every warehouse"
              : `defaulting to ${CITIES[cityFilter].name}`}
          </span>
        </div>

        {filteredWarehouses.length === 0 ? (
          <div>
            <p className="text-[14px] text-mist-400 mb-2">
              {warehouses.length === 0
                ? "You don't own any warehouses yet. Buy one to store goods and wait for better prices."
                : "No warehouses match that filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWarehouses.map((wh) => {
              const globalIndex =
                warehouses.findIndex((x) => x.id === wh.id) + 1;
              const parts = warehouseSlotParts(wh, globalIndex);
              const def = WAREHOUSES[wh.typeId];
              const cityDef = CITIES[wh.cityId];
              const mult = CITY_COST_MULTIPLIER[wh.cityId] ?? 1;
              const isRemote = wh.cityId !== currentCity;
              const used = parts.used;
              const free = wh.capacity - used;
              const pct = wh.capacity > 0 ? used / wh.capacity : 0;
              const upgradeCost = warehouseUpgradeCost(def, wh.level, mult);
              const upgradeRemoteFee = isRemote ? delegationFee(upgradeCost) : 0;
              const canUpgrade =
                wh.level < WAREHOUSE_MAX_UPGRADES &&
                playerCash >= upgradeCost + upgradeRemoteFee;
              const lines = warehouseCostLines(def, mult);
              const goodsList = Object.entries(wh.inventory).filter(
                ([cid]) => (wh.inventory[cid as CommodityId] ?? 0) > 0
              );
              const totalUnits = goodsList.reduce(
                (s, [, v]) => s + (v ?? 0),
                0
              );
              const open = goodsOpen[wh.id] ?? true;
              const page = goodsPage[wh.id] ?? 0;
              const pages = Math.max(1, Math.ceil(goodsList.length / PAGE_SIZE));
              const safePage = Math.min(page, pages - 1);
              const pageItems = goodsList.slice(
                safePage * PAGE_SIZE,
                safePage * PAGE_SIZE + PAGE_SIZE
              );

              return (
                <div key={wh.id} className="border border-ink-600 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[16px] text-paper-100">
                        {parts.label}
                        {wh.level > 0 && (
                          <span className="ml-2 font-nums text-[12px] text-brass-300">
                            {parts.sublabel}
                          </span>
                        )}
                      </p>
                      <p className="text-[13px] text-mist-400">
                        {parts.sublabel} · {used.toLocaleString("en-US")}/
                        {wh.capacity.toLocaleString("en-US")} units ·{" "}
                        {free.toLocaleString("en-US")} free
                        {isRemote && (
                          <span className="ml-1 text-brass-400 text-[11px]">
                            · Remote · delegate
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="font-nums text-[12px] text-mist-300">
                      ×{mult.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 bg-ink-700">
                    <div
                      className="h-full bg-brass-400"
                      style={{ width: `${Math.min(100, pct * 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-mist-400">
                    {lines.map((l) => (
                      <span key={l.label}>
                        {l.label}:{" "}
                        <span className="font-nums text-paper-200">
                          {formatFullRp(Math.abs(l.amount))}/day
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setGoodsOpen((s) => ({ ...s, [wh.id]: !(s[wh.id] ?? true) }))
                      }
                      className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
                    >
                      {open ? "Hide goods" : "Show goods"} · {goodsList.length}{" "}
                      {goodsList.length === 1 ? "item" : "items"} ·{" "}
                      {totalUnits.toLocaleString("en-US")} units
                    </button>

                    {wh.level < WAREHOUSE_MAX_UPGRADES && (
                      <button
                        type="button"
                        disabled={!canUpgrade}
                        onClick={async () => {
                          const linesData: { label: string; value: string }[] = [
                            { label: "Upgrade cost", value: formatFullRp(upgradeCost) },
                          ];
                          if (upgradeRemoteFee > 0) {
                            linesData.push({ label: "Remote delegation fee", value: formatFullRp(upgradeRemoteFee) });
                          }
                          const ok = await confirmAction({
                            title: `Upgrade ${def.name} in ${cityDef.name}?`,
                            description: `Capacity grows from ${wh.capacity.toLocaleString("en-US")} to ${warehouseCapacity(def, wh.level + 1).toLocaleString("en-US")} units.`,
                            lines: linesData,
                            currentCash: playerCash,
                            cashChange: -(upgradeCost + upgradeRemoteFee),
                            confirmLabel: "Upgrade",
                          });
                          if (ok) actions.upgradeWarehouse(wh.id);
                        }}
                        className="border border-ink-600 px-3 py-1.5 text-[12px] text-brass-300 hover:border-brass-400 hover:bg-brass-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Upgrade to{" "}
                        {warehouseCapacity(def, wh.level + 1).toLocaleString("en-US")}{" "}
                        units · {formatFullRp(upgradeCost + upgradeRemoteFee)}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={used > 0}
                      onClick={async () => {
                        const refund = warehouseRefundValue(def, wh.level, mult);
                        const ok = await confirmAction({
                          title: `Sell ${def.name} in ${cityDef.name}?`,
                          description: `You get back 50% of the purchase price plus any upgrade spend. ${
                            used > 0 ? "Empty the warehouse of goods first." : ""
                          }`,
                          lines: [
                            { label: "Level", value: `Lv ${wh.level}` },
                            { label: "Refund value", value: `+${formatFullRp(refund)}` },
                          ],
                          currentCash: playerCash,
                          cashChange: refund,
                          confirmLabel: "Sell warehouse",
                          tone: "danger",
                        });
                        if (ok) actions.sellWarehouse(wh.id);
                      }}
                      className="border border-ink-600 px-3 py-1.5 text-[12px] text-rust-300 hover:border-rust-400 hover:bg-rust-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      title={used > 0 ? "Empty the warehouse first" : undefined}
                    >
                      Sell warehouse
                    </button>
                  </div>

                  {open && goodsList.length > 0 && (
                    <div className="mt-3 rounded-lg border border-ink-700">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-ink-800/60 text-[12px] uppercase tracking-wider text-mist-400">
                            <tr>
                              <th className="px-4 py-2 font-medium">Goods</th>
                              <th className="px-4 py-2 text-right font-medium">Qty</th>
                              <th className="px-4 py-2 text-right font-medium">Avg cost</th>
                              <th className="px-4 py-2 text-right font-medium">Freshest from</th>
                              <th className="px-4 py-2 text-right font-medium">Sell / Withdraw</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-700">
                            {pageItems.map(([cid, qty]) => {
                              const lots = (wh.lots ?? {})[cid as CommodityId] ?? [];
                              const total = lots.reduce((s, l) => s + l.qty * l.unitPrice, 0);
                              const avg =
                                (qty ?? 0) > 0 ? Math.round(total / (qty ?? 1)) : 0;
                              const freshest = [...lots].sort((a, b) => (b.day ?? 0) - (a.day ?? 0))[0];
                              return (
                                <SellRow
                                  key={cid}
                                  cid={cid as CommodityId}
                                  qty={qty ?? 0}
                                  avg={avg}
                                  cityLabel={cityDef.name}
                                  freshestLabel={
                                    freshest?.day != null
                                      ? formatDateForDay(startDate, freshest.day)
                                      : "—"
                                  }
                                  isRemote={isRemote}
                                  currentCity={currentCity}
                                  playerCash={playerCash}
                                  onSell={(sellQty) =>
                                    actions.sellCommodity(cid as CommodityId, sellQty, {
                                      type: "warehouse",
                                      id: wh.id,
                                    })
                                  }
                                  onWithdraw={() =>
                                    actions.withdrawGoods(cid as CommodityId, qty ?? 0, wh.id)
                                  }
                                />
                              );
                            })}
                          </tbody>
                          {goodsList.length > PAGE_SIZE && (
                            <tfoot className="bg-ink-800/40 text-[12px] text-mist-300">
                              <tr>
                                <td colSpan={5} className="px-4 py-2">
                                  <div className="flex items-center justify-between">
                                    <span>
                                      Page {safePage + 1} of {pages}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        disabled={safePage <= 0}
                                        onClick={() =>
                                          setGoodsPage((s) => ({ ...s, [wh.id]: safePage - 1 }))
                                        }
                                        className="border border-ink-600 px-2 py-0.5 hover:border-brass-400 hover:text-brass-300 disabled:opacity-40"
                                      >
                                        Prev
                                      </button>
                                      <button
                                        type="button"
                                        disabled={safePage >= pages - 1}
                                        onClick={() =>
                                          setGoodsPage((s) => ({ ...s, [wh.id]: safePage + 1 }))
                                        }
                                        className="border border-ink-600 px-2 py-0.5 hover:border-brass-400 hover:text-brass-300 disabled:opacity-40"
                                      >
                                        Next
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  )}

                  {open && goodsList.length === 0 && (
                    <p className="mt-3 rounded-lg border border-ink-700 px-4 py-3 text-[13px] text-mist-400">
                      Empty warehouse — buy goods into it from the Market, or
                      transfer them here from the Garage.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ReadoutPanel>

      {Object.keys(vehicleInventory).length > 0 && warehouses.length > 0 && (
        <ReadoutPanel title="Store goods" collapsible defaultOpen>
          <p className="mb-3 text-[13px] text-mist-400">
            Move goods from {selectedVehicle?.name ?? "your vehicle"} into a
            warehouse (current city, no fee — remote warehouses add a
            delegation fee per unit).
          </p>
          <StoreGoodsPanel
            warehouses={warehouses}
            inventory={vehicleInventory}
            currentCity={currentCity}
          />
        </ReadoutPanel>
      )}

      <ReadoutPanel title="Buy a warehouse" collapsible defaultOpen>
        <div className="mb-4">
          <label className="block text-[13px] text-mist-400 mb-1">
            Target city
          </label>
          <div className="max-w-md">
            <Dropdown
              value={buyCity}
              onChange={(v) => setBuyCity(v as CityId)}
              options={ALL_CITY_IDS.map((cid) => ({
                value: cid,
                label: CITIES[cid].name,
                sublabel: `cost ×${(CITY_COST_MULTIPLIER[cid] ?? 1).toFixed(1)}${
                  cid === currentCity ? " · current" : ""
                }`,
              }))}
              searchable
            />
          </div>
          {buyRemote && (
            <p className="mt-1 text-[12px] text-brass-400">
              Remote purchase adds a{" "}
              {Math.round(DELEGATION_FEE_RATE * 100)}% delegation fee on top of
              the base price.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ALL_WAREHOUSE_TYPE_IDS.map((typeId) => {
            const def = WAREHOUSES[typeId];
            const baseCost = warehouseBuyCost(def, buyMult);
            const remoteFee = buyRemote ? delegationFee(baseCost) : 0;
            const totalCost = baseCost + remoteFee;
            const canAfford = playerCash >= totalCost;
            const lines = warehouseCostLines(def, buyMult);
            return (
              <div key={typeId} className="border border-ink-600 p-4">
                <p className="font-display text-[16px] text-paper-100">
                  {def.name}
                </p>
                <p className="mt-1 font-nums text-[14px] text-brass-300">
                  {formatFullRp(totalCost)} (30 days upfront)
                </p>
                <div className="mt-3 space-y-1 text-[12px] text-mist-400">
                  <p>Capacity: {def.baseCapacity} units (upgradable)</p>
                  {remoteFee > 0 && (
                    <p className="text-brass-400">
                      Remote fee: +{formatFullRp(remoteFee)}
                    </p>
                  )}
                  {lines.map((l) => (
                    <p key={l.label}>
                      {l.label}:{" "}
                      <span className="font-nums text-paper-200">
                        {formatFullRp(Math.abs(l.amount))}/day
                      </span>
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={async () => {
                    const cityLabel = CITIES[buyCity].name;
                    const linesData: { label: string; value: string }[] = [
                      { label: "Base cost (30d)", value: formatFullRp(baseCost) },
                    ];
                    if (remoteFee > 0) {
                      linesData.push({
                        label: "Remote delegation fee",
                        value: formatFullRp(remoteFee),
                      });
                    }
                    const ok = await confirmAction({
                      title: `Buy ${def.name} in ${cityLabel}?`,
                      description: `${def.baseCapacity} units capacity · 30 days of rent paid upfront.`,
                      lines: linesData,
                      currentCash: playerCash,
                      cashChange: -totalCost,
                      confirmLabel: "Purchase",
                    });
                    if (ok) {
                      actions.buyWarehouse(typeId, buyCity);
                      toast({
                        title: `${def.name} purchased in ${cityLabel}`,
                        tone: "good",
                      });
                    }
                  }}
                  className="mt-4 w-full bg-ink-900 py-2 text-[13px] text-paper-100 transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-ink-900/30"
                >
                  Purchase
                </button>
              </div>
            );
          })}
        </div>
      </ReadoutPanel>
    </div>
  );
}

function SellRow({
  cid,
  qty,
  avg,
  cityLabel,
  freshestLabel,
  isRemote,
  currentCity,
  playerCash,
  onSell,
  onWithdraw,
}: {
  cid: CommodityId;
  qty: number;
  avg: number;
  cityLabel: string;
  freshestLabel: string;
  isRemote: boolean;
  currentCity: CityId;
  playerCash: number;
  onSell: (qty: number) => void;
  onWithdraw: () => void;
}) {
  const [sellQty, setSellQty] = useState<number>(qty);
  const def = COMMODITIES[cid];
  const effectiveQt = Math.min(qty, Math.max(1, sellQty));

  return (
    <tr className="text-[13px]">
      <td className="px-4 py-2">
        <p className="text-paper-100">
          {def.emoji} {def.name}
        </p>
        <p className="text-[11px] text-mist-500">{def.unit}</p>
      </td>
      <td className="px-4 py-2 text-right font-nums text-paper-100">
        {qty}
      </td>
      <td className="px-4 py-2 text-right font-nums text-mist-300">
        {formatFullRp(avg)}/unit
      </td>
      <td className="px-4 py-2 text-right text-mist-300 whitespace-nowrap">
        {freshestLabel}
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          <input
            type="number"
            min={1}
            max={qty}
            value={sellQty}
            onChange={(e) =>
              setSellQty(
                Math.max(1, Math.min(qty, Math.floor(Number(e.target.value) || 0)))
              )
            }
            className="w-16 border border-ink-600 bg-ink-900 px-2 py-1 font-nums text-[12px] text-paper-100 focus:border-brass-400 focus:outline-none"
          />
          <button
            type="button"
            disabled={effectiveQt <= 0}
            onClick={async () => {
              const market = useGameStore.getState().cityMarkets[currentCity];
              const price = market.prices[cid] ?? def.basePrice;
              const subtotal = effectiveQt * price;
              const marketFee = Math.round(subtotal * 0.015);
              const deleg =
                isRemote && currentCity !== undefined
                  ? delegationFee(subtotal)
                  : 0;
              const totalFee = marketFee + deleg;
              const ok = await confirmAction({
                title: `Sell ${effectiveQt} ${def.name}?`,
                description: `${def.emoji} Sold in ${cityLabel}${
                  isRemote ? " through a delegate (6%)" : ""
                } at ${formatFullRp(price)} each.`,
                lines: [
                  { label: "Subtotal", value: formatFullRp(subtotal) },
                  { label: "Market fee (1.5%)", value: `-${formatFullRp(marketFee)}` },
                  ...(deleg > 0
                    ? [{ label: "Delegation fee (6%)", value: `-${formatFullRp(deleg)}` }]
                    : []),
                ],
                currentCash: playerCash,
                cashChange: subtotal - totalFee,
                confirmLabel: "Confirm sale",
                tone: "danger",
              });
              if (!ok) return;
              onSell(effectiveQt);
              setSellQty(Math.max(1, effectiveQt));
            }}
            className="border border-ink-600 px-2 py-1 text-[12px] text-rust-300 hover:border-rust-400 hover:bg-rust-400/10 disabled:opacity-40"
          >
            Sell
          </button>
          <button
            type="button"
            onClick={async () => {
              const remoteFee = isRemote ? delegationFee(qty * 500) : 0;
              const desc = isRemote
                ? `${def.emoji} All ${qty} ${def.name} move into your vehicle via a delegate — 6% delegation fee applies.`
                : `${def.emoji} All ${qty} ${def.name} move into your vehicle (no fee — warehouse in your current city).`;
              const ok = await confirmAction({
                title: `Withdraw all ${qty} ${def.name}?`,
                description: desc,
                lines: isRemote
                  ? [{ label: "Delegation fee (6%)", value: `-${formatFullRp(remoteFee)}` }]
                  : [{ label: "Fee", value: "None (current city)" }],
                currentCash: playerCash,
                cashChange: -remoteFee,
                confirmLabel: "Withdraw all",
              });
              if (!ok) return;
              onWithdraw();
            }}
            className="border border-ink-600 px-2 py-1 text-[12px] text-brass-300 hover:border-brass-400 hover:bg-brass-400/10"
          >
            Withdraw all
          </button>
        </div>
      </td>
    </tr>
  );
}

function StoreGoodsPanel({
  warehouses,
  inventory,
  currentCity,
}: {
  warehouses: {
    id: string;
    typeId: WarehouseTypeId;
    cityId: CityId;
    level: number;
    inventory: Partial<Record<CommodityId, number>>;
    capacity: number;
  }[];
  inventory: Partial<Record<CommodityId, number>>;
  currentCity: CityId;
}) {
  const actions = useGameStore((s) => s.actions);
  const [targetWhId, setTargetWhId] = useState<string>(warehouses[0]?.id ?? "");

  const targetWh = warehouses.find((w) => w.id === targetWhId);
  const isRemote = targetWh ? targetWh.cityId !== currentCity : false;

  if (!targetWh) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-[13px] text-mist-400">Store in:</label>
        <div className="flex-1">
          <Dropdown
            value={targetWhId}
            onChange={setTargetWhId}
            options={warehouses.map((w) => {
              const idx = warehouses.findIndex((x) => x.id === w.id) + 1;
              const parts = warehouseSlotParts(w, idx);
              return {
                value: w.id,
                label: parts.label,
                sublabel: parts.sublabel,
                meta: `${parts.used} / ${w.capacity} units`,
                group:
                  w.cityId === currentCity
                    ? "This city (no fee)"
                    : "Remote (delegation 6%)",
              };
            })}
            searchable
          />
        </div>
      </div>
      {isRemote && (
        <p className="text-[12px] text-brass-400">
          Remote storage incurs a delegation fee per unit stored.
        </p>
      )}
      {Object.entries(inventory).map(([cid, qty]) => {
        const def = COMMODITIES[cid as CommodityId];
        const used = warehouseUsedCapacity(targetWh.inventory);
        const remaining = targetWh.capacity - used;
        const maxStore = Math.min(qty, remaining);
        return (
          <StoreRow
            key={cid}
            name={`${def.emoji} ${def.name}`}
            available={qty}
            maxStore={maxStore}
            isRemote={isRemote}
            onStore={(q) => actions.storeGoods(cid as CommodityId, q, targetWh.id)}
          />
        );
      })}
    </div>
  );
}

function StoreRow({
  name,
  available,
  maxStore,
  isRemote,
  onStore,
}: {
  name: string;
  available: number;
  maxStore: number;
  isRemote: boolean;
  onStore: (q: number) => void;
}) {
  const [qty, setQty] = useState(maxStore);
  const playerCash = useGameStore((s) => s.playerCash);

  const remoteFee = isRemote ? delegationFee(qty * 500) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="min-w-[120px] text-[14px] text-paper-200">{name}</span>
      <span className="text-[13px] text-mist-400">have {available}</span>
      <input
        type="number"
        min={1}
        max={maxStore}
        value={qty}
        onChange={(e) =>
          setQty(Math.max(1, Math.min(maxStore, Number(e.target.value) || 0)))
        }
        className="w-20 border border-ink-600 bg-ink-900 px-2 py-1 font-nums text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
      />
      <button
        type="button"
        disabled={
          qty <= 0 || qty > maxStore || (isRemote && remoteFee > playerCash)
        }
        onClick={async () => {
          const linesData: { label: string; value: string }[] = [];
          if (remoteFee > 0)
            linesData.push({
              label: "Remote delegation fee",
              value: formatFullRp(remoteFee),
            });
          const ok = await confirmAction({
            title: `Store ${qty} of ${name}?`,
            description:
              "Moves from your vehicle cargo into the warehouse, safe from spoilage.",
            lines:
              linesData.length > 0
                ? linesData
                : [{ label: "Available on vehicle", value: String(available) }],
            currentCash: playerCash,
            cashChange: -remoteFee,
            confirmLabel: "Store",
          });
          if (ok) onStore(qty);
        }}
        className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Store
      </button>
    </div>
  );
}