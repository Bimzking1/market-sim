import { create } from "zustand";
import type {
  GameState,
  CityId,
  CommodityId,
  LedgerLine,
  Transaction,
  StaffId,
  Warehouse,
  InventoryLot,
  Objective,
} from "../types";
import { COMMODITIES } from "../engine/commodities";
import { VEHICLES, vehicleResaleValue } from "../engine/vehicles";
import {
  WAREHOUSES,
  warehouseCapacity,
  warehouseBuyCost,
  warehouseUpgradeCost,
  warehouseUsedCapacity,
  warehouseRefundValue,
  delegationFee,
  REMOTE_MARKET_INFO_FEE,
} from "../engine/warehouses";
import { STAFF, staffContractCost } from "../engine/staff";
import {
  getDistance,
  CITY_COST_MULTIPLIER,
  citySellsCommodity,
} from "../engine/cities";
import { calcTripExpenses, travelDays, degradeVehicle } from "../engine/travel";
import { applyTradeImpact } from "../engine/market";
import { createLoan, repayLoan } from "../engine/banking";
import {
  createNewGame,
  advanceDay,
  calcNetWorth,
  updateObjectives,
} from "../engine/game";
import { buildScheduledEvents } from "../engine/schedule";
import { spoilLots } from "../engine/perishable";
import { addLots, consumeLots, splitLots } from "../engine/lots";
import { DAY_MS } from "../engine/calendar";
import { mulberry32, rngInt } from "../engine/rng";

function refreshObjectives(state: GameState): { objectives: Objective[] } {
  const visitedCities = new Set(state.transactions.map((t) => t.cityId));
  visitedCities.add(state.currentCity);
  return {
    objectives: updateObjectives(
      state.objectives,
      state.playerNetWorth,
      state.vehicles.length,
      state.warehouses.length,
      state.transactions,
      visitedCities.size,
      state.loans
    ),
  };
}

