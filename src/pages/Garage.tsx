import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ArrowRightLeft } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import { ALL_VEHICLE_TYPE_IDS, VEHICLES } from "../engine/vehicles";
import { COMMODITIES } from "../engine/commodities";
import { CITIES } from "../engine/cities";
import { formatFullRp } from "../utils/format";
import { formatDateForDay } from "../engine/calendar";
import type { CityId, CommodityId, Vehicle } from "../types";

interface SourceOption {
  type: "vehicle" | "warehouse";
  id: string;
  label: string;
}

interface TransferState {
  fromKey: string;
  toKey: string;
  commodityId: CommodityId | "";
  qty: number;
}

function makeKey(type: string, id: string) {
  return `${type}:${id}`;
}

export function Garage() {
  const vehicles = useGameStore((s) => s.vehicles);
  const warehouses = useGameStore((s) => s.warehouses);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const currentCity = useGameStore((s) => s.currentCity);
  const playerCash = useGameStore((s) => s.playerCash);
  const startDate = useGameStore((s) => s.startDate);
  const actions = useGameStore((s) => s.actions);

  const [cargoOpen, setCargoOpen] = useState<Record<string, boolean>>({});
  const [transfer, setTransfer] = useState<TransferState>(() => ({
    fromKey: makeKey("vehicle", vehicles[0]?.id ?? ""),
    toKey: "",
    commodityId: "",
    qty: 0,
  }));

  const sources: SourceOption[] = [
    ...vehicles.map((v) => ({
      type: "vehicle" as const,
      id: v.id,
      label: `Vehicle · ${v.name}`,
    })),
    ...warehouses
      .filter((w) => w.cityId === currentCity)
      .map((w) => ({
        type: "warehouse" as const,
        id: w.id,
        label: `Warehouse · ${CITIES[w.cityId]?.name ?? w.cityId}`,
      })),
  ];

  const fromOption =
    sources.find((s) => makeKey(s.type, s.id) === transfer.fromKey) ?? sources[0];
  const fromKey = fromOption ? makeKey(fromOption.type, fromOption.id) : "";

  const destinationOptions = (() => {
    if (!fromOption) return [] as SourceOption[];
    if (fromOption.type === "warehouse") {
      return vehicles.map((v) => ({
        type: "vehicle" as const,
        id: v.id,
        label: `Vehicle · ${v.name}`,
      }));
    }
    return [
      ...vehicles
        .filter((v) => v.id !== fromOption.id)
        .map((v) => ({
          type: "vehicle" as const,
          id: v.id,
          label: `Vehicle · ${v.name}`,
        })),
      ...warehouses
        .filter((w) => w.cityId === currentCity)
        .map((w) => ({
          type: "warehouse" as const,
          id: w.id,
          label: `Warehouse · ${CITIES[w.cityId]?.name ?? w.cityId}`,
        })),
    ];
  })();

  const srcInventory =
    fromOption?.type === "vehicle"
      ? vehicles.find((v) => v.id === fromOption.id)?.inventory
      : warehouses.find((w) => w.id === fromOption.id)?.inventory;

  const cargoOptions = (Object.entries(srcInventory ?? {}) as [
    CommodityId,
    number
  ][]).filter(([, q]) => q > 0);

  const selectedCommodity =
    cargoOptions.find(([c]) => c === transfer.commodityId) ?? cargoOptions[0];
  const maxQty = selectedCommodity ? selectedCommodity[1] : 0;
  const toOption = destinationOptions.find(
    (d) => makeKey(d.type, d.id) === transfer.toKey
  );

  useEffect(() => {
    const validFrom = sources.some(
      (s) => makeKey(s.type, s.id) === transfer.fromKey
    );
    if (!validFrom) {
      setTransfer((t) => ({ ...t, fromKey: sources[0] ? makeKey(sources[0].type, sources[0].id) : "" }));
    }
  }, [vehicles, warehouses, currentCity]);

  useEffect(() => {
    const firstFrom = makeKey(fromOption?.type ?? "vehicle", fromOption?.id ?? "");
    const toOptions = destinationOptions;
    setTransfer((t) => {
      const toStillValid = toOptions.some(
        (d) => makeKey(d.type, d.id) === t.toKey
      );
      return {
        ...t,
        fromKey: firstFrom,
        toKey: toStillValid ? t.toKey : toOptions[0] ? makeKey(toOptions[0].type, toOptions[0].id) : "",
        commodityId: "",
        qty: 0,
      };
    });
  }, [fromKey]);

  const canTransfer =
    Boolean(fromOption) &&
    Boolean(toOption) &&
    Boolean(selectedCommodity) &&
    transfer.qty > 0 &&
    transfer.qty <= maxQty;

  const handleTransfer = () => {
    if (!fromOption || !toOption || transfer.qty <= 0 || transfer.qty > maxQty) return;
    const ok = actions.transferStock(
      { type: fromOption.type, id: fromOption.id },
      { type: toOption.type, id: toOption.id },
      selectedCommodity[0],
      transfer.qty
    );
    if (ok) {
      toast({
        title: "Cargo transferred",
        message: `${transfer.qty} ${COMMODITIES[selectedCommodity[0]].unit} moved to ${toOption.label}.`,
        tone: "good",
      });
      setTransfer((t) => ({ ...t, qty: 0 }));
    } else {
      toast({
        title: "Transfer failed",
        message: "Destination does not have enough space.",
        tone: "bad",
      });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Your fleet</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Garage
        </h1>
      </header>

      <ReadoutPanel title="Owned vehicles" eyebrow="Cargo and upkeep">
        {vehicles.length === 0 ? (
          <p className="text-[14px] text-mist-400">
            You don't own any vehicles yet.
          </p>
        ) : (
          <div className="space-y-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                isSelected={v.id === selectedVehicleId}
                startDate={startDate}
                open={cargoOpen[v.id] ?? false}
                onToggleCargo={() =>
                  setCargoOpen((s) => ({ ...s, [v.id]: !(s[v.id] ?? false) }))
                }
                actions={actions}
                playerCash={playerCash}
              />
            ))}
          </div>
        )}
      </ReadoutPanel>

      <ReadoutPanel title="Transfer cargo" eyebrow="Vehicle ⇄ vehicle · vehicle ⇄ warehouse (current city)">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] text-mist-400">From</label>
            <select
              value={fromKey}
              onChange={(e) =>
                setTransfer((t) => ({ ...t, fromKey: e.target.value, toKey: "", qty: 0 }))
              }
              className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] text-paper-100 focus:border-brass-400 focus:outline-none"
            >
              {sources.map((s) => (
                <option key={makeKey(s.type, s.id)} value={makeKey(s.type, s.id)}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-mist-400">To</label>
            <select
              value={transfer.toKey}
              onChange={(e) =>
                setTransfer((t) => ({ ...t, toKey: e.target.value }))
              }
              className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] text-paper-100 focus:border-brass-400 focus:outline-none"
            >
              {destinationOptions.length === 0 && (
                <option value="">No targets</option>
              )}
              {destinationOptions.map((d) => (
                <option key={makeKey(d.type, d.id)} value={makeKey(d.type, d.id)}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-mist-400">Item</label>
            <select
              value={selectedCommodity ? selectedCommodity[0] : ""}
              onChange={(e) =>
                setTransfer((t) => ({
                  ...t,
                  commodityId: e.target.value as CommodityId | "",
                  qty: 0,
                }))
              }
              className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] text-paper-100 focus:border-brass-400 focus:outline-none"
            >
              {cargoOptions.length === 0 && <option value="">No cargo here</option>}
              {cargoOptions.map(([cid, q]) => (
                <option key={cid} value={cid}>
                  {COMMODITIES[cid].emoji} {COMMODITIES[cid].name} · {q} available
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-mist-400">
              Quantity (max {maxQty})
            </label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={transfer.qty || ""}
              onChange={(e) =>
                setTransfer((t) => ({
                  ...t,
                  qty: Math.max(0, Math.floor(Number(e.target.value))),
                }))
              }
              className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[14px] font-nums text-paper-100 focus:border-brass-400 focus:outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={!canTransfer}
          onClick={handleTransfer}
          className="mt-4 inline-flex items-center gap-2 bg-ink-900 px-4 py-2 text-[13px] text-paper-100 transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-ink-900/30"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer
        </button>
        {fromOption && fromOption.type === "warehouse" && (
          <p className="mt-2 text-[12px] text-brass-400">
            Warehouse transfers only reach vehicles you own (this city's warehouses only).
          </p>
        )}
      </ReadoutPanel>

      <ReadoutPanel title="Buy a vehicle">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_VEHICLE_TYPE_IDS.map((typeId) => {
            const def = VEHICLES[typeId];
            const canAfford = playerCash >= def.price;
            return (
              <div key={typeId} className="border border-ink-600 p-4">
                <p className="font-display text-[16px] text-paper-100">
                  {def.name}
                </p>
                <p className="mt-1 font-nums text-[14px] text-brass-300">
                  {formatFullRp(def.price)}
                </p>
                <div className="mt-3 space-y-1 text-[12px] text-mist-400">
                  <p>Capacity: {def.capacity} units</p>
                  <p>Reliability: {Math.round(def.reliability * 100)}%</p>
                  <p>
                    Maintenance: {formatFullRp(def.maintenanceCost)}/day
                  </p>
                  {def.perishableProtection > 0 && (
                    <p className="text-jade-400">
                      Perishable protection:{" "}
                      {Math.round(def.perishableProtection * 100)}%
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: `Purchase ${def.name}?`,
                      description: `Capacity ${def.capacity} units · ${formatFullRp(def.maintenanceCost)}/day upkeep.`,
                      lines: [
                        { label: "Reliability", value: `${Math.round(def.reliability * 100)}%` },
                        ...(def.perishableProtection > 0
                          ? [{ label: "Perishable protection", value: `${Math.round(def.perishableProtection * 100)}%` }]
                          : []),
                      ],
                      currentCash: playerCash,
                      cashChange: -def.price,
                      confirmLabel: "Purchase",
                    });
                    if (ok) actions.buyVehicle(typeId);
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

function VehicleCard({
  vehicle,
  isSelected,
  startDate,
  open,
  onToggleCargo,
  actions,
  playerCash,
}: {
  vehicle: Vehicle;
  isSelected: boolean;
  startDate: number;
  open: boolean;
  onToggleCargo: () => void;
  actions: any;
  playerCash: number;
}) {
  const v = vehicle;
  const def = VEHICLES[v.typeId];
  const cargo = (Object.entries(v.inventory ?? {}) as [CommodityId, number][]).filter(
    ([, q]) => q > 0
  );
  const used = cargo.reduce((s, [, q]) => s + q, 0);

  return (
    <div
      className={`border p-4 ${
        isSelected ? "border-brass-400 bg-brass-400/5" : "border-ink-600"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-[16px] text-paper-100">{v.name}</p>
          <p className="text-[13px] text-mist-400">{def.name}</p>
        </div>
        <div className="flex gap-2">
          {!isSelected && (
            <button
              type="button"
              onClick={() => actions.selectVehicle(v.id)}
              className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
            >
              Select
            </button>
          )}
          {isSelected && (
            <span className="border border-brass-400 px-3 py-1.5 text-[12px] text-brass-300">
              Active
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-3">
        <div>
          <p className="text-mist-400">Condition</p>
          <div className="mt-1 h-2 bg-ink-700">
            <div
              className={`h-full ${
                v.condition > 70
                  ? "bg-jade-400"
                  : v.condition > 40
                  ? "bg-brass-400"
                  : "bg-rust-400"
              }`}
              style={{ width: `${v.condition}%` }}
            />
          </div>
          <p className="mt-1 font-nums text-paper-200">{Math.round(v.condition)}%</p>
        </div>
        <div>
          <p className="text-mist-400">Cargo</p>
          <p className="mt-1 font-nums text-paper-200">
            {used} / {def.capacity} units
          </p>
          <div className="mt-1 h-2 bg-ink-700">
            <div
              className="h-full bg-jade-400/80"
              style={{ width: `${Math.min(100, (used / def.capacity) * 100)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-mist-400">Mileage</p>
          <p className="mt-1 font-nums text-paper-200">{v.mileage.toLocaleString()} km</p>
        </div>
      </div>

      <div className="mt-3 border-t border-ink-600 pt-3">
        <button
          type="button"
          onClick={onToggleCargo}
          className="inline-flex items-center gap-1.5 text-[13px] text-mist-300 hover:text-brass-300"
        >
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {cargo.length === 0
            ? "Empty cargo"
            : `${cargo.length} ${cargo.length === 1 ? "item" : "items"} · ${used} units`}
        </button>

        {open && cargo.length > 0 && (
          <div className="mt-2 space-y-2">
            {cargo.map(([cid]) => {
              const cdef = COMMODITIES[cid];
              const lots = ((v.lots ?? {})[cid] ?? []) as { qty: number; unitPrice: number; cityId?: CityId; day?: number }[];
              const qty = lots.reduce((s, l) => s + l.qty, 0);
              return (
                <div key={cid} className="border border-ink-700 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-paper-100">
                      {cdef.emoji} {cdef.name}
                    </p>
                    <span className="font-nums text-[13px] text-paper-200">
                      {qty} {cdef.unit}
                      {qty === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-1 pl-1">
                    {lots.map((lot, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-[12px]"
                      >
                        <span className="font-nums text-mist-400">
                          {lot.qty} {cdef.unit}
                          {lot.qty === 1 ? "" : "s"} at{" "}
                          {formatFullRp(lot.unitPrice)}
                        </span>
                        <span className="text-mist-500 whitespace-nowrap">
                          {lot.cityId
                            ? (CITIES[lot.cityId]?.name ?? lot.cityId)
                            : "—"}{" "}
                          ·{" "}
                          {lot.day != null
                            ? formatDateForDay(startDate, lot.day)
                            : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {v.condition < 100 && (
        <div className="mt-3 flex items-center justify-between border-t border-ink-600 pt-3">
          <span className="text-[13px] text-mist-400">
            Service to 100%: {formatFullRp(Math.round(def.price * 0.003 * (100 - v.condition)))}
          </span>
          <button
            type="button"
            onClick={async () => {
              const cost = Math.round(def.price * 0.003 * (100 - v.condition));
              const ok = await confirmAction({
                title: `Service ${v.name}?`,
                description: `Restores condition from ${Math.round(v.condition)}% to 100%.`,
                currentCash: playerCash,
                cashChange: -cost,
                confirmLabel: "Service now",
              });
              if (ok) actions.serviceVehicle(v.id);
            }}
            disabled={playerCash < Math.round(def.price * 0.003 * (100 - v.condition))}
            className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Service now
          </button>
        </div>
      )}
    </div>
  );
}