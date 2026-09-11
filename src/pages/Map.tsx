import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { confirmAction } from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import { CITIES, ALL_CITY_IDS, getDistance } from "../engine/cities";
import { calcTripExpenses, travelDays } from "../engine/travel";
import { COMMODITIES } from "../engine/commodities";
import { formatFullRp } from "../utils/format";
import { mulberry32 } from "../engine/rng";
import type { CityId, CommodityId } from "../types";

export function Map() {
  const currentCity = useGameStore((s) => s.currentCity);
  const vehicles = useGameStore((s) => s.vehicles);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const playerCash = useGameStore((s) => s.playerCash);
  const cityMarkets = useGameStore((s) => s.cityMarkets);
  const actions = useGameStore((s) => s.actions);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const cityName = currentCity.charAt(0).toUpperCase() + currentCity.slice(1);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_CITY_IDS.filter((id) => id !== currentCity).map((cityId) => (
            <CityCard
              key={cityId}
              cityId={cityId}
              currentCity={currentCity}
              vehicle={selectedVehicle}
              cash={playerCash}
              market={cityMarkets[cityId]}
              onTravel={async () => actions.travelTo(cityId)}
            />
          ))}
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
  market,
  onTravel,
}: {
  cityId: CityId;
  currentCity: CityId;
  vehicle: any;
  cash: number;
  market: any;
  onTravel: () => void;
}) {
  const def = CITIES[cityId];
  const dist = getDistance(currentCity, cityId);
  const expenses = calcTripExpenses(vehicle, currentCity, cityId, 0, mulberry32(Date.now()));
  const days = travelDays(vehicle, currentCity, cityId);
  const canAfford = expenses.total <= cash;
  const depotOrShip = CITIES[currentCity].region !== def.region ? "Ship" : "Depot";

  const topPrices = (Object.keys(market.prices) as CommodityId[])
    .map((cid) => ({
      name: `${COMMODITIES[cid].emoji} ${COMMODITIES[cid].name}`,
      price: market.prices[cid],
    }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 3);

  const lowestPrices = (Object.keys(market.prices) as CommodityId[])
    .map((cid) => ({
      name: `${COMMODITIES[cid].emoji} ${COMMODITIES[cid].name}`,
      price: market.prices[cid],
    }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

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

      <div className="mb-3 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <p className="text-jade-400 mb-1">High prices</p>
          {topPrices.map((p) => (
            <p key={p.name} className="text-mist-300">
              {p.name}: {formatFullRp(p.price)}
            </p>
          ))}
        </div>
        <div>
          <p className="text-rust-400 mb-1">Low prices</p>
          {lowestPrices.map((p) => (
            <p key={p.name} className="text-mist-300">
              {p.name}: {formatFullRp(p.price)}
            </p>
          ))}
        </div>
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
