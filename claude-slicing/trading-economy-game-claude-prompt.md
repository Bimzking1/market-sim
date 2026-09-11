# Prompt for Claude — Dynamic Trading Economy Game

I want you to help me design and build a frontend-only simulation/trading game inspired by the economic/trading loop I love in **Tradewinds 2**, but DO NOT make it a pirate/ship game.

The core fantasy is:

> Buy goods cheaply → transport them somewhere → prices change → decide whether to sell, hold, warehouse, borrow, invest, or move the goods again → grow net worth.

The game should make money management itself feel like gameplay.

## Core Concept

The player starts as a small independent trader.

Example starting state:

- Cash: Rp10,000,000
- 1 small vehicle
- No warehouse
- No businesses
- No debt
- Limited market information

There is a world map with multiple cities.

Each city has its own dynamic economy and prices for multiple commodities.

Example:

### City A

- Rice
- Coffee
- Sugar
- Fish
- Rubber
- Steel
- Electronics
- Fuel
- Medicine
- Clothing
- Construction materials

The player can buy goods in City A, transport them to City B, and sell them.

However, prices must NOT be static.

If the player returns to City A later, the price may be completely different from when they left.

The player should constantly think:

> "Is this still profitable if I account for transportation, storage, debt, and risk?"

---

# 1. Dynamic Market System

This is the most important system.

Prices should be generated from supply and demand rather than being fixed city multipliers.

Each city should have:

- Base supply
- Base demand
- Current supply
- Current demand
- Local production
- Local consumption
- Imports
- Exports
- Recent market events
- Price history

A simplified conceptual formula can be:

price = base_price × demand_factor × scarcity_factor × event_factor × market_noise

Do NOT make it completely random.

The player should be able to learn market behavior.

For example:

Coffee in City A:

Day 1: Rp40,000
Day 4: Rp43,000
Day 8: Rp51,000
Day 12: Rp62,000
Day 15: Rp48,000

The player should be able to see historical charts and recognize patterns, but the future must never be guaranteed.

## Important

The player's own trading activity should be able to affect the market.

If many units of coffee are sold into a city:

- Supply increases
- Price decreases

If a shortage occurs:

- Supply decreases
- Price increases

This creates a living market.

---

# 2. City Economic Identity

Cities should not be generic map nodes.

Each city should have an economic identity.

Examples:

## Agricultural City

Produces:

- Rice
- Coffee
- Fruit
- Vegetables

Usually imports:

- Electronics
- Machinery
- Medicine

## Industrial City

Produces:

- Steel
- Machinery
- Electronics

Consumes large amounts of:

- Fuel
- Food
- Raw materials

## Tourist City

High demand for:

- Food
- Drinks
- Clothing
- Luxury goods

## Mining City

Produces:

- Coal
- Copper
- Minerals

The important part is that these are BASE tendencies, not permanent prices.

Events can disrupt them.

---

# 3. Market Events

Events should modify supply/demand and therefore prices.

Examples:

- Heavy rain → agricultural production decreases
- Drought → food shortage
- Factory fire → industrial goods supply decreases
- New factory opens → raw material demand increases
- Festival → tourism demand increases
- Highway closure → transportation costs increase
- Fuel shortage → fuel price increases
- Massive shipment arrives → local supply increases
- Disease outbreak → medicine demand increases
- Economic slowdown → luxury demand decreases

Events should have duration.

For example:

> Factory fire
> Duration: 5 days
> Steel production: -40%

This should naturally create trading opportunities.

Do not simply display "Steel +40%".

Let the underlying economic variables produce the price change.

---

# 4. Trading

The player can:

- Buy goods
- Sell goods
- View current prices
- View price history
- View estimated supply/demand
- Store goods
- Transport goods
- Compare city prices

Every trade should calculate:

- Purchase cost
- Selling revenue
- Transportation cost
- Storage cost
- Transaction fees
- Taxes if applicable
- Net profit/loss
- ROI

Example:

Buy:

100 Coffee × Rp42,000

Cost:

Rp4,200,000

Transport:

Rp500,000

Sell:

100 × Rp57,000 = Rp5,700,000

Net:

Rp1,000,000 profit

The UI should make it very obvious that the player must consider NET profit rather than simply price difference.

---

# 5. Vehicles

Replace ships with land vehicles.

Possible progression:

### Motorcycle

- Very cheap
- Tiny capacity
- Fast
- Low operating cost

### Pickup

- Cheap
- Medium capacity

### Truck

- Expensive
- Large capacity
- Higher fuel and maintenance costs

### Refrigerated Truck

- Can transport perishable goods
- Expensive
- Lower spoilage

### Container Truck

- Very high capacity
- Slow
- Expensive

Vehicle stats:

- Purchase price
- Cargo capacity
- Fuel efficiency
- Speed
- Maintenance cost
- Reliability
- Depreciation
- Insurance

---

# 6. Trip Expenses

Transportation should NOT be free.

Every trip can generate:

- Fuel
- Toll
- Driver wage
- Parking
- Loading/unloading
- Road fees
- Vehicle maintenance
- Insurance
- Unexpected costs

Example:

Revenue:

+Rp8,500,000

Expenses:

- Fuel: Rp350,000
- Toll: Rp150,000
- Driver: Rp200,000
- Loading: Rp100,000
- Maintenance: Rp100,000

Actual net trade profit:

Rp7,600,000

The player should be able to inspect these expenses.

---

# 7. Vehicle Maintenance and Risk

Vehicles should have condition.

Example:

Condition: 82%

The player can:

### Service now

Cost: Rp2,000,000

Condition → 100%

OR

### Continue driving

Cost: Rp0

But mechanical risk increases.

Possible consequences:

- Breakdown
- Delayed delivery
- Cargo damage
- Emergency repair
- Missed market opportunity

Do NOT make accidents constant or frustrating.

They should be risk management mechanics.

---

# 8. Warehouses

Warehouses are a major part of the game.

The player can buy or rent warehouses in cities.

Example:

### Small Warehouse

Capacity: 500 units
Rent: Rp1M/month

### Medium Warehouse

Capacity: 2,000 units
Rent: Rp4M/month

### Large Warehouse

Capacity: 10,000 units
Rent: Rp18M/month

Warehouse expenses:

- Rent
- Security
- Electricity
- Loading/unloading
- Insurance
- Maintenance

Warehouses allow the player to hold inventory while waiting for a better market price.

This creates:

> Cash now vs potentially higher future profit.

---

# 9. Perishable Goods

Some goods should deteriorate.

Example:

Fish:

Day 1: 100% quality
Day 2: 92%
Day 3: 71%
Day 4: 45%

The player must decide:

> Sell now at a bad price, or gamble on the market?

Refrigerated vehicles and better warehouses can reduce spoilage.

---

# 10. Banking

Add financial systems.

### Bank

- Deposits
- Loans
- Lower interest
- Requires credit history

### Moneylender

- Fast approval
- High interest
- Higher risk

### Overdraft / Credit Line

Allows the player to temporarily spend beyond cash.

Debt should matter.

Example:

Cash: Rp2M
Inventory: Rp18M
Debt: Rp20M

Loan payment due in 1 day.

The player might need to:

- Sell inventory
- Take another loan
- Travel to another city
- Sell an asset
- Gamble on a price recovery

This should create financial pressure.

---

# 11. Credit Rating

The player should develop financial reputation.

Good behavior:

- Repay loans on time
- Maintain profitable businesses
- Keep healthy cash flow

Bad behavior:

- Late payments
- Default
- Excessive debt

Higher credit rating unlocks:

- Larger loans
- Lower interest
- Better banking products
- Business financing

---

# 12. Market Information

The player should NOT immediately know every city's exact price.

Information should improve over time.

Early game:

> "Coffee appears expensive in Jakarta."

Later:

> "Coffee: approximately Rp40k–Rp50k."

Eventually:

> Exact live price: Rp43,200.

Possible information upgrades:

- Newspaper
- Market analyst
- Local contacts
- Trading terminal
- Scouts
- Premium market data

Information itself becomes an investment.

---

# 13. Price History

Every commodity/city combination should have a price history graph.

Example:

COFFEE — JAKARTA

Day 1: Rp40k
Day 5: Rp45k
Day 10: Rp61k
Day 15: Rp48k
Day 20: Rp52k

The player can analyze trends.

The game should reward understanding the market without making it perfectly predictable.

---

# 14. Businesses

Eventually the player can expand beyond trading.

Possible businesses:

### Retail Shop

Buy wholesale goods → sell to consumers.

Expenses:

- Rent
- Employees
- Electricity
- Inventory
- Marketing
- Maintenance

### Factory

Buy raw materials → manufacture finished goods.

Example:

Coffee beans
↓
Processing
↓
Packaged coffee

Factory expenses:

- Raw materials
- Workers
- Electricity
- Machine maintenance
- Waste
- Logistics

This creates production chains.

---

# 15. Commodity Chains

Goods should connect to each other.

Example:

Coffee Beans
→ Processed Coffee
→ Packaged Coffee
→ Retail

Steel
→ Components
→ Machinery
→ Industrial equipment

Oil
→ Fuel
→ Transportation

This allows different business strategies.

---

# 16. Different Player Strategies

The player should be able to specialize.

### Arbitrage Trader

Buy cheap → sell expensive.

### Hoarder

Buy during market crashes → warehouse → sell later.

### Speculator

Make risky bets on future prices.

### Manufacturer

Buy raw materials → produce finished goods.

### Retailer

Buy wholesale → sell to consumers.

### Logistics Company

Transport other people's goods.

### Banker / Investor

Make money through financing and investments.

### Conglomerate

Own everything.

---

# 17. Operating Expenses

Make the financial dashboard important.

The player should clearly see:

```text
CASH                 Rp84.2M
INVENTORY            Rp31.7M
ASSETS               Rp72.0M
DEBT                -Rp20.0M
--------------------------------
NET WORTH            Rp167.9M

TODAY

Trading Revenue      +Rp12.4M
Trading Costs         -Rp7.1M
Vehicle               -Rp800k
Warehouse             -Rp300k
Loan Interest         -Rp120k
--------------------------------
NET TODAY             +Rp4.08M
```

The game should constantly make the player think:

> "What should my money be doing right now?"

---

# 18. Financial Statements

Provide simple but useful financial reports:

- Cash flow
- Revenue
- Trading profit
- Operating expenses
- Interest paid
- Asset value
- Debt
- Inventory value
- Net worth

Also provide:

### Best Trade

Coffee

### Worst Trade

Steel

### Best City

Bandung

### Worst Investment

Jakarta Warehouse

This creates a sense of progression and learning.

---

# 19. Finite Game

IMPORTANT:

I prefer this to be a finite simulation rather than an endless idle/tycoon game.

Example:

### 180-day game

Day 1 → Day 180

At Day 180:

```text
ECONOMIC REPORT

Starting Capital       Rp10M
Final Net Worth        Rp843M

Trading Profit         +Rp612M
Business Profit        +Rp281M
Interest Paid           -Rp31M
Operating Costs         -Rp29M

Best Commodity         Coffee
Worst Commodity        Steel
Best City              Bandung
Best Investment        Warehouse

Final Rank              #3
```

Possible objectives:

- Reach Rp100M
- Reach Rp500M
- Reach Rp1B
- Own 5 businesses
- Control 10 cities
- Make Rp100M purely from trading
- Finish with zero debt
- Highest net worth

---

# 20. Design Philosophy

The game should NOT feel like an accounting simulator.

The player should understand the economy quickly.

The complexity should exist underneath the UI.

The player's main questions should be:

> "What is cheap?"

