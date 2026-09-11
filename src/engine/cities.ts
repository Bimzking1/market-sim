import type { CityDef, CityId, RegionId, CommodityId } from "../types";

const dist: Record<CityId, Partial<Record<CityId, number>>> = {
  bandung: {
    jakarta: 140, surabaya: 330, semarang: 280, yogyakarta: 370, malang: 410,
    medan: 1640, makassar: 1570, padang: 1290, palembang: 610,
    banjarmasin: 850, balikpapan: 1070, pontianak: 620,
    denpasar: 1000, mataram: 1170, manado: 2300, ambon: 2200, jayapura: 3080,
  },
  jakarta: {
    bandung: 140, surabaya: 680, semarang: 450, yogyakarta: 530, malang: 740,
    medan: 1780, makassar: 1460, padang: 1120, palembang: 470,
    banjarmasin: 750, balikpapan: 970, pontianak: 520,
    denpasar: 910, mataram: 1080, manado: 2200, ambon: 2100, jayapura: 2980,
  },
  surabaya: {
    bandung: 330, jakarta: 680, semarang: 250, yogyakarta: 320, malang: 90,
    medan: 2020, makassar: 680, padang: 1470, palembang: 870,
    banjarmasin: 420, balikpapan: 640, pontianak: 750,
    denpasar: 320, mataram: 490, manado: 1610, ambon: 1500, jayapura: 2380,
  },
  semarang: {
    bandung: 280, jakarta: 450, surabaya: 250, yogyakarta: 120, malang: 330,
    medan: 1820, makassar: 930, padang: 1350, palembang: 700,
    banjarmasin: 600, balikpapan: 820, pontianak: 680,
    denpasar: 600, mataram: 770, manado: 1780, ambon: 1720, jayapura: 2520,
  },
  yogyakarta: {
    bandung: 370, jakarta: 530, surabaya: 320, semarang: 120, malang: 220,
    medan: 1930, makassar: 1050, padang: 1410, palembang: 800,
    banjarmasin: 690, balikpapan: 910, pontianak: 770,
    denpasar: 530, mataram: 700, manado: 1830, ambon: 1750, jayapura: 2550,
  },
  malang: {
    bandung: 410, jakarta: 740, surabaya: 90, semarang: 330, yogyakarta: 220,
    medan: 2050, makassar: 770, padang: 1530, palembang: 980,
    banjarmasin: 430, balikpapan: 650, pontianak: 840,
    denpasar: 310, mataram: 470, manado: 1700, ambon: 1580, jayapura: 2430,
  },
  medan: {
    bandung: 1640, jakarta: 1780, surabaya: 2020, semarang: 1820, yogyakarta: 1930,
    malang: 2050, makassar: 1980, padang: 460, palembang: 1180,
    banjarmasin: 1350, balikpapan: 1620, pontianak: 860,
    denpasar: 1980, mataram: 2150, manado: 3240, ambon: 2950, jayapura: 3830,
  },
  makassar: {
    bandung: 1570, jakarta: 1460, surabaya: 680, semarang: 930, yogyakarta: 1050,
    malang: 770, medan: 1980, padang: 1520, palembang: 1100,
    banjarmasin: 530, balikpapan: 520, pontianak: 1040,
    denpasar: 620, mataram: 740, manado: 1420, ambon: 1180, jayapura: 2070,
  },
  padang: {
    bandung: 1290, jakarta: 1120, surabaya: 1470, semarang: 1350, yogyakarta: 1410,
    malang: 1530, medan: 460, makassar: 1520, palembang: 980,
    banjarmasin: 1080, balikpapan: 1340, pontianak: 680,
    denpasar: 1710, mataram: 1880, manado: 2140, ambon: 2620, jayapura: 3600,
  },
  palembang: {
    bandung: 610, jakarta: 470, surabaya: 870, semarang: 700, yogyakarta: 800,
    malang: 980, medan: 1180, makassar: 1100, padang: 980,
    banjarmasin: 730, balikpapan: 980, pontianak: 430,
    denpasar: 1100, mataram: 1270, manado: 1720, ambon: 2200, jayapura: 3180,
  },
  banjarmasin: {
    bandung: 850, jakarta: 750, surabaya: 420, semarang: 600, yogyakarta: 690,
    malang: 430, medan: 1350, makassar: 530, padang: 1080, palembang: 730,
    balikpapan: 270, pontianak: 720,
    denpasar: 470, mataram: 640, manado: 1200, ambon: 1180, jayapura: 2160,
  },
  balikpapan: {
    bandung: 1070, jakarta: 970, surabaya: 640, semarang: 820, yogyakarta: 910,
    malang: 650, medan: 1620, makassar: 520, padang: 1340, palembang: 980,
    banjarmasin: 270, pontianak: 990,
    denpasar: 720, mataram: 890, manado: 1080, ambon: 1330, jayapura: 1830,
  },
  pontianak: {
    bandung: 620, jakarta: 520, surabaya: 750, semarang: 680, yogyakarta: 770,
    malang: 840, medan: 860, makassar: 1040, padang: 680, palembang: 430,
    banjarmasin: 720, balikpapan: 990,
    denpasar: 960, mataram: 1130, manado: 1660, ambon: 2140, jayapura: 3120,
  },
  denpasar: {
    bandung: 1000, jakarta: 910, surabaya: 320, semarang: 600, yogyakarta: 530,
    malang: 310, medan: 1980, makassar: 620, padang: 1710, palembang: 1100,
    banjarmasin: 470, balikpapan: 720, pontianak: 960,
    mataram: 170, manado: 1430, ambon: 1280, jayapura: 2260,
  },
  mataram: {
    bandung: 1170, jakarta: 1080, surabaya: 490, semarang: 770, yogyakarta: 700,
    malang: 470, medan: 2150, makassar: 740, padang: 1880, palembang: 1270,
    banjarmasin: 640, balikpapan: 890, pontianak: 1130,
    denpasar: 170, manado: 1550, ambon: 1320, jayapura: 2300,
  },
  manado: {
    bandung: 2300, jakarta: 2200, surabaya: 1610, semarang: 1780, yogyakarta: 1830,
    malang: 1700, medan: 3240, makassar: 1420, padang: 2140, palembang: 1720,
    banjarmasin: 1200, balikpapan: 1080, pontianak: 1660,
    denpasar: 1430, mataram: 1550, ambon: 860, jayapura: 1500,
  },
  ambon: {
    bandung: 2200, jakarta: 2100, surabaya: 1500, semarang: 1720, yogyakarta: 1750,
    malang: 1580, medan: 2950, makassar: 1180, padang: 2620, palembang: 2200,
    banjarmasin: 1180, balikpapan: 1330, pontianak: 2140,
    denpasar: 1280, mataram: 1320, manado: 860, jayapura: 1990,
  },
  jayapura: {
    bandung: 3080, jakarta: 2980, surabaya: 2380, semarang: 2520, yogyakarta: 2550,
    malang: 2430, medan: 3830, makassar: 2070, padang: 3600, palembang: 3180,
    banjarmasin: 2160, balikpapan: 1830, pontianak: 3120,
    denpasar: 2260, mataram: 2300, manado: 1500, ambon: 1990,
  },
};

