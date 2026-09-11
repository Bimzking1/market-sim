import type {
  CityId,
  CityMarketState,
  CommodityId,
  MarketEvent,
  PriceForecast,
} from "../types";
import { COMMODITIES, ALL_COMMODITY_IDS } from "./commodities";
import { CITIES, CITY_PRODUCE_MAP, CITY_CONSUME_MAP } from "./cities";
import type { RNG } from "./rng";
import { rngRange, rngChance, rngInt, rngPick } from "./rng";

const BASE_SUPPLY = 100;
const BASE_DEMAND = 100;
const MAX_HISTORY = 30;

export function initCityMarket(
  cityId: CityId,
  rng: RNG
): CityMarketState {
  const produces = CITY_PRODUCE_MAP[cityId] ?? [];
  const consumes = CITY_CONSUME_MAP[cityId] ?? [];

  const supply: Partial<Record<CommodityId, number>> = {};
  const demand: Partial<Record<CommodityId, number>> = {};
  const prices: Partial<Record<CommodityId, number>> = {};
  const priceHistory: Partial<Record<CommodityId, number[]>> = {};

  for (const cid of ALL_COMMODITY_IDS) {
    const def = COMMODITIES[cid];
    const isProducer = produces.includes(cid);
    const isConsumer = consumes.includes(cid);

    const s = isProducer
      ? BASE_SUPPLY * rngRange(rng, 1.2, 1.8)
      : isConsumer
      ? BASE_SUPPLY * rngRange(rng, 0.3, 0.7)
      : BASE_SUPPLY * rngRange(rng, 0.6, 1.1);

    const d = isConsumer
      ? BASE_DEMAND * rngRange(rng, 1.2, 1.7)
      : isProducer
      ? BASE_DEMAND * rngRange(rng, 0.4, 0.8)
      : BASE_DEMAND * rngRange(rng, 0.7, 1.1);

    supply[cid] = s;
    demand[cid] = d;

    const price = calcPrice(def.basePrice, s, d, 1);
    prices[cid] = price;
    priceHistory[cid] = [price];
  }

  return { supply, demand, prices, priceHistory };
}

export function calcPrice(
  basePrice: number,
  supply: number,
  demand: number,
  eventFactor: number
): number {
  const supplyFactor = Math.max(0.1, BASE_SUPPLY / Math.max(supply, 1));
  const demandFactor = Math.max(0.2, demand / BASE_DEMAND);
  const noise = 0.95 + Math.random() * 0.1;
  return Math.round(basePrice * supplyFactor * demandFactor * eventFactor * noise);
}

export function simulateMarketTick(
  markets: Record<CityId, CityMarketState>,
  activeEvents: MarketEvent[],
  rng: RNG
): void {
  for (const cityId of Object.keys(CITIES) as CityId[]) {
    const market = markets[cityId];
    if (!market) continue;
    const produces = CITY_PRODUCE_MAP[cityId] ?? [];
    const consumes = CITY_CONSUME_MAP[cityId] ?? [];

    for (const cid of ALL_COMMODITY_IDS) {
      const def = COMMODITIES[cid];

      let currentSupply = market.supply[cid] ?? BASE_SUPPLY;
      let currentDemand = market.demand[cid] ?? BASE_DEMAND;

      if (produces.includes(cid)) {
        currentSupply += rngRange(rng, 2, 8);
      } else {
        currentSupply += rngRange(rng, -1, 3);
      }

      if (consumes.includes(cid)) {
        currentDemand += rngRange(rng, 2, 8);
      } else {
        currentDemand += rngRange(rng, -1, 3);
      }

      let eventFactor = 1;
      for (const event of activeEvents) {
        if (
          event.affectedCities.includes(cityId) &&
          event.affectedCommodities.includes(cid)
        ) {
          if (event.supplyModifier !== 0) {
            currentSupply *= 1 + event.supplyModifier;
          }
          if (event.demandModifier !== 0) {
            currentDemand *= 1 + event.demandModifier;
          }
          eventFactor *= 1 + (event.supplyModifier + event.demandModifier) * 0.3;
        }
      }

      currentSupply = Math.max(5, currentSupply);
      currentDemand = Math.max(5, currentDemand);

      market.supply[cid] = currentSupply;
      market.demand[cid] = currentDemand;

      const price = calcPrice(def.basePrice, currentSupply, currentDemand, eventFactor);
      market.prices[cid] = price;

      const hist = market.priceHistory[cid] ?? [];
      hist.push(price);
      if (hist.length > MAX_HISTORY) hist.shift();
      market.priceHistory[cid] = hist;
    }
  }
}

