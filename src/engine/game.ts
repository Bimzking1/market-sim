import type {
  GameState,
  CityId,
  CommodityId,
  Vehicle,
  Warehouse,
  LedgerLine,
  Objective,
  Transaction,
  StaffId,
} from "../types";
import { ALL_CITY_IDS, CITY_COST_MULTIPLIER } from "./cities";
import { COMMODITIES } from "./commodities";
import { VEHICLES } from "./vehicles";
import {
  WAREHOUSES,
  warehouseUsedCapacity,
} from "./warehouses";
import { STAFF } from "./staff";
import {
  initCityMarket,
  simulateMarketTick,
  tryGenerateEvent,
  tickEvents,
} from "./market";
import { calcTripExpenses, travelDays, degradeVehicle } from "./travel";
import { dailyInterest, tickLoans, updateCreditRating } from "./banking";
import { spoilGoods } from "./perishable";
import { gameStartDate } from "./calendar";
import { buildScheduledEvents, toMarketEvents } from "./schedule";
import { mulberry32, randomSeed, rngRange, rngInt, rngPick } from "./rng";
import type { Loan } from "../types";

const TOTAL_DAYS = 180;
const STARTING_CASH = 10_000_000;

export function createNewGame(seed?: number): GameState {
  const actualSeed = seed ?? randomSeed();
  const rng = mulberry32(actualSeed);
  const startDate = gameStartDate();
  const scheduledEvents = buildScheduledEvents(startDate, TOTAL_DAYS);

  const cityMarkets: GameState["cityMarkets"] = {} as any;
  for (const cityId of ALL_CITY_IDS) {
    cityMarkets[cityId] = initCityMarket(cityId, rng);
  }

  const startingVehicle: Vehicle = {
    id: "vehicle_start",
    typeId: "pickup",
    name: "My Pickup",
    condition: 100,
    fuel: 100,
    mileage: 0,
  };

  const objectives: Objective[] = [
    { id: "obj_1", label: "Reach Rp50M net worth", target: "Rp50M", progress: 0, complete: false },
    { id: "obj_2", label: "Reach Rp200M net worth", target: "Rp200M", progress: 0, complete: false },
    { id: "obj_3", label: "Reach Rp500M net worth", target: "Rp500M", progress: 0, complete: false },
    { id: "obj_4", label: "Own 3 vehicles", target: "3 vehicles", progress: 0, complete: false },
    { id: "obj_5", label: "Own 2 warehouses", target: "2 warehouses", progress: 0, complete: false },
    { id: "obj_6", label: "Make Rp100M from trading", target: "Rp100M profit", progress: 0, complete: false },
    { id: "obj_7", label: "Visit all cities", target: `${ALL_CITY_IDS.length} cities`, progress: 0, complete: false },
    { id: "obj_8", label: "Finish with zero debt", target: "No debt", progress: 0, complete: false },
  ];

  return {
    seed: actualSeed,
    startDate,
    currentDay: 1,
    totalDays: TOTAL_DAYS,
    playerCash: STARTING_CASH,
    playerNetWorth: STARTING_CASH,
    creditRating: 600,
    currentCity: "bandung",
    vehicles: [startingVehicle],
    selectedVehicleId: "vehicle_start",
    warehouses: [],
    inventory: {},
    staffHires: {},
    loans: [],
    cityMarkets,
    activeEvents: [],
    scheduledEvents,
    transactions: [],
    todaysLedger: [],
    objectives,
    gameStarted: true,
    gameOver: false,
  };
}

export function calcNetWorth(state: GameState): number {
  let inventoryValue = 0;
  for (const [cid, qty] of Object.entries(state.inventory) as [CommodityId, number][]) {
    const market = state.cityMarkets[state.currentCity];
    const price = market.prices[cid] ?? COMMODITIES[cid].basePrice;
    inventoryValue += qty * price;
  }

  let warehouseValue = 0;
  for (const wh of state.warehouses) {
    const market = state.cityMarkets[wh.cityId];
    for (const [cid, qty] of Object.entries(wh.inventory) as [CommodityId, number][]) {
      const price = market.prices[cid] ?? COMMODITIES[cid].basePrice;
      warehouseValue += qty * price;
    }
  }

  let vehicleValue = 0;
  for (const v of state.vehicles) {
    const def = VEHICLES[v.typeId];
    vehicleValue += Math.round(def.price * (v.condition / 100));
  }

  let totalDebt = 0;
  for (const loan of state.loans) {
    if (loan.status !== "paid") {
      totalDebt += loan.remaining;
    }
  }

  return state.playerCash + inventoryValue + warehouseValue + vehicleValue - totalDebt;
}

