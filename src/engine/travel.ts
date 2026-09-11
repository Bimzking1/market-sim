import type { Vehicle, TripExpenses, CityId } from "../types";
import { VEHICLES } from "./vehicles";
import { getDistance, isCrossRegion } from "./cities";
import type { RNG } from "./rng";
import { rngRange, rngChance } from "./rng";

export function calcTripExpenses(
  vehicle: Vehicle,
  from: CityId,
  to: CityId,
  cargoUnits: number,
  rng: RNG
): TripExpenses {
  const def = VEHICLES[vehicle.typeId];
  const dist = getDistance(from, to);
  const ship = isCrossRegion(from, to);

  const fuelCost = ship
    ? Math.round((dist / 100) * (1 / def.fuelEfficiency) * 8_500 * 0.35 * (1 + cargoUnits * 0.001))
    : Math.round((dist / 100) * (1 / def.fuelEfficiency) * 8_500 * (1 + cargoUnits * 0.001));

  const tollCost = ship ? 0 : Math.round(dist * 200);
  const driverCost = ship
    ? Math.round(dist * 55)
    : Math.round(dist * 80);
  const loadingCost = Math.round(cargoUnits * 1_000);

  const portFee = ship ? Math.round(dist * 120) : 0;
  const maintenanceCost = Math.round(
    def.maintenanceCost * (dist / 100) * (100 / vehicle.condition)
  );

  const unexpected = rngChance(rng, 0.08)
    ? Math.round(rngRange(rng, 50_000, 300_000))
    : 0;

  const total = fuelCost + tollCost + driverCost + loadingCost + portFee + maintenanceCost + unexpected;

  return {
    fuel: fuelCost,
    toll: tollCost + portFee,
    driver: driverCost,
    loading: loadingCost,
    maintenance: maintenanceCost + unexpected,
    total,
  };
}

export function travelDays(
  vehicle: Vehicle,
  from: CityId,
  to: CityId
): number {
  const def = VEHICLES[vehicle.typeId];
  const dist = getDistance(from, to);
  const ship = isCrossRegion(from, to);
  const speedFactor = ship ? 900 : 300;
  return Math.max(1, Math.ceil(dist / (speedFactor * def.speed)));
}

export function degradeVehicle(
  vehicle: Vehicle,
  dist: number,
  rng: RNG
): { condition: number; brokeDown: boolean } {
  const def = VEHICLES[vehicle.typeId];
  const wear = dist * 0.01 * (1 / def.reliability);
  const breakdownChance = vehicle.condition < 40 ? 0.2 : vehicle.condition < 60 ? 0.08 : 0.02;
  const brokeDown = rngChance(rng, breakdownChance * (1 - def.reliability));

  let condition = vehicle.condition - wear;
  if (brokeDown) {
    condition = Math.max(condition - 15, 5);
  }
  condition = Math.max(5, Math.min(100, condition));

  return { condition, brokeDown };
}

export function repairCost(vehicle: Vehicle): number {
  const def = VEHICLES[vehicle.typeId];
  const missing = 100 - vehicle.condition;
  return Math.round(def.price * 0.003 * missing);
}
