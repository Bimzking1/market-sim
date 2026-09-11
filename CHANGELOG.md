# Changelog

All notable changes to Kongsi — Trading Economy Game.

## [2.4.0] — 2026-09-11

### Added

- **Real calendar** — Your venture starts on the actual current date, and the top bar, dashboard, and Insights show the in-game calendar date. Each game day advances the calendar one day
- **Seasonal & festive conditions** — Fixed-date occasion windows now move prices in specific cities: Christmas sweet rush in Surabaya, Deepavali in Medan, Lebaran batik rush in Yogyakarta, year-end electronics sales in Jakarta, harvest tides in Makassar, wet-season coffee in Bandung, Ramadan rice rush in Medan, and more
- **Rare no-stock conditions** — True market bans where supply vanishes for a few days: Lunar New Year closures (Pontianak), Nyepi silence (Denpasar), Silk Export Ban (Makassar), and a Batik Quota Freeze (Yogyakarta). Stock a warehouse beforehand and sell into the frenzy for a small fortune
- **Insights forecast desk** — A new "Calendar & rare conditions" panel leaks upcoming occasions 7–30 days ahead (never more than a month), with the exact date, city, commodity, and how many days you have to prepare; active conditions are shown until they end
- **Loan due dates** — Loans now show a real calendar due date (e.g. "Due 11 October 2026") on the Bank page, in the take-loan confirmation, and in Dashboard repayment warnings
- **Help articles** — New entries explain the calendar system, rare conditions, and loan due dates
- **Intro briefing** — The starting date is now shown alongside starting city, capital, and duration

## [2.3.0] — 2026-09-11

### Added

- **Sea travel & 18 cities** — Indonesia now spans 6 regions and 18 cities (Bandung, Jakarta, Surabaya, Semarang, Yogyakarta, Malang, Medan, Padang, Palembang, Banjarmasin, Balikpapan, Pontianak, Makassar, Manado, Denpasar, Mataram, Ambon, Jayapura). Crossing between regions sails a ship: cheaper fuel, a port fee, and slower sea speed. Objective updated to "visit all cities"
- **Signature goods** — 8 new regional specialties (Rendang, Pempek, Batik, Sasirangan, Jewelry, Silk, Nutmeg, Noken) produced only in their home city — their scarcity drives naturally high prices elsewhere. 19 commodities total
- **Per-city warehouse costs** — Every city has a cost multiplier (Jakarta & Jayapura ×1.6 down to Mataram ×0.75) applied to rent, upkeep, purchase, and upgrades
- **Remote warehouse delegation** — Buy, upgrade, store, and withdraw goods in any city from anywhere, powered by a 6% delegation fee on the affected value
- **Premium Wire** — The Insights desk sells one extra story at a time for Rp 1.000, drawn from the current forecast movers — and friendly spoof headlines once the desk runs dry
- **Space Grotesk** — Numbers across the UI now render in Space Grotesk (loaded via Google Fonts) for better readability
- **Cursor polish** — Buttons, links, and summaries show a pointer cursor again

### Fixed

- **Travel "no effect" bug** — Clicking a destination's Depart/confirm arrow threw a reference error (the confirmation lived outside the road-trip scope), so the modal never opened and nothing happened; the confirmation now runs where the route data lives

### Changed

- **Intro screen** — Objectives, warnings, and tips now sit side-by-side in three columns on desktop; new cards explain sea routes, trucks, and warehouse delegation
- **SFX** — New click on every enabled button/link, plus confirm/cancel, theme toggle, save, and end-day sounds (uisfx.com)
- **Toast notifications** — A toast system now greets you on travel arrivals (and other events)

## [2.2.0] — 2026-09-11

### Added

- **Confirmation dialogs** — Every money/state-changing action now asks for confirmation first: buy/sell goods, travel, buy and service vehicles, buy and upgrade warehouses, store/withdraw goods, borrow from the bank or moneylender, repay loans, hire professionals, Save, and End Day. Each dialog shows the item details, cash on hand, the exact amount spent or received, and your projected cash after — with Cancel and Confirm buttons
- **Help & FAQ page** — New `/help` page reachable from the sidebar, with a search box that filters a knowledge base covering rules, money, cities, travel, vehicles, warehouses, loans, credit rating, insights, events, objectives, and save/load
- **Full currency formatting** — Money is now always shown in full Indonesian format (`Rp 13.000`, `Rp 9.500.000`, `Rp 45.000,25`) instead of abbreviations like `Rp13k`

### Fixed

- **Insights crash** — Price forecast simulation crashed the Insights page because it simulated a partial market map; forecasts now clone all cities before simulating, so the page loads reliably
- **Intro screen reliability** — Warning text now reflects the real rules (no fuel-tank or debt game-over mechanics)

## [2.1.0] — 2026-09-10

### Added

- **Intro briefing screen** — After starting a new game, a dedicated briefing page introduces the player with starting city, capital, objectives, warnings, and tips; click anywhere to begin

### Changed

- **Desktop sidebar** — Sticky, full-height sidebar with scrollable nav and the Quit button pinned permanently at the bottom
- **Mobile navigation** — Bottom tab bar replaced by a hamburger menu (top-left on phones) that opens a slide-out drawer containing nav links, theme toggle, save button, and quit; drawer auto-closes on navigation
- **Top bar** — Hamburger menu pushed into the top bar area; Cash/Net worth hidden on small screens to save space; toggle/save/quit removed from the bar (now inside the drawer)
- **Sidebar branding** — "Kongsi" title now includes a package icon beside the name
- **Splash screen** — Logo images now have feathered radial-gradient edges so they blend seamlessly into the background

