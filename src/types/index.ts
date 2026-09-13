export type CommodityId =
  | "rice"
  | "coffee"
  | "sugar"
  | "fish"
  | "rubber"
  | "steel"
  | "electronics"
  | "fuel"
  | "medicine"
  | "clothing"
  | "construction"
  | "rendang"
  | "pempek"
  | "batik"
  | "sasirangan"
  | "jewelry"
  | "silk"
  | "nutmeg"
  | "noken"
  | "palm_oil"
  | "tea"
  | "cocoa"
  | "banana"
  | "mango"
  | "chili"
  | "soybeans"
  | "tempeh"
  | "tofu"
  | "chicken"
  | "beef"
  | "eggs"
  | "milk"
  | "salt"
  | "cement"
  | "timber"
  | "glass"
  | "ceramics"
  | "paint"
  | "rope"
  | "nails"
  | "paper"
  | "batteries"
  | "carparts"
  | "fertilizer"
  | "orchid"
  | "lumpia"
  | "apples"
  | "durian"
  | "pearls"
  | "ulos";

export type CityId =
  | "bandung"
  | "jakarta"
  | "surabaya"
  | "semarang"
  | "yogyakarta"
  | "malang"
  | "medan"
  | "makassar"
  | "padang"
  | "palembang"
  | "banjarmasin"
  | "balikpapan"
  | "pontianak"
  | "denpasar"
  | "mataram"
  | "manado"
  | "ambon"
  | "jayapura";

export type RegionId =
  | "java"
  | "sumatra"
  | "borneo"
  | "sulawesi"
  | "bali_ntt"
  | "maluku_papua";

export type VehicleTypeId =
  | "motorcycle"
  | "pickup"
  | "truck"
  | "refrigerated_truck"
  | "container_truck";

export type WarehouseTypeId = "small" | "medium" | "large";

export type StaffId = "analyst" | "cargoManager" | "broker";

export type LoanType = "bank" | "moneylender";

export type LoanStatus = "active" | "due_soon" | "overdue" | "paid";

export interface CommodityDef {
  id: CommodityId;
  name: string;
  emoji: string;
  unit: string;
  basePrice: number;
  perishable: boolean;
  spoilRate: number;
  category: "food" | "industrial" | "luxury" | "fuel" | "medical";
  /**
   * When true the good is sold in every city. When false it only appears in
   * the cities listed in that city's "produces" table (see the Almanac page).
   */
  availableEverywhere: boolean;
}

export interface InventoryLot {
  qty: number;
  unitPrice: number;
  cityId?: CityId;
  day?: number;
}

export interface CityDef {
  id: CityId;
  name: string;
  type: "agricultural" | "industrial" | "tourist" | "mining" | "commercial";
  region: RegionId;
  produces: CommodityId[];
  consumes: CommodityId[];
  distance: Partial<Record<CityId, number>>;
}

export interface VehicleDef {
  id: VehicleTypeId;
  name: string;
  price: number;
  capacity: number;
  fuelEfficiency: number;
  speed: number;
  maintenanceCost: number;
  reliability: number;
  perishableProtection: number;
}

export interface WarehouseDef {
  id: WarehouseTypeId;
  name: string;
  baseCapacity: number;
  rentPerDay: number;
  maintenancePerDay: number;
  securityPerDay: number;
  electricityPerDay: number;
  operationalPerDay: number;
}

export interface StaffDef {
  id: StaffId;
  name: string;
  role: string;
  description: string;
  dailyRate: number;
}

export interface CityMarketState {
  supply: Partial<Record<CommodityId, number>>;
  demand: Partial<Record<CommodityId, number>>;
  prices: Partial<Record<CommodityId, number>>;
  priceHistory: Partial<Record<CommodityId, number[]>>;
}

export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  daysRemaining: number;
  affectedCities: CityId[];
  affectedCommodities: CommodityId[];
  supplyModifier: number;
  demandModifier: number;
}

export interface Vehicle {
  id: string;
  typeId: VehicleTypeId;
  name: string;
  condition: number;
  fuel: number;
  mileage: number;
  inventory: Partial<Record<CommodityId, number>>;
  lots: Partial<Record<CommodityId, InventoryLot[]>>;
}

export interface Warehouse {
  id: string;
  typeId: WarehouseTypeId;
  cityId: CityId;
  inventory: Partial<Record<CommodityId, number>>;
  lots: Partial<Record<CommodityId, InventoryLot[]>>;
  level: number;
  capacity: number;
}

export interface Loan {
  id: string;
  type: LoanType;
  principal: number;
  remaining: number;
  interestRate: number;
  dueDay: number;
  status: LoanStatus;
}

export interface LedgerLine {
  label: string;
  amount: number;
}

export interface TripExpenses {
  fuel: number;
  toll: number;
  driver: number;
  loading: number;
  maintenance: number;
  total: number;
}

export interface Objective {
  id: string;
  label: string;
  target: string;
  progress: number;
  complete: boolean;
}

export interface Transaction {
  day: number;
  type: "buy" | "sell";
  commodityId: CommodityId;
  quantity: number;
  unitPrice: number;
  total: number;
  cityId: CityId;
  remote?: boolean;
}

export interface FinalReport {
  totalDays: number;
  startingCapital: number;
  finalNetWorth: number;
  lines: LedgerLine[];
  finalRank: number;
  bestCommodity: string;
  worstCommodity: string;
  bestCity: string;
  bestInvestment: string;
  worstInvestment: string;
}

export interface PriceForecast {
  pct: number;
  direction: "up" | "down" | "flat";
  confidence: number;
  predictedPrice: number;
}

export type ScheduledEventKind = "surge" | "drop" | "banned";

export interface ScheduledEvent {
  id: string;
  name: string;
  kind: ScheduledEventKind;
  commodityId: CommodityId;
  cityId: CityId;
  startDay: number;
  endDay: number;
  startDateISO: string;
  endDateISO: string;
  leadDays: number;
  supplyModifier: number;
  demandModifier: number;
}

export interface GameState {
  seed: number;
  startDate: number;
  currentDay: number;
  totalDays: number;

  playerCash: number;
  playerNetWorth: number;
  creditRating: number;

  currentCity: CityId;

  vehicles: Vehicle[];
  selectedVehicleId: string | null;

  warehouses: Warehouse[];

  staffHires: Partial<Record<StaffId, number>>;

  loans: Loan[];

  cityMarkets: Record<CityId, CityMarketState>;
  activeEvents: MarketEvent[];
  scheduledEvents: ScheduledEvent[];

  transactions: Transaction[];
  todaysLedger: LedgerLine[];

  objectives: Objective[];

  gameStarted: boolean;
  gameOver: boolean;
}

export interface CommodityMarket {
  commodityId: CommodityId;
  name: string;
  unit: string;
  price: number;
  supply: number;
  demand: number;
  history: number[];
  changePct: number;
  playerOwns: number;
  perishable: boolean;
}