> "Where is it expensive?"

> "Why is the price changing?"

> "How long should I hold?"

> "Can I afford to wait?"

> "Should I borrow money?"

> "Is the profit worth the transportation cost?"

> "Should I buy another truck or warehouse?"

> "Do I believe this market rumor?"

> "Should I take the safe profit or gamble for a larger one?"

The core dopamine should come from seeing:

**Rp10M → Rp20M → Rp50M → Rp100M → Rp500M**

while knowing that every increase came from the player's decisions.

---

# Technical Direction

Build this as a frontend-first simulation.

Prefer:

- React
- TypeScript
- Vite
- Tailwind CSS
- Local state / lightweight persistence
- No backend required initially

Create a deterministic simulation engine with a seeded random system so the same game seed can reproduce the same economic world.

Separate:

1. Simulation engine
2. Market/economy logic
3. Game state
4. UI
5. Data/configuration

Do NOT hardcode every price transition manually.

Create reusable systems for:

- Commodities
- Cities
- Supply/demand
- Market events
- Vehicles
- Warehouses
- Businesses
- Loans
- Expenses
- Inventory
- Price history
- Time progression
- Game objectives

The simulation should advance when the player advances time/travels.

Do not build multiplayer initially.

Do not use AI to generate the economy.

The economy should be algorithmic and predictable enough to understand, but uncertain enough to create interesting decisions.

---

# Most Important Requirement

Do not lose the original feeling.

This is NOT primarily:

- a truck game
- a logistics game
- a tycoon game
- a stock market game

It is a:

> **dynamic trading and wealth-management game**

The vehicle, cities, warehouses, banks, businesses, and events are systems that exist to make the trading decisions more interesting.

The most satisfying moment should be:

> "I bought 500 units when nobody wanted them for Rp20M, stored them for 8 days, the market crashed and recovered, and I sold them for Rp47M."

# 21. Save / Load System

The game MUST support manual save and load.

Because this is a frontend-only game, use a portable JSON save file.

The player should be able to:

- Save current progress to a `.json` file
- Import a `.json` save file
- Continue exactly where they left off
- Have multiple save files
- See basic save metadata before loading
- Export/share a save file with another device/browser

## Save File

A save file should contain the complete game state required to continue the simulation.

Example:

```json
{
  "saveVersion": 1,
  "gameVersion": "0.1.0",
  "createdAt": "2026-09-10T14:30:00Z",
  "updatedAt": "2026-09-10T16:45:00Z",

  "game": {
    "seed": 482193,
    "currentDay": 47,
    "currentHour": 14,
    "difficulty": "normal"
  },

  "player": {
    "cash": 84200000,
    "netWorth": 167900000,
    "reputation": 72,
    "creditRating": 680
  },

  "location": {
    "cityId": "bandung"
  },

  "vehicles": [
    {
      "id": "vehicle_001",
      "typeId": "pickup",
      "name": "My Pickup",
      "condition": 82,
      "fuel": 64,
      "mileage": 18240
    }
  ],

  "warehouses": [
    {
      "id": "warehouse_001",
      "cityId": "bandung",
      "typeId": "small",
      "inventory": {
        "coffee": 250,
        "rice": 100
      }
    }
  ],

  "inventory": {
    "coffee": 100,
    "steel": 50
  },

  "loans": [
    {
      "id": "loan_001",
      "type": "bank",
      "principal": 20000000,
      "remaining": 18400000,
      "interestRate": 0.08,
      "dueDay": 54
    }
  ],

  "cities": {
    "bandung": {
      "supply": {},
      "demand": {},
      "prices": {},
      "activeEvents": [],
      "priceHistory": {}
    }
  },

  "businesses": [],

  "transactions": [],
  "completedObjectives": [],
  "statistics": {
    "totalTradingProfit": 612000000,
    "totalRevenue": 1200000000,
    "totalExpenses": 588000000,
    "bestTrade": {},
    "worstTrade": {}
  }
}

That is the game.
