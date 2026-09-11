import type {
  CommodityId,
  CityId,
  MarketEvent,
  ScheduledEvent,
  ScheduledEventKind,
} from "../types";
import { COMMODITIES } from "./commodities";
import { CITIES } from "./cities";
import { startOfDay, dayOffset, dateForDay } from "./calendar";

interface ScheduleDef {
  id: string;
  name: string;
  kind: ScheduledEventKind;
  commodity: CommodityId;
  city: CityId;
  month: number;
  day: number;
  lengthDays: number;
  leadDays: number;
  supplyModifier: number;
  demandModifier: number;
}

const SCHEDULE: ScheduleDef[] = [
  {
    id: "cal_wet_coffee",
    name: "Wet-Season Coffee Losses",
    kind: "surge",
    commodity: "coffee",
    city: "bandung",
    month: 11,
    day: 15,
    lengthDays: 12,
    leadDays: 15,
    supplyModifier: -0.2,
    demandModifier: 0.3,
  },
  {
    id: "cal_deepavali",
    name: "Deepavali Sweet & Silk Rally",
    kind: "surge",
    commodity: "silk",
    city: "medan",
    month: 11,
    day: 5,
    lengthDays: 4,
    leadDays: 20,
    supplyModifier: 0,
    demandModifier: 0.4,
  },
  {
    id: "cal_christmas_sugar",
    name: "Christmas Sweet Rush",
    kind: "surge",
    commodity: "sugar",
    city: "surabaya",
    month: 12,
    day: 20,
    lengthDays: 8,
    leadDays: 21,
    supplyModifier: 0,
    demandModifier: 0.35,
  },
  {
    id: "cal_yearend_electronics",
    name: "Year-End Sales Surge",
    kind: "surge",
    commodity: "electronics",
    city: "jakarta",
    month: 12,
    day: 26,
    lengthDays: 6,
    leadDays: 18,
    supplyModifier: 0,
    demandModifier: 0.4,
  },
  {
    id: "cal_sugar_glut",
    name: "Sugar Import Glut",
    kind: "drop",
    commodity: "sugar",
    city: "bandung",
    month: 1,
    day: 5,
    lengthDays: 15,
    leadDays: 14,
    supplyModifier: 0.4,
    demandModifier: 0,
  },
  {
    id: "cal_nutmeg_auction",
    name: "Nutmeg Monopoly Auction",
    kind: "surge",
    commodity: "nutmeg",
    city: "ambon",
    month: 1,
    day: 10,
    lengthDays: 15,
    leadDays: 28,
    supplyModifier: -0.25,
    demandModifier: 0.35,
  },
  {
    id: "cal_cny_closure",
    name: "Lunar New Year Closures",
    kind: "banned",
    commodity: "rice",
    city: "pontianak",
    month: 2,
    day: 5,
    lengthDays: 3,
    leadDays: 30,
    supplyModifier: -0.9,
    demandModifier: 0,
  },
  {
    id: "cal_lebaran_batik",
    name: "Lebaran Batik Rush",
    kind: "surge",
    commodity: "batik",
    city: "yogyakarta",
    month: 2,
    day: 8,
    lengthDays: 5,
    leadDays: 26,
    supplyModifier: 0,
    demandModifier: 0.45,
  },
  {
    id: "cal_batik_freeze",
    name: "Batik Quota Freeze",
    kind: "banned",
    commodity: "batik",
    city: "yogyakarta",
    month: 2,
    day: 20,
    lengthDays: 6,
    leadDays: 30,
    supplyModifier: -0.9,
    demandModifier: 0,
  },
  {
    id: "cal_silk_ban",
    name: "Silk Export Ban",
    kind: "banned",
    commodity: "silk",
    city: "makassar",
    month: 2,
    day: 20,
    lengthDays: 6,
    leadDays: 30,
    supplyModifier: -0.9,
    demandModifier: 0,
  },
  {
    id: "cal_harvest_tide",
    name: "Harvest Tide",
    kind: "drop",
    commodity: "rice",
    city: "makassar",
    month: 3,
    day: 1,
    lengthDays: 20,
    leadDays: 21,
    supplyModifier: 0.45,
    demandModifier: 0,
  },
  {
    id: "cal_nyepi_silence",
    name: "Nyepi Silence",
    kind: "banned",
    commodity: "jewelry",
    city: "denpasar",
    month: 3,
    day: 8,
    lengthDays: 1,
    leadDays: 28,
    supplyModifier: -0.9,
    demandModifier: 0,
  },
  {
    id: "cal_rubber_peak",
    name: "Rubber Tapping Peak",
    kind: "drop",
    commodity: "rubber",
    city: "palembang",
    month: 9,
    day: 1,
    lengthDays: 25,
    leadDays: 20,
    supplyModifier: 0.4,
    demandModifier: 0,
  },
  {
    id: "cal_ramadan_rice",
    name: "Ramadan Rice Rush",
    kind: "surge",
    commodity: "rice",
    city: "medan",
    month: 4,
    day: 10,
    lengthDays: 14,
    leadDays: 24,
    supplyModifier: 0,
    demandModifier: 0.5,
  },
];

