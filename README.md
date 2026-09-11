# Kongsi — Trading Economy Game

A dynamic trading and wealth-management simulation game inspired by the economic loop of Tradewinds 2. Buy goods cheaply, transport them between cities, and sell where prices are high. The market is alive — prices shift with supply, demand, and random events.

## Features

- **Dynamic Market System** — Prices driven by supply and demand, not fixed multipliers
- **8 Indonesian Cities** — Each with unique economic identities (agricultural, industrial, tourist, mining, commercial)
- **11 Commodities** — Rice, Coffee, Sugar, Fish, Rubber, Steel, Electronics, Fuel, Medicine, Clothing, Construction Materials
- **5 Vehicle Types** — From Motorcycle to Container Truck, each with unique stats
- **Market Events** — Weather, disasters, festivals, and economic shifts affect prices
- **Warehousing** — Store goods, wait for better prices; upgrade capacity and pay itemized day-to-day costs
- **Banking** — Bank loans and moneylender with credit rating system
- **Insights desk** — Hire a Market Analyst, Govt. Cargo Manager, or Trade Insider for price forecasts and city intel
- **End Day / Sleep** — Skip a day to let markets move without traveling
- **Perishable Goods** — Fish, rice, and medicine decay over time
- **Vehicle Maintenance** — Condition matters; breakdowns are a real risk
- **180-Day Season** — Finite game with final economic report and ranking
- **Save/Load** — Export and import JSON save files

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to play.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand (state management)
- React Router (routing)
- Lucide React (icons)

## How to Play

1. Open the game — the **splash screen** loads first at `/`
2. Click **Start New Game** to begin with Rp10M and one pickup truck
3. Land on the **Dashboard** (`/dashboard`) — your financial overview
4. Open the **Market** (`/market`) to buy goods at current prices
5. Check the **Map** (`/map`) to see prices in other cities and travel costs
6. Travel to a city where your goods are worth more
7. Sell for profit, accounting for all expenses
8. Upgrade vehicles (`/garage`), buy warehouses (`/warehouse`), take loans (`/bank`) to grow faster
9. Watch out for market events and perishable goods
10. Reach day 180 and see your final economic report (`/report`)

## Game Architecture

```
src/
  engine/        — Simulation engine (market, trade, vehicles, etc.)
  store/         — Zustand game state
  components/    — Reusable UI components
  pages/         — Route pages
  utils/         — Formatting utilities
  types/         — TypeScript types
```

## License

MIT