export function applyTradeImpact(
  market: CityMarketState,
  commodityId: CommodityId,
  quantity: number,
  isBuy: boolean
): void {
  const supply = market.supply[commodityId] ?? BASE_SUPPLY;
  const demand = market.demand[commodityId] ?? BASE_DEMAND;

  if (isBuy) {
    market.supply[commodityId] = Math.max(5, supply - quantity * 0.3);
    market.demand[commodityId] = demand + quantity * 0.1;
  } else {
    market.supply[commodityId] = supply + quantity * 0.3;
    market.demand[commodityId] = Math.max(5, demand - quantity * 0.1);
  }
}

const EVENT_TEMPLATES = [
  {
    name: "Heavy Rain",
    description: "Heavy rainfall disrupts agricultural production",
    duration: [3, 7],
    affectedCommodities: ["rice", "coffee", "sugar"] as CommodityId[],
    supplyModifier: -0.3,
    demandModifier: 0,
  },
  {
    name: "Drought",
    description: "Extended dry spell reduces crop yields",
    duration: [5, 10],
    affectedCommodities: ["rice", "coffee", "fish"] as CommodityId[],
    supplyModifier: -0.4,
    demandModifier: 0,
  },
  {
    name: "Factory Fire",
    description: "Major factory fire destroys production capacity",
    duration: [4, 8],
    affectedCommodities: ["steel", "electronics", "construction"] as CommodityId[],
    supplyModifier: -0.45,
    demandModifier: 0,
  },
  {
    name: "New Factory Opens",
    description: "A new industrial facility boosts production",
    duration: [6, 12],
    affectedCommodities: ["steel", "electronics"] as CommodityId[],
    supplyModifier: 0.25,
    demandModifier: 0.15,
  },
  {
    name: "Festival Season",
    description: "Tourism festival increases demand for local goods",
    duration: [3, 6],
    affectedCommodities: ["clothing", "coffee", "food"] as CommodityId[],
    supplyModifier: 0,
    demandModifier: 0.4,
  },
  {
    name: "Highway Closure",
    description: "Major highway closure disrupts supply chains",
    duration: [2, 5],
    affectedCommodities: ALL_COMMODITY_IDS.slice(0, 6),
    supplyModifier: -0.2,
    demandModifier: 0.1,
  },
  {
    name: "Fuel Shortage",
    description: "Supply disruption drives up fuel costs",
    duration: [3, 6],
    affectedCommodities: ["fuel"] as CommodityId[],
    supplyModifier: -0.5,
    demandModifier: 0.2,
  },
  {
    name: "Massive Shipment",
    description: "Large cargo shipment floods the local market",
    duration: [2, 4],
    affectedCommodities: ["electronics", "clothing", "construction"] as CommodityId[],
    supplyModifier: 0.5,
    demandModifier: 0,
  },
  {
    name: "Disease Outbreak",
    description: "Health concerns drive up medicine demand",
    duration: [4, 8],
    affectedCommodities: ["medicine"] as CommodityId[],
    supplyModifier: -0.1,
    demandModifier: 0.6,
  },
  {
    name: "Economic Slowdown",
    description: "Reduced spending affects luxury goods",
    duration: [5, 10],
    affectedCommodities: ["clothing", "electronics"] as CommodityId[],
    supplyModifier: 0,
    demandModifier: -0.35,
  },
  {
    name: "Bumper Harvest",
    description: "Excellent growing conditions boost agricultural output",
    duration: [4, 8],
    affectedCommodities: ["rice", "coffee", "sugar"] as CommodityId[],
    supplyModifier: 0.4,
    demandModifier: 0,
  },
  {
    name: "Construction Boom",
    description: "Infrastructure project drives construction demand",
    duration: [5, 10],
    affectedCommodities: ["steel", "construction", "rubber"] as CommodityId[],
    supplyModifier: 0,
    demandModifier: 0.4,
  },
];

