import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
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
  WAREHOUSE_MAX_UPGRADES,
  DELEGATION_FEE_RATE,
  delegationFee,
} from "../engine/warehouses";
import { COMMODITIES } from "../engine/commodities";
import { CITIES, ALL_CITY_IDS, CITY_COST_MULTIPLIER } from "../engine/cities";
import { formatFullRp } from "../utils/format";
import type { CityId, CommodityId } from "../types";

export function WarehousePage() {
  const warehouses = useGameStore((s) => s.warehouses);
  const inventory = useGameStore((s) => s.inventory);
  const currentCity = useGameStore((s) => s.currentCity);
  const playerCash = useGameStore((s) => s.playerCash);
  const actions = useGameStore((s) => s.actions);

  const [buyCity, setBuyCity] = useState<CityId>(currentCity);
  const buyMult = CITY_COST_MULTIPLIER[buyCity] ?? 1;
  const buyRemote = buyCity !== currentCity;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Storage facilities</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Warehouse
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReadoutPanel title="Your inventory">
          <p className="mb-3 text-[13px] text-mist-400">
            Goods you are carrying
          </p>
          {Object.keys(inventory).length === 0 ? (
            <p className="text-[14px] text-mist-400">Your inventory is empty.</p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {Object.entries(inventory).map(([cid, qty]) => {
                const def = COMMODITIES[cid as CommodityId];
                return (
                  <li
                    key={cid}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-[14px] text-paper-100">
                      {def.emoji} {def.name}
                    </p>
                      <p className="text-[12px] text-mist-400">{def.unit}</p>
                    </div>
                    <span className="font-nums text-[14px] text-paper-200">
                      {qty}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ReadoutPanel>

        <ReadoutPanel title="Warehouses">
          {warehouses.length === 0 ? (
            <div>
              <p className="text-[14px] text-mist-400 mb-4">
                You don't own any warehouses. Buy one to store goods and wait
                for better prices.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {warehouses.map((wh) => {
                const def = WAREHOUSES[wh.typeId];
                const cityDef = CITIES[wh.cityId];
                const mult = CITY_COST_MULTIPLIER[wh.cityId] ?? 1;
                const isRemote = wh.cityId !== currentCity;
                const used = warehouseUsedCapacity(wh.inventory);
                const free = wh.capacity - used;
                const pct = wh.capacity > 0 ? used / wh.capacity : 0;
                const upgradeCost = warehouseUpgradeCost(def, wh.level, mult);
                const upgradeRemoteFee = isRemote ? delegationFee(upgradeCost) : 0;
                const canUpgrade =
                  wh.level < WAREHOUSE_MAX_UPGRADES && playerCash >= (upgradeCost + upgradeRemoteFee);
                const lines = warehouseCostLines(def, mult);
                return (
                  <div key={wh.id} className="border border-ink-600 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-[16px] text-paper-100">
                          {def.name}
                          {wh.level > 0 && (
                            <span className="ml-2 font-nums text-[12px] text-brass-300">
                              +{wh.level} upgrade
                            </span>
                          )}
                        </p>
                        <p className="text-[13px] text-mist-400">
                          {cityDef.name} · {used}/{wh.capacity} units · {free} free
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
                        className="mt-3 border border-ink-600 px-3 py-1.5 text-[12px] text-brass-300 hover:border-brass-400 hover:bg-brass-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Upgrade capacity to{" "}
                        {warehouseCapacity(def, wh.level + 1).toLocaleString("en-US")}
                        {" "}units · {formatFullRp(upgradeCost + upgradeRemoteFee)}
                      </button>
                    )}

                    {Object.keys(wh.inventory).length > 0 && (
                      <div className="mt-3 divide-y divide-ink-600">
                        {Object.entries(wh.inventory).map(([cid, qty]) => {
                          const cdef = COMMODITIES[cid as CommodityId];
                          return (
                            <div
                              key={cid}
                              className="flex items-center justify-between py-2 text-[13px]"
                            >
                              <span className="text-mist-300">
                                {cdef.emoji} {cdef.name}: {qty}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const baseCost = delegationFee(qty * 500);
                                  const fee = isRemote ? baseCost : 0;
                                  const linesData: { label: string; value: string }[] = [];
                                  if (fee > 0) linesData.push({ label: "Remote delegation fee", value: formatFullRp(fee) });
                                  const ok = await confirmAction({
                                    title: `Withdraw ${qty} ${cdef.name}?`,
                                    description: `${cdef.emoji} ${cdef.name} moves from the warehouse${isRemote ? " (remote)" : ""} into your vehicle cargo.`,
                                    lines: linesData.length > 0 ? linesData : undefined,
                                    currentCash: playerCash,
                                    cashChange: -fee,
                                    confirmLabel: "Withdraw",
                                  });
                                  if (ok) actions.withdrawGoods(cid as CommodityId, qty, wh.id);
                                }}
                                className="text-brass-300 hover:text-brass-200"
                              >
                                Withdraw all
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ReadoutPanel>
      </div>

      {warehouses.length > 0 && Object.keys(inventory).length > 0 && (
        <ReadoutPanel title="Store goods">
          <StoreGoodsPanel warehouses={warehouses} inventory={inventory} currentCity={currentCity} playerCash={playerCash} />
        </ReadoutPanel>
      )}

      <ReadoutPanel title="Buy a warehouse">
        <div className="mb-4">
          <label className="block text-[13px] text-mist-400 mb-1">Target city</label>
          <select
            value={buyCity}
            onChange={(e) => setBuyCity(e.target.value as CityId)}
            className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] text-paper-100 focus:border-brass-400 focus:outline-none"
          >
            {ALL_CITY_IDS.map((cid) => (
              <option key={cid} value={cid}>
                {CITIES[cid].name} · cost ×{(CITY_COST_MULTIPLIER[cid] ?? 1).toFixed(1)}
                {cid === currentCity ? " (current)" : ""}
              </option>
            ))}
          </select>
          {buyRemote && (
            <p className="mt-1 text-[12px] text-brass-400">
              Remote purchase adds a {Math.round(DELEGATION_FEE_RATE * 100)}% delegation fee on top of the base price.
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
                    <p className="text-brass-400">Remote fee: +{formatFullRp(remoteFee)}</p>
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
                      linesData.push({ label: "Remote delegation fee", value: formatFullRp(remoteFee) });
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
                      toast({ title: `${def.name} purchased in ${cityLabel}`, tone: "good" });
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

function StoreGoodsPanel({
  warehouses,
  inventory,
  currentCity,
  playerCash,
}: {
  warehouses: { id: string; cityId: CityId; inventory: Partial<Record<CommodityId, number>>; capacity: number }[];
  inventory: Partial<Record<CommodityId, number>>;
  currentCity: CityId;
  playerCash: number;
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
        <select
          value={targetWhId}
          onChange={(e) => setTargetWhId(e.target.value)}
          className="flex-1 border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] text-paper-100 focus:border-brass-400 focus:outline-none"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {CITIES[w.cityId].name} · {WAREHOUSES[w.typeId as keyof typeof WAREHOUSES].name}
            </option>
          ))}
        </select>
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
    <div className="flex items-center gap-4">
      <span className="min-w-[120px] text-[14px] text-paper-200">{name}</span>
      <span className="text-[13px] text-mist-400">have {available}</span>
      <input
        type="number"
        min={1}
        max={maxStore}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Math.min(maxStore, Number(e.target.value) || 0)))}
        className="w-20 border border-ink-600 bg-ink-900 px-2 py-1 font-nums text-[13px] text-paper-100 focus:border-brass-400 focus:outline-none"
      />
      <button
        type="button"
        disabled={qty <= 0 || qty > maxStore || (isRemote && remoteFee > playerCash)}
        onClick={async () => {
          const linesData: { label: string; value: string }[] = [];
          if (remoteFee > 0) linesData.push({ label: "Remote delegation fee", value: formatFullRp(remoteFee) });
          const ok = await confirmAction({
            title: `Store ${qty} of ${name}?`,
            description: "Moves from your vehicle cargo into the warehouse, safe from spoilage.",
            lines: linesData.length > 0 ? linesData : [{ label: "Available on vehicle", value: String(available) }],
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