export const CITY_COST_MULTIPLIER: Record<CityId, number> = {
  bandung: 1.15, jakarta: 1.6, surabaya: 1.3, semarang: 1.05,
  yogyakarta: 0.9, malang: 0.85, medan: 1.2, makassar: 1.1,
  padang: 0.8, palembang: 0.95, banjarmasin: 0.9, balikpapan: 1.45,
  pontianak: 0.85, denpasar: 1.5, mataram: 0.75, manado: 1.0,
  ambon: 1.25, jayapura: 1.6,
};

export const CITY_REGION: Record<CityId, RegionId> = {
  bandung: "java", jakarta: "java", surabaya: "java", semarang: "java",
  yogyakarta: "java", malang: "java",
  medan: "sumatra", padang: "sumatra", palembang: "sumatra",
  banjarmasin: "borneo", balikpapan: "borneo", pontianak: "borneo",
  makassar: "sulawesi", manado: "sulawesi",
  denpasar: "bali_ntt", mataram: "bali_ntt",
  ambon: "maluku_papua", jayapura: "maluku_papua",
};

export const CITIES: Record<CityId, CityDef> = {
  bandung: {
    id: "bandung", name: "Bandung", type: "agricultural", region: "java",
    produces: ["coffee", "rice", "rubber"],
    consumes: ["electronics", "steel", "medicine", "fuel"],
    distance: dist.bandung,
  },
  jakarta: {
    id: "jakarta", name: "Jakarta", type: "commercial", region: "java",
    produces: ["electronics", "clothing"],
    consumes: ["rice", "coffee", "fish", "fuel", "construction"],
    distance: dist.jakarta,
  },
  surabaya: {
    id: "surabaya", name: "Surabaya", type: "industrial", region: "java",
    produces: ["steel", "electronics", "construction"],
    consumes: ["fuel", "rubber", "rice", "fish"],
    distance: dist.surabaya,
  },
  semarang: {
    id: "semarang", name: "Semarang", type: "commercial", region: "java",
    produces: ["sugar", "clothing"],
    consumes: ["steel", "fuel", "electronics"],
    distance: dist.semarang,
  },
  yogyakarta: {
    id: "yogyakarta", name: "Yogyakarta", type: "tourist", region: "java",
    produces: ["clothing", "batik"],
    consumes: ["rice", "coffee", "electronics", "medicine", "fuel"],
    distance: dist.yogyakarta,
  },
  malang: {
    id: "malang", name: "Malang", type: "agricultural", region: "java",
    produces: ["rice", "coffee", "sugar", "fish"],
    consumes: ["steel", "medicine", "fuel", "construction"],
    distance: dist.malang,
  },
  medan: {
    id: "medan", name: "Medan", type: "mining", region: "sumatra",
    produces: ["rubber", "fuel"],
    consumes: ["rice", "electronics", "medicine", "clothing", "construction"],
    distance: dist.medan,
  },
  makassar: {
    id: "makassar", name: "Makassar", type: "mining", region: "sulawesi",
    produces: ["fish", "rubber", "silk"],
    consumes: ["rice", "coffee", "steel", "electronics", "fuel"],
    distance: dist.makassar,
  },
  padang: {
    id: "padang", name: "Padang", type: "agricultural", region: "sumatra",
    produces: ["rice", "fish", "rendang"],
    consumes: ["electronics", "medicine", "fuel", "construction"],
    distance: dist.padang,
  },
  palembang: {
    id: "palembang", name: "Palembang", type: "agricultural", region: "sumatra",
    produces: ["fish", "rubber", "pempek"],
    consumes: ["rice", "electronics", "steel", "fuel"],
    distance: dist.palembang,
  },
  banjarmasin: {
    id: "banjarmasin", name: "Banjarmasin", type: "commercial", region: "borneo",
    produces: ["fish", "rubber", "sasirangan"],
    consumes: ["rice", "electronics", "medicine", "fuel"],
    distance: dist.banjarmasin,
  },
  balikpapan: {
    id: "balikpapan", name: "Balikpapan", type: "mining", region: "borneo",
    produces: ["fuel"],
    consumes: ["rice", "fish", "electronics", "construction"],
    distance: dist.balikpapan,
  },
  pontianak: {
    id: "pontianak", name: "Pontianak", type: "commercial", region: "borneo",
    produces: ["rubber", "rice"],
    consumes: ["electronics", "medicine", "fuel", "steel"],
    distance: dist.pontianak,
  },
  denpasar: {
    id: "denpasar", name: "Denpasar", type: "tourist", region: "bali_ntt",
    produces: ["jewelry", "construction"],
    consumes: ["rice", "coffee", "electronics", "medicine", "fuel"],
    distance: dist.denpasar,
  },
  mataram: {
    id: "mataram", name: "Mataram", type: "agricultural", region: "bali_ntt",
    produces: ["rice", "sugar"],
    consumes: ["electronics", "medicine", "fuel", "steel"],
    distance: dist.mataram,
  },
  manado: {
    id: "manado", name: "Manado", type: "tourist", region: "sulawesi",
    produces: ["fish", "rice"],
    consumes: ["electronics", "medicine", "fuel", "construction"],
    distance: dist.manado,
  },
  ambon: {
    id: "ambon", name: "Ambon", type: "tourist", region: "maluku_papua",
    produces: ["fish", "nutmeg"],
    consumes: ["rice", "electronics", "medicine", "fuel"],
    distance: dist.ambon,
  },
  jayapura: {
    id: "jayapura", name: "Jayapura", type: "mining", region: "maluku_papua",
    produces: ["rice", "rubber", "noken"],
    consumes: ["electronics", "medicine", "fuel", "steel"],
    distance: dist.jayapura,
  },
};

