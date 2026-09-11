import { create } from "zustand";
import type {
  GameState,
  CityId,
  CommodityId,
  LedgerLine,
  Transaction,
  StaffId,
  Warehouse,
} from "../types";
import { COMMODITIES } from "../engine/commodities";
import { VEHICLES } from "../engine/vehicles";
import {
  WAREHOUSES,
  warehouseCapacity,
  warehouseBuyCost,
  warehouseUpgradeCost,
  warehouseUsedCapacity,
  delegationFee,
} from "../engine/warehouses";
import { STAFF, staffContractCost } from "../engine/staff";
import { getDistance, CITY_COST_MULTIPLIER } from "../engine/cities";
import { calcTripExpenses, travelDays, degradeVehicle } from "../engine/travel";
import { calcPrice, applyTradeImpact } from "../engine/market";
import { createLoan, repayLoan } from "../engine/banking";
import { createNewGame, advanceDay, calcNetWorth } from "../engine/game";
import { buildScheduledEvents } from "../engine/schedule";
import { DAY_MS } from "../engine/calendar";
import { mulberry32, rngRange, rngInt } from "../engine/rng";

interface GameStore extends GameState {
  actions: {
    newGame: (seed?: number) => void;
    buyCommodity: (commodityId: CommodityId, quantity: number) => void;
    sellCommodity: (commodityId: CommodityId, quantity: number) => void;
    travelTo: (cityId: CityId) => void;
    buyVehicle: (typeId: string) => void;
    selectVehicle: (vehicleId: string) => void;
    serviceVehicle: (vehicleId: string) => void;
    buyWarehouse: (typeId: string, cityId?: CityId) => void;
    upgradeWarehouse: (warehouseId: string) => void;
    storeGoods: (commodityId: CommodityId, quantity: number, warehouseId: string) => void;
    withdrawGoods: (commodityId: CommodityId, quantity: number, warehouseId: string) => void;
    hireStaff: (staffId: StaffId) => void;
    buyNews: () => boolean;
    takeLoan: (amount: number, type: "bank" | "moneylender") => void;
    repayLoan: (loanId: string) => void;
    advanceTime: () => void;
    saveGame: () => string;
    loadGame: (json: string) => void;
    todaysLedger: () => LedgerLine[];
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createNewGame(),

  actions: {
    newGame: (seed?: number) => {
      set(createNewGame(seed));
    },

    buyCommodity: (commodityId, quantity) => {
      const state = get();
      if (state.gameOver) return;

      const market = state.cityMarkets[state.currentCity];
      const price = market.prices[commodityId] ?? COMMODITIES[commodityId].basePrice;
      const totalCost = quantity * price;
      const transport = 0;
      const fee = Math.round(totalCost * 0.015);
      const netCost = totalCost + fee;

      if (netCost > state.playerCash) return;

      const selectedVehicle = state.vehicles.find(
        (v) => v.id === state.selectedVehicleId
      );
      const vehicleDef = selectedVehicle
        ? VEHICLES[selectedVehicle.typeId]
        : null;
      const carried = Object.values(state.inventory).reduce(
        (sum, v) => sum + v,
        0
      );
      if (vehicleDef && carried + quantity > vehicleDef.capacity) return;

      const newInventory = { ...state.inventory };
      newInventory[commodityId] = (newInventory[commodityId] ?? 0) + quantity;

      applyTradeImpact(market, commodityId, quantity, true);

      const newMarket = { ...market };
      const newCityMarkets = { ...state.cityMarkets, [state.currentCity]: newMarket };

      const transaction: Transaction = {
        day: state.currentDay,
        type: "buy",
        commodityId,
        quantity,
        unitPrice: price,
        total: totalCost,
        cityId: state.currentCity,
      };

      const newCash = state.playerCash - netCost;
      const newNetWorth = calcNetWorth({ ...state, playerCash: newCash, inventory: newInventory });

      set({
        playerCash: newCash,
        inventory: newInventory,
        cityMarkets: newCityMarkets,
        transactions: [...state.transactions, transaction],
        playerNetWorth: newNetWorth,
      });
    },

    sellCommodity: (commodityId, quantity) => {
      const state = get();
      if (state.gameOver) return;

      const owned = state.inventory[commodityId] ?? 0;
      if (quantity > owned) return;

      const market = state.cityMarkets[state.currentCity];
      const price = market.prices[commodityId] ?? COMMODITIES[commodityId].basePrice;
      const totalRevenue = quantity * price;
      const transport = 0;
      const fee = Math.round(totalRevenue * 0.015);
      const netRevenue = totalRevenue - fee;

      const newInventory = { ...state.inventory };
      newInventory[commodityId] = owned - quantity;
      if (newInventory[commodityId] <= 0) delete newInventory[commodityId];

      applyTradeImpact(market, commodityId, quantity, false);

      const newMarket = { ...market };
      const newCityMarkets = { ...state.cityMarkets, [state.currentCity]: newMarket };

      const transaction: Transaction = {
        day: state.currentDay,
        type: "sell",
        commodityId,
        quantity,
        unitPrice: price,
        total: totalRevenue,
        cityId: state.currentCity,
      };

      const newCash = state.playerCash + netRevenue;
      const newNetWorth = calcNetWorth({ ...state, playerCash: newCash, inventory: newInventory });

      set({
        playerCash: newCash,
        inventory: newInventory,
        cityMarkets: newCityMarkets,
        transactions: [...state.transactions, transaction],
        playerNetWorth: newNetWorth,
      });
    },

    travelTo: (cityId) => {
      const state = get();
      if (state.gameOver || cityId === state.currentCity) return;

      const vehicle = state.vehicles.find((v) => v.id === state.selectedVehicleId);
      if (!vehicle) return;

      const expenses = calcTripExpenses(vehicle, state.currentCity, cityId, 0, mulberry32(state.seed + state.currentDay));
      const days = travelDays(vehicle, state.currentCity, cityId);

      if (expenses.total > state.playerCash) return;

      const { condition, brokeDown } = degradeVehicle(vehicle, getDistance(state.currentCity, cityId), mulberry32(state.seed + state.currentDay * 7));

      const newVehicles = state.vehicles.map((v) =>
        v.id === vehicle.id
          ? { ...v, condition, mileage: v.mileage + getDistance(state.currentCity, cityId) }
          : v
      );

      const cargoUnits = Object.values(state.inventory).reduce((s, v) => s + v, 0);
      const vehicleDef = VEHICLES[vehicle.typeId];
      const perishableProtection = vehicleDef.perishableProtection;

      const newInventory: Partial<Record<CommodityId, number>> = {};
      for (const [cid, qty] of Object.entries(state.inventory) as [CommodityId, number][]) {
        const def = COMMODITIES[cid];
        if (def.perishable && qty > 0) {
          const effectiveRate = def.spoilRate * (1 - perishableProtection);
          const survived = Math.round(qty * Math.pow(1 - effectiveRate, days));
          if (survived > 0) newInventory[cid] = survived;
        } else {
          newInventory[cid] = qty;
        }
      }

      const newCash = state.playerCash - expenses.total;

      const ledger: LedgerLine[] = [
        { label: "Fuel", amount: -expenses.fuel },
        { label: "Toll", amount: -expenses.toll },
        { label: "Driver", amount: -expenses.driver },
        { label: "Loading", amount: -expenses.loading },
        { label: "Maintenance", amount: -expenses.maintenance },
      ];

      const visitedCities = new Set(state.transactions.map((t) => t.cityId));
      visitedCities.add(cityId);

      const newNetWorth = calcNetWorth({ ...state, playerCash: newCash, inventory: newInventory, currentCity: cityId, vehicles: newVehicles });

      set({
        currentCity: cityId,
        playerCash: newCash,
        inventory: newInventory,
        vehicles: newVehicles,
        todaysLedger: ledger,
        playerNetWorth: newNetWorth,
      });

      for (let i = 0; i < days; i++) {
        get().actions.advanceTime();
      }
    },

    buyVehicle: (typeId) => {
      const state = get();
      if (state.gameOver) return;

      const def = VEHICLES[typeId as keyof typeof VEHICLES];
      if (!def || state.playerCash < def.price) return;

      const newVehicle = {
        id: `vehicle_${Date.now()}_${rngInt(mulberry32(state.seed), 0, 9999)}`,
        typeId: typeId as any,
        name: def.name,
        condition: 100,
        fuel: 100,
        mileage: 0,
      };

      set({
        playerCash: state.playerCash - def.price,
        vehicles: [...state.vehicles, newVehicle],
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - def.price }),
      });
    },