export function advanceDay(state: GameState): GameState {
  const rng = mulberry32(state.seed + state.currentDay * 1000);
  const newDay = state.currentDay + 1;

  if (newDay > state.totalDays) {
    return { ...state, currentDay: newDay, gameOver: true };
  }

  const scheduledDaily = toMarketEvents(state.scheduledEvents, newDay);
  simulateMarketTick(
    state.cityMarkets,
    [...state.activeEvents, ...scheduledDaily],
    rng
  );

  let newEvents = tickEvents(state.activeEvents);
  const newEvent = tryGenerateEvent(newDay, rng);
  if (newEvent) {
    newEvents = [...newEvents, newEvent];
  }

  const interest = dailyInterest(state.loans);
  let cash = state.playerCash - interest;

  const whCosts = state.warehouses.reduce(
    (acc, wh) => {
      const def = WAREHOUSES[wh.typeId];
      const mult = CITY_COST_MULTIPLIER[wh.cityId] ?? 1;
      acc.rent += Math.round(def.rentPerDay * mult);
      acc.maintenance += Math.round(def.maintenancePerDay * mult);
      acc.security += Math.round(def.securityPerDay * mult);
      acc.electricity += Math.round(def.electricityPerDay * mult);
      acc.operations += Math.round(def.operationalPerDay * mult);
      return acc;
    },
    { rent: 0, maintenance: 0, security: 0, electricity: 0, operations: 0 }
  );
  const warehouseCost =
    whCosts.rent +
    whCosts.maintenance +
    whCosts.security +
    whCosts.electricity +
    whCosts.operations;
  cash -= warehouseCost;

  let staffCost = 0;
  const updatedStaffHires: Partial<Record<StaffId, number>> = {};
  for (const [staffId, days] of Object.entries(state.staffHires ?? {}) as [
    StaffId,
    number
  ][]) {
    const remaining = (days ?? 0) - 1;
    if (remaining <= 0) continue;
    const def = STAFF[staffId];
    staffCost += def.dailyRate;
    updatedStaffHires[staffId] = remaining;
  }
  cash -= staffCost;

  const vehicleUpkeep = state.vehicles.reduce((sum, v) => {
    const def = VEHICLES[v.typeId];
    return sum + Math.round(def.maintenanceCost * 0.1);
  }, 0);
  cash -= vehicleUpkeep;

  const newLoans = tickLoans(state.loans, newDay);
  const creditRating = updateCreditRating(state.creditRating, newLoans);

  const ledger: LedgerLine[] = [];
  if (interest > 0) ledger.push({ label: "Loan interest", amount: -interest });
  if (whCosts.rent > 0) ledger.push({ label: "Warehouse rent", amount: -whCosts.rent });
  if (whCosts.maintenance > 0) ledger.push({ label: "Warehouse maintenance", amount: -whCosts.maintenance });
  if (whCosts.security > 0) ledger.push({ label: "Warehouse security", amount: -whCosts.security });
  if (whCosts.electricity > 0) ledger.push({ label: "Warehouse electricity", amount: -whCosts.electricity });
  if (whCosts.operations > 0) ledger.push({ label: "Warehouse operations", amount: -whCosts.operations });
  if (vehicleUpkeep > 0) ledger.push({ label: "Vehicle upkeep", amount: -vehicleUpkeep });
  for (const [staffId, _days] of Object.entries(updatedStaffHires)) {
    const def = STAFF[staffId as StaffId];
    ledger.push({ label: `Staff · ${def.name}`, amount: -def.dailyRate });
  }

  const netWorth = calcNetWorth({ ...state, playerCash: cash, loans: newLoans, currentDay: newDay });

  const updatedInventory = { ...state.inventory };
  const updatedWarehouses = state.warehouses.map((wh) => ({
    ...wh,
    inventory: spoilGoods(wh.inventory, 1, 0),
  }));

  const visitedCities = new Set(state.transactions.map((t) => t.cityId));
  visitedCities.add(state.currentCity);
  const newObjectives = updateObjectives(
    state.objectives,
    netWorth,
    state.vehicles.length,
    state.warehouses.length,
    state.transactions,
    visitedCities.size,
    newLoans
  );

  return {
...state,
  currentDay: newDay,
  playerCash: cash,
  playerNetWorth: netWorth,
  creditRating,
  activeEvents: newEvents,
  loans: newLoans,
  inventory: updatedInventory,
  warehouses: updatedWarehouses,
  staffHires: updatedStaffHires,
  todaysLedger: ledger,
  objectives: newObjectives,
};
}

function updateObjectives(
  objectives: Objective[],
  netWorth: number,
  vehicleCount: number,
  warehouseCount: number,
  transactions: Transaction[],
  visitedCities: number,
  loans: Loan[]
): Objective[] {
  const totalTradingProfit = transactions.reduce((sum, t) => {
    if (t.type === "sell") return sum + t.total;
    return sum - t.total;
  }, 0);

  const totalDebt = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => sum + l.remaining, 0);

  return objectives.map((o) => {
    let progress = o.progress;
    let complete = o.complete;

    switch (o.id) {
      case "obj_1":
        progress = Math.min(1, netWorth / 50_000_000);
        complete = netWorth >= 50_000_000;
        break;
      case "obj_2":
        progress = Math.min(1, netWorth / 200_000_000);
        complete = netWorth >= 200_000_000;
        break;
      case "obj_3":
        progress = Math.min(1, netWorth / 500_000_000);
        complete = netWorth >= 500_000_000;
        break;
      case "obj_4":
        progress = Math.min(1, vehicleCount / 3);
        complete = vehicleCount >= 3;
        break;
      case "obj_5":
        progress = Math.min(1, warehouseCount / 2);
        complete = warehouseCount >= 2;
        break;
      case "obj_6":
        progress = Math.min(1, totalTradingProfit / 100_000_000);
        complete = totalTradingProfit >= 100_000_000;
        break;
      case "obj_7":
        progress = Math.min(1, visitedCities / ALL_CITY_IDS.length);
        complete = visitedCities >= ALL_CITY_IDS.length;
        break;
      case "obj_8":
        progress = totalDebt === 0 ? 1 : 0;
        complete = totalDebt === 0;
        break;
    }

    return { ...o, progress, complete };
  });
}

export function getRank(finalNetWorth: number): number {
  if (finalNetWorth >= 1_000_000_000) return 1;
  if (finalNetWorth >= 500_000_000) return 2;
  if (finalNetWorth >= 200_000_000) return 3;
  if (finalNetWorth >= 100_000_000) return 4;
  if (finalNetWorth >= 50_000_000) return 5;
  if (finalNetWorth >= 20_000_000) return 6;
  if (finalNetWorth >= 10_000_000) return 7;
  return 8;
}