export const ALL_CITY_IDS = Object.keys(CITIES) as CityId[];

export function getDistance(from: CityId, to: CityId): number {
  if (from === to) return 0;
  return CITIES[from].distance[to] ?? 500;
}

export function isCrossRegion(from: CityId, to: CityId): boolean {
  return CITY_REGION[from] !== CITY_REGION[to];
}

export const CITY_PRODUCE_MAP: Record<CityId, CommodityId[]> = {
  bandung: ["coffee", "rice", "rubber"],
  jakarta: ["electronics", "clothing"],
  surabaya: ["steel", "electronics", "construction"],
  semarang: ["sugar", "clothing"],
  yogyakarta: ["clothing", "batik"],
  malang: ["rice", "coffee", "sugar", "fish"],
  medan: ["rubber", "fuel"],
  makassar: ["fish", "rubber", "silk"],
  padang: ["rice", "fish", "rendang"],
  palembang: ["fish", "rubber", "pempek"],
  banjarmasin: ["fish", "rubber", "sasirangan"],
  balikpapan: ["fuel"],
  pontianak: ["rubber", "rice"],
  denpasar: ["jewelry", "construction"],
  mataram: ["rice", "sugar"],
  manado: ["fish", "rice"],
  ambon: ["fish", "nutmeg"],
  jayapura: ["rice", "rubber", "noken"],
};