    selectVehicle: (vehicleId) => {
      set({ selectedVehicleId: vehicleId });
    },

    serviceVehicle: (vehicleId) => {
      const state = get();
      const vehicle = state.vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) return;

      const def = VEHICLES[vehicle.typeId];
      const missing = 100 - vehicle.condition;
      const cost = Math.round(def.price * 0.003 * missing);

      if (cost > state.playerCash) return;

      const newVehicles = state.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, condition: 100 } : v
      );

      set({
        playerCash: state.playerCash - cost,
        vehicles: newVehicles,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - cost, vehicles: newVehicles }),
      });
    },

    buyWarehouse: (typeId, cityId) => {
      const state = get();
      if (state.gameOver) return;

      const def = WAREHOUSES[typeId as keyof typeof WAREHOUSES];
      if (!def) return;

      const targetCity = cityId ?? state.currentCity;
      const mult = CITY_COST_MULTIPLIER[targetCity] ?? 1;
      const baseCost = warehouseBuyCost(def, mult);
      const isRemote = targetCity !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(baseCost) : 0;
      const cost = baseCost + remoteFee;
      if (cost > state.playerCash) return;

      const newWarehouse: Warehouse = {
        id: `wh_${Date.now()}_${rngInt(mulberry32(state.seed), 0, 9999)}`,
        typeId: typeId as any,
        cityId: targetCity,
        inventory: {} as Partial<Record<CommodityId, number>>,
        level: 0,
        capacity: warehouseCapacity(def, 0),
      };

      set({
        playerCash: state.playerCash - cost,
        warehouses: [...state.warehouses, newWarehouse],
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - cost }),
      });
    },

    upgradeWarehouse: (warehouseId) => {
      const state = get();
      if (state.gameOver) return;

      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh || wh.level >= 3) return;

      const def = WAREHOUSES[wh.typeId];
      const mult = CITY_COST_MULTIPLIER[wh.cityId] ?? 1;
      const baseCost = warehouseUpgradeCost(def, wh.level, mult);
      const isRemote = wh.cityId !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(baseCost) : 0;
      const cost = baseCost + remoteFee;
      if (cost > state.playerCash) return;

      const level = wh.level + 1;
      const newWarehouses = state.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, level, capacity: warehouseCapacity(def, level) }
          : w
      );

      set({
        playerCash: state.playerCash - cost,
        warehouses: newWarehouses,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - cost }),
      });
    },

    storeGoods: (commodityId, quantity, warehouseId) => {
      const state = get();
      const owned = state.inventory[commodityId] ?? 0;
      if (quantity > owned) return;

      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;

      const used = warehouseUsedCapacity(wh.inventory);
      if (used + quantity > wh.capacity) return;

      const isRemote = wh.cityId !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(quantity * 500) : 0;
      if (remoteFee > state.playerCash) return;

      const newInventory = { ...state.inventory };
      newInventory[commodityId] = owned - quantity;
      if (newInventory[commodityId] <= 0) delete newInventory[commodityId];

      const newWhInventory = { ...wh.inventory };
      newWhInventory[commodityId] = (newWhInventory[commodityId] ?? 0) + quantity;

      const newWarehouses = state.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, inventory: newWhInventory } : w
      );

      set({
        inventory: newInventory,
        warehouses: newWarehouses,
        playerCash: state.playerCash - remoteFee,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - remoteFee, inventory: newInventory }),
      });
    },

    withdrawGoods: (commodityId, quantity, warehouseId) => {
      const state = get();
      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;

      const whOwned = wh.inventory[commodityId] ?? 0;
      if (quantity > whOwned) return;

      const isRemote = wh.cityId !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(quantity * 500) : 0;
      if (remoteFee > state.playerCash) return;

      const newWhInventory = { ...wh.inventory };
      newWhInventory[commodityId] = whOwned - quantity;
      if (newWhInventory[commodityId] <= 0) delete newWhInventory[commodityId];

      const newInventory = { ...state.inventory };
      newInventory[commodityId] = (newInventory[commodityId] ?? 0) + quantity;

      const newWarehouses = state.warehouses.map((w) =>
        w.id === warehouseId ? { ...w, inventory: newWhInventory } : w
      );

      set({
        inventory: newInventory,
        warehouses: newWarehouses,
        playerCash: state.playerCash - remoteFee,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - remoteFee, inventory: newInventory }),
      });
    },

    hireStaff: (staffId) => {
      const state = get();
      if (state.gameOver) return;

      const def = STAFF[staffId];
      if (!def) return;
      if ((state.staffHires[staffId] ?? 0) > 0) return;

      const cost = staffContractCost(def);
      if (cost > state.playerCash) return;

      set({
        playerCash: state.playerCash - cost,
        staffHires: { ...state.staffHires, [staffId]: 30 },
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - cost }),
      });
    },

    buyNews: () => {
      const state = get();
      if (state.gameOver) return;
      if (state.playerCash < 1_000) return false;
      const newCash = state.playerCash - 1_000;
      set({
        playerCash: newCash,
        playerNetWorth: calcNetWorth({ ...state, playerCash: newCash }),
      });
      return true;
    },

    takeLoan: (amount, type) => {
      const state = get();
      if (state.gameOver) return;

      const loan = createLoan(type, amount, state.currentDay, 30);
      const newLoans = [...state.loans, loan];

      set({
        playerCash: state.playerCash + amount,
        loans: newLoans,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash + amount, loans: newLoans }),
      });
    },

    repayLoan: (loanId) => {
      const state = get();
      const loan = state.loans.find((l) => l.id === loanId);
      if (!loan || loan.status === "paid") return;

      const { loan: updatedLoan, paid } = repayLoan(loan, state.playerCash);
      if (paid <= 0) return;

      const newLoans = state.loans.map((l) => (l.id === loanId ? updatedLoan : l));

      set({
        playerCash: state.playerCash - paid,
        loans: newLoans,
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - paid, loans: newLoans }),
      });
    },

    advanceTime: () => {
      const state = get();
      if (state.gameOver) return;
      set(advanceDay(state));
    },

    saveGame: () => {
      const state = get();
      const save = {
        saveVersion: 2,
        gameVersion: "2.4.0",
        createdAt: new Date().toISOString(),
        gameState: {
          seed: state.seed,
          startDate: state.startDate,
          currentDay: state.currentDay,
          totalDays: state.totalDays,
          playerCash: state.playerCash,
          playerNetWorth: state.playerNetWorth,
          creditRating: state.creditRating,
          currentCity: state.currentCity,
          vehicles: state.vehicles,
          selectedVehicleId: state.selectedVehicleId,
          warehouses: state.warehouses,
          inventory: state.inventory,
          staffHires: state.staffHires,
          loans: state.loans,
          cityMarkets: state.cityMarkets,
          activeEvents: state.activeEvents,
          scheduledEvents: state.scheduledEvents,
          transactions: state.transactions,
          objectives: state.objectives,
          gameStarted: state.gameStarted,
          gameOver: state.gameOver,
        },
      };
      return JSON.stringify(save);
    },

    loadGame: (json) => {
      try {
        const save = JSON.parse(json);
        if (save.gameState) {
          const gs = save.gameState;
          const startDate =
            gs.startDate ??
            Date.now() - (gs.currentDay - 1) * DAY_MS;
          const scheduledEvents =
            gs.scheduledEvents ??
            buildScheduledEvents(startDate, gs.totalDays ?? 180);
          set({
            ...gs,
            startDate,
            scheduledEvents,
            staffHires: gs.staffHires ?? {},
            warehouses: (gs.warehouses ?? []).map((w: any) => ({
              ...w,
              level: w.level ?? 0,
              capacity:
                w.capacity ??
                WAREHOUSES[w.typeId as keyof typeof WAREHOUSES]?.baseCapacity ??
                500,
            })),
            todaysLedger: [],
          });
        }
      } catch {
        console.error("Failed to load save file");
      }
    },

    todaysLedger: () => {
      return get().todaysLedger;
    },
  },
}));
