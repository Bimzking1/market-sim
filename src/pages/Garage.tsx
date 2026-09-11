import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { ALL_VEHICLE_TYPE_IDS, VEHICLES } from "../engine/vehicles";
import { formatFullRp } from "../utils/format";

export function Garage() {
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const playerCash = useGameStore((s) => s.playerCash);
  const actions = useGameStore((s) => s.actions);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Your fleet</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Garage
        </h1>
      </header>

      <ReadoutPanel title="Owned vehicles">
        {vehicles.length === 0 ? (
          <p className="text-[14px] text-mist-400">
            You don't own any vehicles yet.
          </p>
        ) : (
          <div className="space-y-4">
            {vehicles.map((v) => {
              const def = VEHICLES[v.typeId];
              const isSelected = v.id === selectedVehicleId;
              return (
                <div
                  key={v.id}
                  className={`border p-4 ${
                    isSelected
                      ? "border-brass-400 bg-brass-400/5"
                      : "border-ink-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-[16px] text-paper-100">
                        {v.name}
                      </p>
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

                  <div className="mt-3 grid grid-cols-3 gap-4 text-[13px]">
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
                      <p className="mt-1 font-nums text-paper-200">
                        {Math.round(v.condition)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-mist-400">Capacity</p>
                      <p className="mt-1 font-nums text-paper-200">
                        {def.capacity} units
                      </p>
                    </div>
                    <div>
                      <p className="text-mist-400">Mileage</p>
                      <p className="mt-1 font-nums text-paper-200">
                        {v.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>

                  {v.condition < 100 && (
                    <div className="mt-3 flex items-center justify-between border-t border-ink-600 pt-3">
                      <span className="text-[13px] text-mist-400">
                        Service to 100%:{" "}
                        {formatFullRp(
                          Math.round(def.price * 0.003 * (100 - v.condition))
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const cost = Math.round(
                            def.price * 0.003 * (100 - v.condition)
                          );
                          const ok = await confirmAction({
                            title: `Service ${v.name}?`,
                            description: `Restores condition from ${Math.round(v.condition)}% to 100%.`,
                            currentCash: playerCash,
                            cashChange: -cost,
                            confirmLabel: "Service now",
                          });
                          if (ok) actions.serviceVehicle(v.id);
                        }}
                        disabled={
                          playerCash <
                          Math.round(def.price * 0.003 * (100 - v.condition))
                        }
                        className="border border-ink-600 px-3 py-1.5 text-[12px] text-mist-300 hover:border-brass-400 hover:text-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Service now
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