export const CITY_CONSUME_MAP: Record<CityId, CommodityId[]> = {
  bandung: ["electronics", "steel", "medicine", "fuel"],
  jakarta: ["rice", "coffee", "fish", "fuel", "construction"],
  surabaya: ["fuel", "rubber", "rice", "fish"],
  semarang: ["steel", "fuel", "electronics"],
  yogyakarta: ["rice", "coffee", "electronics", "medicine", "fuel"],
  malang: ["steel", "medicine", "fuel", "construction"],
  medan: ["rice", "electronics", "medicine", "clothing", "construction"],
  makassar: ["rice", "coffee", "steel", "electronics", "fuel"],
  padang: ["electronics", "medicine", "fuel", "construction"],
  palembang: ["rice", "electronics", "steel", "fuel"],
  banjarmasin: ["rice", "electronics", "medicine", "fuel"],
  balikpapan: ["rice", "fish", "electronics", "construction"],
  pontianak: ["electronics", "medicine", "fuel", "steel"],
  denpasar: ["rice", "coffee", "electronics", "medicine", "fuel"],
  mataram: ["electronics", "medicine", "fuel", "steel"],
  manado: ["electronics", "medicine", "fuel", "construction"],
  ambon: ["rice", "electronics", "medicine", "fuel"],
  jayapura: ["electronics", "medicine", "fuel", "steel"],
};
