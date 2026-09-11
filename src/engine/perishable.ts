import type { CommodityId } from "../types";
import { COMMODITIES } from "./commodities";

export function spoilGoods(
  inventory: Partial<Record<CommodityId, number>>,
  days: number,
  perishableProtection: number
): Partial<Record<CommodityId, number>> {
  const result: Partial<Record<CommodityId, number>> = {};

  for (const [cid, qty] of Object.entries(inventory) as [CommodityId, number][]) {
    const def = COMMODITIES[cid];
    if (!def.perishable || qty <= 0) {
      result[cid] = qty;
      continue;
    }

    const effectiveRate = def.spoilRate * (1 - perishableProtection);
    const remaining = qty * Math.pow(1 - effectiveRate, days);
    result[cid] = Math.max(0, Math.round(remaining));
  }

  return result;
}

export function qualityMultiplier(
  originalQty: number,
  currentQty: number
): number {
  if (originalQty <= 0) return 0;
  return currentQty / originalQty;
}
