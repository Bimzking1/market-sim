import type { WarehouseDef, WarehouseTypeId, LedgerLine } from "../types";

export const WAREHOUSES: Record<WarehouseTypeId, WarehouseDef> = {
  small: {
    id: "small",
    name: "Small Warehouse",
    baseCapacity: 500,
    rentPerDay: 60_000,
    maintenancePerDay: 15_000,
    securityPerDay: 15_000,
    electricityPerDay: 6_000,
    operationalPerDay: 4_000,
  },
  medium: {
    id: "medium",
    name: "Medium Warehouse",
    baseCapacity: 2_000,
    rentPerDay: 240_000,
    maintenancePerDay: 60_000,
    securityPerDay: 50_000,
    electricityPerDay: 30_000,
    operationalPerDay: 20_000,
  },
  large: {
    id: "large",
    name: "Large Warehouse",
    baseCapacity: 10_000,
    rentPerDay: 1_100_000,
    maintenancePerDay: 250_000,
    securityPerDay: 200_000,
    electricityPerDay: 130_000,
    operationalPerDay: 120_000,
  },
};

export const ALL_WAREHOUSE_TYPE_IDS = Object.keys(WAREHOUSES) as WarehouseTypeId[];

export const WAREHOUSE_BUY_DAYS = 30;
export const WAREHOUSE_MAX_UPGRADES = 3;
export const WAREHOUSE_UPGRADE_FACTOR = 0.25;
export const WAREHOUSE_UPGRADE_COST_PER_UNIT = 800;
export const DELEGATION_FEE_RATE = 0.06;

export function warehouseUsedCapacity(
  inventory: Partial<Record<string, number>>
): number {
  return Object.values(inventory).reduce((sum, v) => sum + (v ?? 0), 0);
}

export function warehouseCapacity(
  def: WarehouseDef,
  level: number
): number {
  return Math.round(def.baseCapacity * (1 + WAREHOUSE_UPGRADE_FACTOR * level));
}

export function warehouseBuyCost(def: WarehouseDef, cityMultiplier: number = 1): number {
  return Math.round(def.rentPerDay * WAREHOUSE_BUY_DAYS * cityMultiplier);
}

export function warehouseUpgradeCost(def: WarehouseDef, level: number, cityMultiplier: number = 1): number {
  const current = warehouseCapacity(def, level);
  const next = warehouseCapacity(def, level + 1);
  return Math.round((next - current) * WAREHOUSE_UPGRADE_COST_PER_UNIT * cityMultiplier);
}

export function warehouseDailyCost(def: WarehouseDef, cityMultiplier: number = 1): number {
  return Math.round((
    def.rentPerDay +
    def.maintenancePerDay +
    def.securityPerDay +
    def.electricityPerDay +
    def.operationalPerDay
  ) * cityMultiplier);
}

export function delegationFee(cost: number): number {
  return Math.round(cost * DELEGATION_FEE_RATE);
}

export function warehouseCostLines(def: WarehouseDef, cityMultiplier: number = 1): LedgerLine[] {
  return [
    { label: "Rent", amount: -Math.round(def.rentPerDay * cityMultiplier) },
    { label: "Maintenance", amount: -Math.round(def.maintenancePerDay * cityMultiplier) },
    { label: "Security", amount: -Math.round(def.securityPerDay * cityMultiplier) },
    { label: "Electricity", amount: -Math.round(def.electricityPerDay * cityMultiplier) },
    { label: "Operations", amount: -Math.round(def.operationalPerDay * cityMultiplier) },
  ];
}