## [2.0.1] — 2026-09-10

### Fixed

- **Sidebar layout** — Bottom tab bar is compact again; the Quit button now sits alone at the bottom of the sidebar on desktop and as a separate icon on the far end of the mobile bar
- **Responsive polish** — Nav labels hidden on narrow phones (icon-only tabs), top bar and Bank/Report rows wrap instead of overflowing, forecast table scrolls horizontally

## [2.0.0] — 2026-09-10

### Added

- **Warehouse capacity & limits** — Cards now show used/free capacity with a fill bar; storing and buying goods is capped by vehicle carry capacity and warehouse room
- **Warehouse upgrades** — Upgrade any warehouse (up to 3 levels, +25% capacity each) to increase storage
- **Warehouse cost breakdown** — Rent, maintenance, security, electricity, and operations are now itemized per day (shown on cards and in the daily ledger)
- **End Day (sleep)** — New button in the top bar skips to the next day so prices update with supply/demand trends without traveling
- **Insights page** — New `/insights` hub with:
  - **Daily Herald** — free newspaper of active events and trending goods
  - **Hire professionals** — 30-day contracts for a Market Analyst (price forecast with confidence), Govt. Cargo Manager (best buy/sell cities), and Trade Insider (hot goods tips), billed daily
- **Market search** — Filter goods by name or category in the market listing
- **Quit to menu** — Sidebar button with a confirmation modal returns to the splash screen

### Changed

- Buying goods now respects the selected vehicle's carry capacity (with an inline warning in the trade ticket)
- Warehouse asset value on the Dashboard scales with upgrade level

### Fixed

- Warehouse storage used the upgraded capacity everywhere (store/withdraw/limits)

## [1.3.0] — 2026-09-10

### Added

- **Commodity emojis** — Each good now shows an emoji icon (🌾 Rice, ☕ Coffee, 🍬 Sugar, 🐟 Fish, 🛞 Rubber, 🔩 Steel, 💻 Electronics, ⛽ Fuel, 💊 Medicine, 👕 Clothing, 🧱 Construction) across Market, Map, Dashboard signals, Warehouse, and the final Report

## [1.2.1] — 2026-09-10

### Fixed

- **Consistent panel styling** — Paper (cream) panels on Dashboard ("What you hold"), Market ("Confirm purchase"), Bank ("Credit rating" / "Take a loan"), and Report ("Where the profit came from") now use the same dark ledger styling as all other panels in both themes
- Input fields on Market, Bank, and Warehouse now share the same dark inset style instead of the light cream background
- Amount/error text tones brightened for contrast on dark panels

## [1.2.0] — 2026-09-10

### Added

- **New splash screen** — The root `/` route is now the splash/opener page with the Kongsi logo
- **Theme-aware logo** — Shows `kongsi-dark.webp` on `#272B2E` background in dark mode, `kongsi-light.webp` on `#F2F1EC` background in light mode
- **New favicon** — Replaced icon with `kongsi-transparent.png`
- **Reworked routes** — Game pages now live under `/dashboard`, `/market`, `/map`, `/garage`, `/warehouse`, `/bank`, `/report`; the root `/` is the splash screen

### Changed

- Game begins at the splash screen; "Start New Game" initializes and enters `/dashboard`
- "Start a new venture" on the Report page now returns to a fresh `/dashboard`
- Removed the dead "Updates" nav item from the in-game sidebar (changelog is reachable from splash)

### Fixed

- Report page "Start a new venture" now navigates correctly after creating a new game

## [1.1.0] — 2026-09-10

### Added

- **Splash screen** — Animated opener page with game title, description, and start button
- **Light mode** — Full light theme with warm paper tones, toggleable from splash screen or in-game topbar
- **Theme toggle** — Sun/Moon button in topbar and splash screen to switch between dark and light mode
- **Theme persistence** — Theme preference saved to localStorage

### Fixed

- **Report page crash** — Fixed `state is not defined` reference error on credit rating display
- **Infinite render loop** — Fixed Zustand selectors returning new object references on each render
- **White areas on Dashboard/Bank** — PaperPanel and input backgrounds now adapt to current theme

## [1.0.0] — 2026-09-10

### Added

- **Dynamic market system** with supply/demand-driven prices across 8 cities
- **11 commodities**: Rice, Coffee, Sugar, Fish, Rubber, Steel, Electronics, Fuel, Medicine, Clothing, Construction Materials
- **8 cities** with unique economic identities: Bandung, Jakarta, Surabaya, Semarang, Yogyakarta, Malang, Medan, Makassar
- **5 vehicle types**: Motorcycle, Pickup, Truck, Refrigerated Truck, Container Truck
- **3 warehouse sizes** with daily operating costs
- **Banking system**: Bank loans (low interest) and Moneylender (high interest)
- **Credit rating system** that affects loan eligibility
- **Market events**: Weather, disasters, festivals, and economic shifts
- **Perishable goods** with quality decay over time
- **Vehicle maintenance** and breakdown risk mechanics
- **Trip expense system**: Fuel, tolls, driver wages, loading costs, maintenance
- **180-day game** with final economic report and ranking
- **8 objectives** to track throughout the season
- **Save/load system** with JSON export
- **Dashboard** with net worth, cash movement, market signals, and active events
- **Market page** with live price comparison, supply/demand meters, and sparkline charts
- **Map page** for city-to-city travel with expense estimation
- **Garage** for vehicle management and purchase
- **Warehouse** for goods storage and management
- **Bank page** for loans and credit rating
- Dark theme with brass accents for an old-world trading feel