import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import { CITIES, ALL_CITY_IDS, CITY_PRODUCE_MAP, getDistance } from "../engine/cities";
import { calcTripExpenses, travelDays } from "../engine/travel";
import { COMMODITIES } from "../engine/commodities";
import { formatFullRp } from "../utils/format";
import { mulberry32 } from "../engine/rng";
import type { CityId } from "../types";

export function Map() {
  const currentCity = useGameStore((s) => s.currentCity);
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const playerCash = useGameStore((s) => s.playerCash);
  const actions = useGameStore((s) => s.actions);
  const [search, setSearch] = useState("");

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const cityName = CITIES[currentCity]?.name ?? currentCity;

  const q = search.trim().toLowerCase();
  const candidates = ALL_CITY_IDS.filter((id) => id !== currentCity)
    .filter((id) => !q || CITIES[id].name.toLowerCase().includes(q))
    .sort((a, b) => CITIES[a].name.localeCompare(CITIES[b].name));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-mist-400">Current position</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          {cityName}
        </h1>
      </header>

      {!selectedVehicle ? (
        <ReadoutPanel>
          <p className="text-[14px] text-mist-300">
            You need a vehicle to travel. Visit the garage first.
          </p>
        </ReadoutPanel>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destination city…"
                className="w-full border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-100 placeholder:text-mist-400 focus:border-brass-400 focus:outline-none"
              />
            </div>
            <span className="text-[12px] text-mist-400">
              {candidates.length} {candidates.length === 1 ? "destination" : "destinations"} · sorted A–Z
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((cityId) => (
              <CityCard
                key={cityId}
                cityId={cityId}
                currentCity={currentCity}
                vehicle={selectedVehicle}
                cash={playerCash}
                onTravel={async () => actions.travelTo(cityId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CityCard({
  cityId,
  currentCity,
  vehicle,
  cash,
  onTravel,
}: {
  cityId: CityId;
  currentCity: CityId;
  vehicle: any;
  cash: number;
  onTravel: () => void;
}) {
  const def = CITIES[cityId];
  const dist = getDistance(currentCity, cityId);
  const expenses = calcTripExpenses(vehicle, currentCity, cityId, 0, mulberry32(Date.now()));
  const days = travelDays(vehicle, currentCity, cityId);
  const canAfford = expenses.total <= cash;
  const depotOrShip = CITIES[currentCity].region !== def.region ? "Ship" : "Depot";

  const produced = (CITY_PRODUCE_MAP[cityId] ?? []).map((cid) => ({
    name: `${COMMODITIES[cid].emoji} ${COMMODITIES[cid].name}`,
  }));

  const handleTravel = async () => {
    const tollLabel = depotOrShip === "Ship" ? "Port fee" : "Toll";
    const ok = await confirmAction({
      title: `Travel to ${def.name}?`,
      description: `${dist} km · about ${days} day(s) with your ${vehicle.name}, ${depotOrShip.toLowerCase()} route. Perishable cargo spoils during the trip.`,
      lines: [
        { label: "Fuel", value: `-${formatFullRp(expenses.fuel)}` },
        { label: tollLabel, value: `-${formatFullRp(expenses.toll)}` },
        { label: "Driver", value: `-${formatFullRp(expenses.driver)}` },
        { label: "Loading", value: `-${formatFullRp(expenses.loading)}` },
        { label: "Maintenance", value: `-${formatFullRp(expenses.maintenance)}` },
      ],
      currentCash: cash,
      cashChange: -expenses.total,
      confirmLabel: "Depart",
    });
    if (!ok) return;
    await onTravel();
    toast({
      title: `Arrived in ${def.name}`,
      message: `Trip took ${days} day(s), cost ${formatFullRp(expenses.total)}.`,
      tone: "good",
    });
  };

  return (
    <div className="border border-ink-700 bg-ink-800/60 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-display text-[16px] text-paper-100">{def.name}</p>
          <p className="text-[12px] text-mist-400 capitalize">{def.type} city</p>
        </div>
        <span className="font-nums text-[13px] text-mist-300">{dist} km</span>
      </div>

      <div className="mb-3 flex gap-4 text-[12px]">
        <div>
          <span className="text-mist-400">Expenses: </span>
          <span className="font-nums text-paper-200">
            {formatFullRp(expenses.total)}
          </span>
        </div>
        <div>
          <span className="text-mist-400">Days: </span>
          <span className="font-nums text-paper-200">{days}</span>
        </div>
      </div>

      <div className="mb-3 text-[12px]">
        <p className="mb-1 text-jade-400">Goods produced here</p>
        {produced.length === 0 ? (
          <p className="text-mist-500">
            A trading outpost — prices are only known once you arrive.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {produced.map((p) => (
              <span key={p.name} className="text-mist-300">
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canAfford}
        onClick={handleTravel}
        className="w-full bg-ink-900 py-2 text-[13px] text-paper-100 transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-ink-900/30"
      >
        {depotOrShip} to {def.name} · {formatFullRp(expenses.total)}
      </button>
      {!canAfford && (
        <p className="mt-1 text-center text-[11px] text-rust-400">
          Not enough cash
        </p>
      )}
    </div>
  );
}
