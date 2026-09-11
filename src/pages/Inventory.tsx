import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { COMMODITIES } from "../engine/commodities";
import { CITIES } from "../engine/cities";
import { VEHICLES } from "../engine/vehicles";
import { lotsTotal, avgLotPrice } from "../engine/lots";
import { formatFullRp } from "../utils/format";
import type { CommodityId, InventoryLot } from "../types";

interface Location {
  id: string;
  label: string;
  cityName: string;
  isVehicle: boolean;
  lots: Partial<Record<CommodityId, InventoryLot[]>>;
}

export function Inventory() {
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const inventoryLots = useGameStore((s) => s.inventoryLots);
  const warehouses = useGameStore((s) => s.warehouses);

  const vehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];
  const vehicleName = vehicle
    ? `${VEHICLES[vehicle.typeId].name} · ${vehicle.name}`
    : "Vehicle";

  const locations: Location[] = [
    {
      id: "vehicle",
      label: vehicleName,
      cityName: "on your vehicle",
      isVehicle: true,
      lots: inventoryLots,
    },
    ...warehouses.map((wh) => ({
      id: wh.id,
      label: `Warehouse · ${(CITIES[wh.cityId]?.name ?? wh.cityId)}`,
      cityName: CITIES[wh.cityId]?.name ?? wh.cityId,
      isVehicle: false,
      lots: wh.lots,
    })),
  ];

  const holdingLocationIds: string[] = [];
  for (const loc of locations) {
    const entries = Object.entries(loc.lots as Record<string, InventoryLot[]>);
    const held = entries.filter(([, lots]) => lots.reduce((s, l) => s + l.qty, 0) > 0);
    if (held.length > 0) holdingLocationIds.push(loc.id);
  }
  const hasAnyHoldings = holdingLocationIds.length > 0;

  const aggregated = new Map<CommodityId, { qty: number; cost: number }>();
  for (const loc of locations) {
    for (const [cid, lots] of Object.entries(loc.lots ?? {}) as [
      CommodityId,
      InventoryLot[]
    ][]) {
      const qty = lots.reduce((s, l) => s + l.qty, 0);
      if (qty <= 0) continue;
      const cur = aggregated.get(cid) ?? { qty: 0, cost: 0 };
      cur.qty += qty;
      cur.cost += lots.reduce((s, l) => s + l.qty * l.unitPrice, 0);
      aggregated.set(cid, cur);
    }
  }
  const aggregatedEntries = [...aggregated.entries()].sort((a, b) =>
    COMMODITIES[a[0]].name.localeCompare(COMMODITIES[b[0]].name)
  );

  const grandQty = aggregatedEntries.reduce((s, [, v]) => s + v.qty, 0);
  const grandCost = aggregatedEntries.reduce((s, [, v]) => s + v.cost, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Everything you own on hand</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Inventory
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <ReadoutPanel eyebrow="Total items claimed" title={String(aggregatedEntries.length)}>
          <p className="text-[12px] text-mist-400">distinct goods owned</p>
        </ReadoutPanel>
        <ReadoutPanel eyebrow="Units in stock" title={String(grandQty)}>
          <p className="text-[12px] text-mist-400">across vehicle & warehouses</p>
        </ReadoutPanel>
        <ReadoutPanel
          eyebrow="Total purchase value"
          title={`${formatFullRp(grandCost)}${grandQty > 0 ? `· avg ${formatFullRp(Math.round(grandCost / grandQty))}${grandQty === 1 ? "" : "/unit"}` : ""}`}
        >
          <p className="text-[12px] text-mist-400">cost basis of what you hold</p>
        </ReadoutPanel>
      </div>

      {!hasAnyHoldings && (
        <ReadoutPanel title="Nothing stored yet">
          <p className="text-[14px] text-mist-400">
            Buy goods in the Market or at your warehouses to see your lots here.
          </p>
        </ReadoutPanel>
      )}

      {aggregatedEntries.length > 0 && (
        <ReadoutPanel
          title="All owned goods"
          eyebrow="Totals across vehicle and warehouses"
        >
          <ul className="divide-y divide-ink-700">
            {aggregatedEntries.map(([cid, v]) => {
              const def = COMMODITIES[cid];
              return (
                <li key={cid} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] text-paper-100">
                      {def.emoji} {def.name}
                    </p>
                    <p className="text-[12px] text-mist-400">
                      {v.qty} {def.unit}
                      {v.qty === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-nums text-[14px] text-paper-200">
                      {formatFullRp(Math.round(v.cost / v.qty))}/unit
                    </p>
                    <p className="text-[12px] text-mist-400">
                      {formatFullRp(v.cost)} total
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </ReadoutPanel>
      )}

      {locations.map((loc) => {
        const holdings = Object.entries(loc.lots ?? {}) as [
          CommodityId,
          InventoryLot[]
        ][];
        const owned = holdings.filter(([, lots]) =>
          lots.reduce((s, l) => s + l.qty, 0) > 0
        );
        if (owned.length === 0) return null;
        return (
          <LocationCard key={loc.id} loc={loc} holdings={owned} />
        );
      })}
    </div>
  );
}

function LocationCard({
  loc,
  holdings,
}: {
  loc: Location;
  holdings: [CommodityId, InventoryLot[]][];
}) {
  return (
    <ReadoutPanel
      title={loc.label}
      eyebrow={loc.isVehicle ? "Carried cargo" : `Stored at ${loc.cityName}`}
    >
      <ul className="divide-y divide-ink-700">
        {holdings.map(([cid, lots]) => {
          const def = COMMODITIES[cid];
          const qty = lotsTotal({ [cid]: lots }, cid);
          const avg = avgLotPrice(lots);
          return (
            <li key={cid} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[14px] text-paper-100">
                  {def.emoji} {def.name}
                </p>
                <span className="font-nums text-[14px] text-paper-200">
                  {qty} {def.unit}
                  {qty === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 pl-1">
                {lots.map((lot, i) => (
                  <p key={i} className="text-[12px] text-mist-400">
                    {lot.qty} {def.unit}
                    {lot.qty === 1 ? "" : "s"} bought at {formatFullRp(lot.unitPrice)}
                  </p>
                ))}
                {avg > 0 && (
                  <p className="text-[12px] text-brass-300/80">
                    Average: {formatFullRp(Math.round(avg))} / {def.unit}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ReadoutPanel>
  );
}