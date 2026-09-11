import type { CommodityId, InventoryLot } from "../types";

export function lotsTotal(
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined,
  cid: CommodityId
): number {
  return (lots?.[cid] ?? []).reduce((s, l) => s + l.qty, 0);
}

export function avgLotPrice(lotArr: InventoryLot[] | undefined): number {
  if (!lotArr || lotArr.length === 0) return 0;
  const total = lotArr.reduce((s, l) => s + l.qty, 0);
  if (total <= 0) return 0;
  return (
    lotArr.reduce((s, l) => s + l.qty * l.unitPrice, 0) / total
  );
}

/**
 * Removes `quantity` units from a lot list FIFO (oldest bought first) and
 * returns a new lot map. Empty lots are dropped.
 */
export function consumeLots(
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined,
  cid: CommodityId,
  quantity: number
): Partial<Record<CommodityId, InventoryLot[]>> {
  const arr = [...((lots ?? {})[cid] ?? [])];
  let remaining = quantity;
  const out: InventoryLot[] = [];
  for (const lot of arr) {
    if (remaining <= 0) {
      out.push(lot);
      continue;
    }
    if (lot.qty <= remaining) {
      remaining -= lot.qty;
    } else {
      out.push({ qty: lot.qty - remaining, unitPrice: lot.unitPrice });
      remaining = 0;
    }
  }
  const result = { ...(lots ?? {}) };
  if (out.length > 0) result[cid] = out;
  else delete result[cid];
  return result;
}

/**
 * Splits `quantity` units FIFO out of a lot list, returning the moved lots
 * (with their original purchase prices) plus the reduced remainder.
 */
export function splitLots(
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined,
  cid: CommodityId,
  quantity: number
): {
  moved: InventoryLot[];
  fromRest: Partial<Record<CommodityId, InventoryLot[]>>;
} {
  const arr = [...((lots ?? {})[cid] ?? [])];
  let remaining = quantity;
  const moved: InventoryLot[] = [];
  const rest: InventoryLot[] = [];
  for (const lot of arr) {
    if (remaining <= 0) {
      rest.push(lot);
      continue;
    }
    if (lot.qty <= remaining) {
      moved.push(lot);
      remaining -= lot.qty;
    } else {
      moved.push({ qty: remaining, unitPrice: lot.unitPrice });
      rest.push({ qty: lot.qty - remaining, unitPrice: lot.unitPrice });
      remaining = 0;
    }
  }
  const fromRest = { ...(lots ?? {}) };
  if (rest.length > 0) fromRest[cid] = rest;
  else delete fromRest[cid];
  return { moved, fromRest };
}

export function addLots(
  lots: Partial<Record<CommodityId, InventoryLot[]>> | undefined,
  cid: CommodityId,
  additions: InventoryLot[]
): Partial<Record<CommodityId, InventoryLot[]>> {
  const merged = [...(lots ?? {})[cid] ?? [], ...additions].filter((l) => l.qty > 0);
  const result = { ...(lots ?? {}) };
  result[cid] = merged;
  return result;
}