interface GameStore extends GameState {
  actions: {
    newGame: (seed?: number) => void;
    buyCommodity: (
      commodityId: CommodityId,
      quantity: number,
      dest: { type: "vehicle" | "warehouse"; id: string }
    ) => void;
    sellCommodity: (
      commodityId: CommodityId,
      quantity: number,
      source: { type: "vehicle" | "warehouse"; id: string }
    ) => void;
    buyRemoteCommodity: (
      commodityId: CommodityId,
      quantity: number,
      cityId: CityId,
      warehouseId: string
    ) => void;
    revealRemoteMarket: (cityId: CityId) => boolean;
    travelTo: (cityId: CityId) => void;
    buyVehicle: (typeId: string) => void;
    selectVehicle: (vehicleId: string) => void;
    serviceVehicle: (vehicleId: string) => void;
    sellVehicle: (vehicleId: string) => void;
    buyWarehouse: (typeId: string, cityId?: CityId) => void;
    upgradeWarehouse: (warehouseId: string) => void;
    sellWarehouse: (warehouseId: string) => void;
    storeGoods: (commodityId: CommodityId, quantity: number, warehouseId: string) => void;
    withdrawGoods: (commodityId: CommodityId, quantity: number, warehouseId: string) => void;
    transferStock: (
      from: { type: "vehicle" | "warehouse"; id: string },
      to: { type: "vehicle" | "warehouse"; id: string },
      commodityId: CommodityId,
      quantity: number
    ) => boolean;
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

    buyCommodity: (commodityId, quantity, dest) => {
      const state = get();
      if (state.gameOver) return;
      if (!citySellsCommodity(state.currentCity, commodityId)) return;

      const market = state.cityMarkets[state.currentCity];
      const price = market.prices[commodityId] ?? COMMODITIES[commodityId].basePrice;
      const totalCost = quantity * price;
      const fee = Math.round(totalCost * 0.015);
      const netCost = totalCost + fee;
      if (netCost > state.playerCash) return;

      let vehicles = state.vehicles;
      let warehouses = state.warehouses;

      if (dest.type === "vehicle") {
        const idx = vehicles.findIndex((v) => v.id === dest.id);
        if (idx < 0) return;
        const v = vehicles[idx];
        const vehicleDef = VEHICLES[v.typeId];
        const carried = Object.values(v.inventory ?? {}).reduce(
          (sum, x) => sum + x,
          0
        );
        if (carried + quantity > vehicleDef.capacity) return;

        const newVehicleInventory = { ...(v.inventory ?? {}) };
        newVehicleInventory[commodityId] =
          (newVehicleInventory[commodityId] ?? 0) + quantity;
        const newVehicleLots = addLots(v.lots, commodityId, [
          {
            qty: quantity,
            unitPrice: price,
            cityId: state.currentCity,
            day: state.currentDay,
          },
        ]);
        vehicles = vehicles.map((vv, i) =>
          i === idx
            ? { ...vv, inventory: newVehicleInventory, lots: newVehicleLots }
            : vv
        );
      } else {
        const idx = warehouses.findIndex((w) => w.id === dest.id);
        if (idx < 0) return;
        const w = warehouses[idx];
        if (w.cityId !== state.currentCity) return;
        if (warehouseUsedCapacity(w.inventory) + quantity > w.capacity) return;

        const newWhInventory = { ...w.inventory };
        newWhInventory[commodityId] = (newWhInventory[commodityId] ?? 0) + quantity;
        const newWhLots = addLots(w.lots, commodityId, [
          {
            qty: quantity,
            unitPrice: price,
            cityId: state.currentCity,
            day: state.currentDay,
          },
        ]);
        warehouses = warehouses.map((ww, i) =>
          i === idx
            ? { ...ww, inventory: newWhInventory, lots: newWhLots }
            : ww
        );
      }

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
        delegationFee: 0,
      };

      const newCash = state.playerCash - netCost;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        vehicles,
        warehouses,
        cityMarkets: newCityMarkets,
      });

      set({
        playerCash: newCash,
        vehicles,
        warehouses,
        cityMarkets: newCityMarkets,
        transactions: [...state.transactions, transaction],
        playerNetWorth: newNetWorth,
      });
    },

    sellCommodity: (commodityId, quantity, source) => {
      const state = get();
      if (state.gameOver) return;

      let vehicles = state.vehicles;
      let warehouses = state.warehouses;
      let marketCity = state.currentCity;
      let isRemote = false;

      if (source.type === "vehicle") {
        const idx = vehicles.findIndex((v) => v.id === source.id);
        if (idx < 0) return;
        const v = vehicles[idx];
        const owned = v.inventory?.[commodityId] ?? 0;
        if (quantity > owned) return;
        if (!citySellsCommodity(state.currentCity, commodityId)) return;

        const newVehicleInventory = { ...(v.inventory ?? {}) };
        newVehicleInventory[commodityId] = owned - quantity;
        if (newVehicleInventory[commodityId] <= 0)
          delete newVehicleInventory[commodityId];
        const newVehicleLots = consumeLots(v.lots, commodityId, quantity);

        vehicles = vehicles.map((vv, i) =>
          i === idx
            ? { ...vv, inventory: newVehicleInventory, lots: newVehicleLots }
            : vv
        );
      } else {
        const idx = warehouses.findIndex((w) => w.id === source.id);
        if (idx < 0) return;
        const w = warehouses[idx];
        const owned = w.inventory[commodityId] ?? 0;
        if (quantity > owned) return;
        marketCity = w.cityId;
        isRemote = marketCity !== state.currentCity;
        if (!citySellsCommodity(marketCity, commodityId)) return;

        const newWhInventory = { ...w.inventory };
        newWhInventory[commodityId] = owned - quantity;
        if (newWhInventory[commodityId] <= 0)
          delete newWhInventory[commodityId];
        const newWhLots = consumeLots(w.lots, commodityId, quantity);

        warehouses = warehouses.map((ww, i) =>
          i === idx
            ? { ...ww, inventory: newWhInventory, lots: newWhLots }
            : ww
        );
      }

      const market = state.cityMarkets[marketCity];
      const price = market.prices[commodityId] ?? COMMODITIES[commodityId].basePrice;
      const totalRevenue = quantity * price;
      const marketFee = Math.round(totalRevenue * 0.015);
      const delegation = isRemote ? delegationFee(totalRevenue) : 0;
      const netRevenue = totalRevenue - marketFee - delegation;

      applyTradeImpact(market, commodityId, quantity, false);

      const newMarket = { ...market };
      const newCityMarkets = { ...state.cityMarkets, [marketCity]: newMarket };

      const transaction: Transaction = {
        day: state.currentDay,
        type: "sell",
        commodityId,
        quantity,
        unitPrice: price,
        total: totalRevenue,
        cityId: marketCity,
        remote: isRemote || undefined,
        delegationFee: delegation || undefined,
      };

      const newCash = state.playerCash + netRevenue;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        vehicles,
        warehouses,
        cityMarkets: newCityMarkets,
      });

      set({
        playerCash: newCash,
        vehicles,
        warehouses,
        cityMarkets: newCityMarkets,
        transactions: [...state.transactions, transaction],
        playerNetWorth: newNetWorth,
      });
    },

    buyRemoteCommodity: (commodityId, quantity, cityId, warehouseId) => {
      const state = get();
      if (state.gameOver || cityId === state.currentCity) return;
      if (!citySellsCommodity(cityId, commodityId)) return;

      const wh = state.warehouses.find(
        (w) => w.id === warehouseId && w.cityId === cityId
      );
      if (!wh) return;

      const market = state.cityMarkets[cityId];
      const price = market.prices[commodityId] ?? COMMODITIES[commodityId].basePrice;
      const subtotal = quantity * price;
      const marketFee = Math.round(subtotal * 0.015);
      const delegation = delegationFee(subtotal);
      const totalCost = subtotal + marketFee + delegation;

      if (totalCost > state.playerCash) return;

      const used = warehouseUsedCapacity(wh.inventory);
      if (used + quantity > wh.capacity) return;

      const newWhInventory = { ...wh.inventory };
      newWhInventory[commodityId] = (newWhInventory[commodityId] ?? 0) + quantity;

      const newWhLots = addLots(wh.lots, commodityId, [
        { qty: quantity, unitPrice: price, cityId, day: state.currentDay },
      ]);

      const newWarehouses = state.warehouses.map((w) =>
        w.id === wh.id
          ? { ...w, inventory: newWhInventory, lots: newWhLots }
          : w
      );

      applyTradeImpact(market, commodityId, quantity, true);

      const newMarket = { ...market };
      const newCityMarkets = { ...state.cityMarkets, [cityId]: newMarket };

      const transaction: Transaction = {
        day: state.currentDay,
        type: "buy",
        commodityId,
        quantity,
        unitPrice: price,
        total: subtotal,
        cityId,
        remote: true,
        delegationFee: delegation,
      };

      const newCash = state.playerCash - totalCost;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        warehouses: newWarehouses,
        cityMarkets: newCityMarkets,
      });

      set({
        playerCash: newCash,
        warehouses: newWarehouses,
        cityMarkets: newCityMarkets,
        transactions: [...state.transactions, transaction],
        playerNetWorth: newNetWorth,
      });
    },

    revealRemoteMarket: (cityId) => {
      const state = get();
      if (state.gameOver) return false;
      if (cityId === state.currentCity) return false;
      if (state.playerCash < REMOTE_MARKET_INFO_FEE) return false;
      const newCash = state.playerCash - REMOTE_MARKET_INFO_FEE;
      set({
        playerCash: newCash,
        playerNetWorth: calcNetWorth({ ...state, playerCash: newCash }),
      });
      return true;
    },

    travelTo: (cityId) => {
      const state = get();
      if (state.gameOver || cityId === state.currentCity) return;

      const vehicle = state.vehicles.find((v) => v.id === state.selectedVehicleId);
      if (!vehicle) return;

      const expenses = calcTripExpenses(vehicle, state.currentCity, cityId, 0, mulberry32(state.seed + state.currentDay));
      const days = travelDays(vehicle, state.currentCity, cityId);

      if (expenses.total > state.playerCash) return;

      const { condition } = degradeVehicle(vehicle, getDistance(state.currentCity, cityId), mulberry32(state.seed + state.currentDay * 7));

      const vehicleDef = VEHICLES[vehicle.typeId];
      const perishableProtection = vehicleDef.perishableProtection;

      const newVehicleInventory: Partial<Record<CommodityId, number>> = {};
      for (const [cid, qty] of Object.entries(vehicle.inventory ?? {}) as [CommodityId, number][]) {
        const def = COMMODITIES[cid];
        if (def.perishable && qty > 0) {
          const effectiveRate = def.spoilRate * (1 - perishableProtection);
          const survived = Math.round(qty * Math.pow(1 - effectiveRate, days));
          if (survived > 0) newVehicleInventory[cid] = survived;
        } else {
          newVehicleInventory[cid] = qty;
        }
      }

      const newVehicleLots = spoilLots(
        vehicle.lots,
        days,
        perishableProtection
      );

      const newVehicles = state.vehicles.map((v) =>
        v.id === vehicle.id
          ? {
              ...v,
              condition,
              mileage: v.mileage + getDistance(state.currentCity, cityId),
              inventory: newVehicleInventory,
              lots: newVehicleLots,
            }
          : v
      );

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

      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        currentCity: cityId,
        vehicles: newVehicles,
      });

      set({
        currentCity: cityId,
        playerCash: newCash,
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
        inventory: {} as Partial<Record<CommodityId, number>>,
        lots: {} as Partial<Record<CommodityId, InventoryLot[]>>,
      };

      const newVehicles = [...state.vehicles, newVehicle];
      const newCash = state.playerCash - def.price;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        vehicles: newVehicles,
      });

      set({
        playerCash: newCash,
        vehicles: newVehicles,
        selectedVehicleId: state.selectedVehicleId ?? newVehicle.id,
        playerNetWorth: newNetWorth,
        ...refreshObjectives({
          ...state,
          playerCash: newCash,
          vehicles: newVehicles,
          playerNetWorth: newNetWorth,
        }),
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

    sellVehicle: (vehicleId) => {
      const state = get();
      if (state.gameOver) return;
      if (state.vehicles.length <= 1) return;

      const idx = state.vehicles.findIndex((v) => v.id === vehicleId);
      if (idx < 0) return;
      const v = state.vehicles[idx];
      const def = VEHICLES[v.typeId as keyof typeof VEHICLES];
      if (!def) return;

      const value = vehicleResaleValue(def, v.condition, v.mileage);
      const newVehicles = state.vehicles.filter((x) => x.id !== vehicleId);
      const selectedVehicleId =
        state.selectedVehicleId === vehicleId
          ? newVehicles[0].id
          : state.selectedVehicleId;
      const newCash = state.playerCash + value;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        vehicles: newVehicles,
      });

      set({
        playerCash: newCash,
        vehicles: newVehicles,
        selectedVehicleId,
        playerNetWorth: newNetWorth,
        ...refreshObjectives({
          ...state,
          playerCash: newCash,
          vehicles: newVehicles,
          playerNetWorth: newNetWorth,
        }),
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
        lots: {} as Partial<Record<CommodityId, InventoryLot[]>>,
        level: 0,
        capacity: warehouseCapacity(def, 0),
      };

      set({
        playerCash: state.playerCash - cost,
        warehouses: [...state.warehouses, newWarehouse],
        playerNetWorth: calcNetWorth({ ...state, playerCash: state.playerCash - cost }),
        ...refreshObjectives({
          ...state,
          playerCash: state.playerCash - cost,
        }),
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
        ...refreshObjectives({
          ...state,
          playerCash: state.playerCash - cost,
          warehouses: newWarehouses,
        }),
      });
    },

    sellWarehouse: (warehouseId) => {
      const state = get();
      if (state.gameOver) return;

      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;
      const def = WAREHOUSES[wh.typeId as keyof typeof WAREHOUSES];
      if (!def) return;
      if (warehouseUsedCapacity(wh.inventory) > 0) return;

      const mult = CITY_COST_MULTIPLIER[wh.cityId] ?? 1;
      const value = warehouseRefundValue(def, wh.level, mult);
      const newWarehouses = state.warehouses.filter((w) => w.id !== warehouseId);
      const newCash = state.playerCash + value;
      const newNetWorth = calcNetWorth({
        ...state,
        playerCash: newCash,
        warehouses: newWarehouses,
      });

      set({
        playerCash: newCash,
        warehouses: newWarehouses,
        playerNetWorth: newNetWorth,
        ...refreshObjectives({
          ...state,
          playerCash: newCash,
          warehouses: newWarehouses,
          playerNetWorth: newNetWorth,
        }),
      });
    },

    storeGoods: (commodityId, quantity, warehouseId) => {
      const state = get();
      const selectedVehicle = state.vehicles.find(
        (v) => v.id === state.selectedVehicleId
      );
      if (!selectedVehicle) return;
      const owned = selectedVehicle.inventory?.[commodityId] ?? 0;
      if (quantity > owned) return;

      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;

      const used = warehouseUsedCapacity(wh.inventory);
      if (used + quantity > wh.capacity) return;

      const isRemote = wh.cityId !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(quantity * 500) : 0;
      if (remoteFee > state.playerCash) return;

      const newVehicleInventory = { ...(selectedVehicle.inventory ?? {}) };
      newVehicleInventory[commodityId] = owned - quantity;
      if (newVehicleInventory[commodityId] <= 0) delete newVehicleInventory[commodityId];

      const { moved, fromRest } = splitLots(
        selectedVehicle.lots,
        commodityId,
        quantity
      );

      const newWhInventory = { ...wh.inventory };
      newWhInventory[commodityId] = (newWhInventory[commodityId] ?? 0) + quantity;

      const newWhLots = addLots(wh.lots, commodityId, moved);

      const newVehicles = state.vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, inventory: newVehicleInventory, lots: fromRest }
          : v
      );

      const newWarehouses = state.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, inventory: newWhInventory, lots: newWhLots }
          : w
      );

      set({
        vehicles: newVehicles,
        warehouses: newWarehouses,
        playerCash: state.playerCash - remoteFee,
        playerNetWorth: calcNetWorth({
          ...state,
          playerCash: state.playerCash - remoteFee,
          vehicles: newVehicles,
          warehouses: newWarehouses,
        }),
      });
    },

    withdrawGoods: (commodityId, quantity, warehouseId) => {
      const state = get();
      const selectedVehicle = state.vehicles.find(
        (v) => v.id === state.selectedVehicleId
      );
      if (!selectedVehicle) return;

      const wh = state.warehouses.find((w) => w.id === warehouseId);
      if (!wh) return;

      const whOwned = wh.inventory[commodityId] ?? 0;
      if (quantity > whOwned) return;

      const isRemote = wh.cityId !== state.currentCity;
      const remoteFee = isRemote ? delegationFee(quantity * 500) : 0;
      if (remoteFee > state.playerCash) return;

      const vehicleDef = VEHICLES[selectedVehicle.typeId];
      const carried = Object.values(selectedVehicle.inventory ?? {}).reduce(
        (sum, v) => sum + v,
        0
      );
      if (carried + quantity > vehicleDef.capacity) return;

      const newWhInventory = { ...wh.inventory };
      newWhInventory[commodityId] = whOwned - quantity;
      if (newWhInventory[commodityId] <= 0) delete newWhInventory[commodityId];

      const { moved, fromRest } = splitLots(
        wh.lots,
        commodityId,
        quantity
      );

      const newVehicleInventory = { ...(selectedVehicle.inventory ?? {}) };
      newVehicleInventory[commodityId] =
        (newVehicleInventory[commodityId] ?? 0) + quantity;

      const newVehicleLots = addLots(selectedVehicle.lots, commodityId, moved);

      const newVehicles = state.vehicles.map((v) =>
        v.id === selectedVehicle.id
          ? { ...v, inventory: newVehicleInventory, lots: newVehicleLots }
          : v
      );

      const newWarehouses = state.warehouses.map((w) =>
        w.id === warehouseId
          ? { ...w, inventory: newWhInventory, lots: fromRest }
          : w
      );

      set({
        vehicles: newVehicles,
        warehouses: newWarehouses,
        playerCash: state.playerCash - remoteFee,
        playerNetWorth: calcNetWorth({
          ...state,
          playerCash: state.playerCash - remoteFee,
          vehicles: newVehicles,
          warehouses: newWarehouses,
        }),
      });
    },

    transferStock: (from, to, commodityId, quantity) => {
      const state = get();
      if (state.gameOver) return false;
      if (
        from.type === to.type &&
        from.id === to.id
      ) {
        return false;
      }
      if (quantity <= 0) return false;

      let source: { kind: "vehicle" | "warehouse"; data: any };
      let sourceIndex = -1;
      if (from.type === "vehicle") {
        const idx = state.vehicles.findIndex((v) => v.id === from.id);
        if (idx < 0) return false;
        source = { kind: "vehicle", data: state.vehicles[idx] };
        sourceIndex = idx;
      } else {
        const idx = state.warehouses.findIndex((w) => w.id === from.id);
        if (idx < 0) return false;
        source = { kind: "warehouse", data: state.warehouses[idx] };
        sourceIndex = idx;
      }

      const owned = source.data.inventory?.[commodityId] ?? 0;
      if (quantity > owned) return false;

      let target: { kind: "vehicle" | "warehouse"; data: any };
      let targetIndex = -1;
      if (to.type === "vehicle") {
        const idx = state.vehicles.findIndex((v) => v.id === to.id);
        if (idx < 0) return false;
        target = { kind: "vehicle", data: state.vehicles[idx] };
        targetIndex = idx;
      } else {
        const idx = state.warehouses.findIndex((w) => w.id === to.id);
        if (idx < 0) return false;
        target = { kind: "warehouse", data: state.warehouses[idx] };
        targetIndex = idx;
      }

      if (target.kind === "vehicle") {
        const def = VEHICLES[target.data.typeId as keyof typeof VEHICLES];
        const used = (
          Object.values(
            (target.data.inventory ?? {}) as Partial<Record<CommodityId, number>>
          ) as number[]
        ).reduce((sum: number, v) => sum + v, 0);
        if (used + quantity > def.capacity) return false;
      } else {
        if (warehouseUsedCapacity(target.data.inventory) + quantity > target.data.capacity) {
          return false;
        }
      }

      const sourceNewInventory = { ...(source.data.inventory ?? {}) };
      sourceNewInventory[commodityId] = owned - quantity;
      if (sourceNewInventory[commodityId] <= 0) delete sourceNewInventory[commodityId];

      const { moved, fromRest } = splitLots(source.data.lots, commodityId, quantity);

      const targetNewInventory = { ...(target.data.inventory ?? {}) };
      targetNewInventory[commodityId] =
        (targetNewInventory[commodityId] ?? 0) + quantity;

      const targetNewLots = addLots(target.data.lots, commodityId, moved);

      let vehicles = state.vehicles;
      let warehouses = state.warehouses;

      if (source.kind === "vehicle") {
        vehicles = vehicles.map((v, i) =>
          i === sourceIndex
            ? { ...v, inventory: sourceNewInventory, lots: fromRest }
            : v
        );
      } else {
        warehouses = warehouses.map((w, i) =>
          i === sourceIndex
            ? { ...w, inventory: sourceNewInventory, lots: fromRest }
            : w
        );
      }

      if (target.kind === "vehicle") {
        vehicles = vehicles.map((v, i) =>
          i === targetIndex
            ? { ...v, inventory: targetNewInventory, lots: targetNewLots }
            : v
        );
      } else {
        warehouses = warehouses.map((w, i) =>
          i === targetIndex
            ? { ...w, inventory: targetNewInventory, lots: targetNewLots }
            : w
        );
      }

      const newNetWorth = calcNetWorth({
        ...state,
        vehicles,
        warehouses,
      });

      set({ vehicles, warehouses, playerNetWorth: newNetWorth });
      return true;
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
      if (state.gameOver) return false;
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
        ...refreshObjectives({ ...state, playerCash: state.playerCash + amount, loans: newLoans }),
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
        ...refreshObjectives({ ...state, playerCash: state.playerCash - paid, loans: newLoans }),
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
        saveVersion: 8,
        gameVersion: "2.11.0",
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

          const vehicles = (gs.vehicles ?? []).map((v: any) => ({
            ...v,
            inventory: v.inventory ?? {},
            lots: v.lots ?? {},
          }));

          const fallbackSelectedId =
            vehicles[0]?.id ?? null;
          const selectedVehicleId =
            vehicles.some((v: any) => v.id === gs.selectedVehicleId)
              ? gs.selectedVehicleId
              : fallbackSelectedId;

          if (
            gs.inventory != null &&
            Object.keys(gs.inventory).length > 0 &&
            vehicles.length > 0 &&
            Object.keys(vehicles[0].inventory).length === 0
          ) {
            const targetIndex = Math.max(
              0,
              vehicles.findIndex((v: any) => v.id === gs.selectedVehicleId)
            );
            vehicles[targetIndex] = {
              ...vehicles[targetIndex],
              inventory: gs.inventory,
              lots: gs.inventoryLots ?? {},
            };
          }

          const { inventory: _ignoredInv, inventoryLots: _ignoredLots, ...rest } = gs;

          set({
            ...rest,
            startDate,
            scheduledEvents,
            staffHires: gs.staffHires ?? {},
            vehicles,
            selectedVehicleId,
            warehouses: (gs.warehouses ?? []).map((w: any) => ({
              ...w,
              level: w.level ?? 0,
              lots: w.lots ?? {},
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
