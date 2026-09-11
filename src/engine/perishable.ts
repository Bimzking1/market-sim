import type { CommodityId, InventoryLot } from "../types";
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

/**
 * Reduces purchase lots of perishable goods proportionally, the same way
 * spoilGoods reduces plain quantities.
 */
export function spoilLots(
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined,
  days: number,
  perishableProtection: number
): Partial<Record<CommodityId, InventoryLot[]>> {
  const result: Partial<Record<CommodityId, InventoryLot[]>> = {};

  for (const [cid, lotArr] of Object.entries(lots ?? {}) as [
    CommodityId,
    InventoryLot[]
  ][]) {
    const def = COMMODITIES[cid];
    if (!def.perishable || !lotArr || lotArr.length === 0) {
      result[cid] = lotArr;
      continue;
    }

    const effectiveRate = def.spoilRate * (1 - perishableProtection);
    const survived: InventoryLot[] = [];
    for (const lot of lotArr) {
      const remaining = Math.max(
        0,
        Math.round(lot.qty * Math.pow(1 - effectiveRate, days))
      );
      if (remaining > 0) survived.push({ qty: remaining, unitPrice: lot.unitPrice });
    }
    result[cid] = survived;
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