let eventCounter = 0;

export function tryGenerateEvent(
  currentDay: number,
  rng: RNG
): MarketEvent | null {
  if (!rngChance(rng, 0.12)) return null;

  const template = rngPick(rng, EVENT_TEMPLATES);
  const duration =
    rngInt(rng, template.duration[0], template.duration[1]);

  const numCities = rngInt(rng, 1, 3);
  const cityPool = (
    Object.keys(CITIES) as CityId[]
  ).filter((c) => !template.affectedCommodities.every((cc) => {
    const produces = CITY_PRODUCE_MAP[c] ?? [];
    const consumes = CITY_CONSUME_MAP[c] ?? [];
    return produces.includes(cc) || consumes.includes(cc);
  }));
  const affectedCities: CityId[] = [];
  for (let i = 0; i < Math.min(numCities, cityPool.length); i++) {
    const idx = rngInt(rng, 0, cityPool.length - 1);
    affectedCities.push(cityPool.splice(idx, 1)[0]);
  }
  if (affectedCities.length === 0) {
    affectedCities.push(rngPick(rng, (Object.keys(CITIES) as CityId[])));
  }

  return {
    id: `event_${++eventCounter}_${currentDay}`,
    name: template.name,
    description: template.description,
    duration,
    daysRemaining: duration,
    affectedCities,
    affectedCommodities: template.affectedCommodities,
    supplyModifier: template.supplyModifier,
    demandModifier: template.demandModifier,
  };
}

export function tickEvents(events: MarketEvent[]): MarketEvent[] {
  return events
    .map((e) => ({ ...e, daysRemaining: e.daysRemaining - 1 }))
    .filter((e) => e.daysRemaining > 0);
}

function cloneMarket(market: CityMarketState): CityMarketState {
  return {
    supply: { ...market.supply },
    demand: { ...market.demand },
    prices: { ...market.prices },
    priceHistory: {},
  };
}

const FORECAST_HORIZON = 3;

export function predictPriceDirections(
  markets: Record<CityId, CityMarketState>,
  cityId: CityId,
  currentDay: number,
  seed: number,
  rngFactory: (seed: number) => RNG,
  horizon: number = FORECAST_HORIZON
): Record<CommodityId, PriceForecast> {
  const market = markets[cityId];
  const upDays: Partial<Record<CommodityId, number>> = {};
  const downDays: Partial<Record<CommodityId, number>> = {};
  const closes: Partial<Record<CommodityId, number>> = {};

  const futures: Record<CityId, CityMarketState> = {};
  for (const c of Object.keys(markets) as CityId[]) {
    futures[c] = cloneMarket(markets[c]);
  }
  const simulated = futures[cityId];

  for (let k = 1; k <= horizon; k++) {
    simulateMarketTick(
      futures,
      [],
      rngFactory(seed + (currentDay + k) * 1000)
    );
    for (const cid of ALL_COMMODITY_IDS) {
      const cur = market.prices[cid] ?? COMMODITIES[cid].basePrice;
      const next = simulated.prices[cid] ?? cur;
      if (next > cur) upDays[cid] = (upDays[cid] ?? 0) + 1;
      else if (next < cur) downDays[cid] = (downDays[cid] ?? 0) + 1;
      closes[cid] = simulated.prices[cid] ?? cur;
    }
  }

  const result = {} as Record<CommodityId, PriceForecast>;
  for (const cid of ALL_COMMODITY_IDS) {
    const cur = market.prices[cid] ?? COMMODITIES[cid].basePrice;
    const predicted = closes[cid] ?? cur;
    const pct = cur > 0 ? (predicted - cur) / cur : 0;
    const direction: PriceForecast["direction"] =
      pct > 0.02 ? "up" : pct < -0.02 ? "down" : "flat";
    const up = upDays[cid] ?? 0;
    const down = downDays[cid] ?? 0;
    const confidence = Math.round((Math.max(up, down) / horizon) * 100);
    result[cid] = {
      pct,
      direction,
      confidence,
      predictedPrice: predicted,
    };
  }
  return result;
}