function resolveOccurrence(
  month: number,
  day: number,
  startDate: number
): Date | null {
  const start = startOfDay(new Date(startDate));
  for (let year = start.getFullYear(); year <= start.getFullYear() + 1; year++) {
    const d = startOfDay(new Date(year, month - 1, day));
    if (d.getTime() >= start.getTime()) return d;
  }
  return null;
}

export function buildScheduledEvents(
  startDate: number,
  totalDays: number
): ScheduledEvent[] {
  const out: ScheduledEvent[] = [];
  for (const def of SCHEDULE) {
    const start = resolveOccurrence(def.month, def.day, startDate);
    if (!start) continue;

    const startOffset = dayOffset(startDate, start);
    if (startOffset >= totalDays) continue;

    const startDay = startOffset + 1;
    const endDay = startDay + def.lengthDays - 1;

    out.push({
      id: def.id,
      name: def.name,
      kind: def.kind,
      commodityId: def.commodity,
      cityId: def.city,
      startDay,
      endDay,
      startDateISO: dateForDay(startDate, startDay).toISOString(),
      endDateISO: dateForDay(startDate, endDay).toISOString(),
      leadDays: def.leadDays,
      supplyModifier: def.supplyModifier,
      demandModifier: def.demandModifier,
    });
  }
  return out;
}

export function activeScheduledForDay(
  schedule: ScheduledEvent[],
  day: number
): ScheduledEvent[] {
  return schedule.filter((e) => day >= e.startDay && day <= e.endDay);
}

export function leakedUpcomingForDay(
  schedule: ScheduledEvent[],
  day: number
): ScheduledEvent[] {
  return schedule
    .filter(
      (e) => day >= e.startDay - e.leadDays && day < e.startDay
    )
    .sort((a, b) => a.startDay - b.startDay);
}

export function toMarketEvents(
  schedule: ScheduledEvent[],
  day: number
): MarketEvent[] {
  return activeScheduledForDay(schedule, day).map((e) => {
    const banned = e.kind === "banned";
    const def = COMMODITIES[e.commodityId];
    const cityName = CITIES[e.cityId].name;
    const days = e.endDay - day + 1;
    return {
      id: `${e.id}_sched`,
      name: e.name,
      description: banned
        ? `${def.emoji} ${def.name} has no stock in ${cityName} — supply has shut down`
        : e.kind === "surge"
        ? `${def.emoji} ${def.name} demand surges in ${cityName}`
        : `${def.emoji} ${def.name} supply floods ${cityName}`,
      duration: days,
      daysRemaining: days,
      affectedCities: [e.cityId],
      affectedCommodities: [e.commodityId],
      supplyModifier: banned ? -0.9 : e.supplyModifier,
      demandModifier: e.demandModifier,
    };
  });
}

export function daysUntilStart(e: ScheduledEvent, day: number): number {
  return Math.max(0, e.startDay - day);
}