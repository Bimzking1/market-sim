import type { StaffDef, StaffId } from "../types";

export const STAFF: Record<StaffId, StaffDef> = {
  analyst: {
    id: "analyst",
    name: "Market Analyst",
    role: "Price forecasting",
    description:
      "Projects commodity prices days ahead using econometric models of supply and demand.",
    dailyRate: 150_000,
  },
  cargoManager: {
    id: "cargoManager",
    name: "Govt. Cargo Manager",
    role: "Cargo & city intel",
    description:
      "Leaks shipment schedules and city-level pricing, revealing the best cities to buy and sell.",
    dailyRate: 200_000,
  },
  broker: {
    id: "broker",
    name: "Trade Insider",
    role: "Market rumors",
    description:
      "A well-connected broker who tips you off about trending goods and hidden demand.",
    dailyRate: 100_000,
  },
};

export const ALL_STAFF_IDS = Object.keys(STAFF) as StaffId[];

export const STAFF_CONTRACT_DAYS = 30;

export function staffContractCost(def: StaffDef): number {
  return def.dailyRate * STAFF_CONTRACT_DAYS;
}