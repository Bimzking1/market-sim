import { Link } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";

const changelog = [
  {
    version: "2.7.0",
    date: "2026-09-11",
    changes: [
      "Market polish — the buy/sell tab no longer resets to Buy when you switch goods; active tabs are tinted green (Buy) and red (Sell); the Confirm buttons now use white text",
      "Market sorting — sort goods by name, price, or trend, ascending or descending, right from the search bar",
      "Market rows — price is now its own column and each good shows how many you hold; supply/demand moved alongside",
      "Inventory — clicking anywhere on a row expands its lot detail instead of only the small button",
      "Signature goods spread — regional specialties now appear in two cities each (Batik in Yogyakarta & Semarang, Ulos in Medan & Padang, Sasirangan in Banjarmasin & Pontianak, Silk in Makassar & Manado, Orchid in Bandung & Malang, and more); Rendang, Pempek, Noken, and Nutmeg stay single-city",
      "Fixed garage lot lines — cargo details no longer break mid-city-name; each lot shows price on one side and city · date on the other",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-09-11",
    changes: [
      "Fixed net worth — vehicles no longer count their resale value, so buying goods no longer inflates net worth by the truck's price (cash-only start, no more phantom +Rp 85M). Net worth = cash + goods + stored stock − debt",
      "Per-vehicle cargo — each vehicle carries its own goods; buying, selling, travelling, and storing all follow the selected vehicle",
      "Garage cargo & transfers — the Garage now lists every vehicle's cargo with each lot's price, city, and date, and lets you move goods freely between any two vehicles or between a vehicle and a warehouse in your current city",
      "Inventory detail table — goods now open into a per-lot table showing quantity, unit price, purchase city, and date, with average and total cost in the footer",
      "Bank makeover — the two lenders are elegant offer cards showing interest rate, daily interest, 30-day interest, and the repayment date",
      "Compact Almanac — goods are now a dense grid with city and category dropdown filters plus search",
      "Save format v4 with per-vehicle cargo; older saves are migrated automatically",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-09-11",
    changes: [
      "Inventory page — lists every good you own across your vehicle and all warehouses, breaking each item into its purchase lots ('25 sacks bought at Rp 12.000') with the average price per unit and grand totals",
      "Almanac page — a searchable commodity reference showing all goods and the cities they appear in, without revealing prices",
      "50 commodities — 25 new staples (palm oil, tea, cocoa, banana, mango, chili, soybeans, tempeh, tofu, chicken, beef, eggs, milk, salt, cement, timber, glass, ceramics, paint, rope, nails, paper, batteries, car parts, fertilizer) plus 6 new regional specialties (Orchid, Lumpia, Apples, Durian, Lombok Pearls, Ulos Weave)",
      "Local availability — common goods sell everywhere, but signature goods only appear where produced (Noken only in Jayapura); Market, buy/sell, and Insights are filtered to the current city, and the Map shows produced goods instead of other cities' prices",
      "Warehouse agent buying — a 'Buy from other cities' panel on the Market lets you buy in any city where you own a warehouse (1.5% market fee + 6% agent fee), stored straight into that warehouse",
      "Trading-lot prices — purchases are recorded as lots consumed FIFO on sell/store/withdraw/spoilage, shown on the Inventory page",
      "Visible confirm buttons — purchase confirmations turn green, sales and costs turn red, on both the ticket and the dialog",
      "Premium Wire panel moved up on Insights with the buy button in its header",
      "Save format v3 with inventory and warehouse lots; older v2 saves are migrated on load",
    ],
  },
  {
    version: "2.4.0",
    date: "2026-09-11",
    changes: [
      "Real calendar — the venture starts on the actual current date; top bar, dashboard, and Insights show the in-game date and each game day advances it",
      "Seasonal conditions — festive dates move prices in specific cities (Christmas sweet rush in Surabaya, Lebaran batik rush in Yogyakarta, Deepavali in Medan, harvest tides in Makassar, and more)",
      "Rare no-stock conditions — market bans where supply vanishes for days (Lunar New Year closures, Nyepi silence, Silk Export Ban, Batik Quota Freeze); stock a warehouse beforehand to sell into the frenzy",
      "Insights forecast desk — a new panel leaks upcoming occasions 7–30 days ahead with the date, city, commodity, and days to prepare; never more than a month out",
      "Loan due dates — loans show real calendar due dates on the Bank page, in loan confirmations, and in dashboard warnings",
      "Help articles for the calendar and rare conditions; intro briefing now shows the starting date",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-09-11",
    changes: [
      "Sea travel & 18 cities — Indonesia now spans 6 regions and 18 cities; crossing regions sails a ship (cheaper fuel, port fee, slower sea speed). Objective updated to visit all cities",
      "Signature goods — 8 new regional specialties produced only in their home city (Rendang, Pempek, Batik, Sasirangan, Jewelry, Silk, Nutmeg, Noken) make 19 commodities total",
      "Per-city warehouse costs — each city has a cost multiplier (Jakarta & Jayapura ×1.6 down to Mataram ×0.75) on rent, upkeep, purchase, and upgrades",
      "Remote warehouse delegation — buy, upgrade, store, and withdraw in any city from anywhere for a 6% delegation fee",
      "Premium Wire — Insights sells one extra forecast-derived story for Rp 1.000, plus spoof headlines once the desk runs dry",
      "Space Grotesk for numbers, pointer cursors on buttons, uisfx.com click/confirm/toggle/save sounds, toast notifications on travel arrival",
      "Fixed travel 'no effect' bug — the confirmation now runs inside the road-trip scope where route data lives",
      "Intro screen now uses a three-column desktop layout and explains sea routes, trucks, and warehouse delegation",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-09-11",
    changes: [
      "Confirmation dialogs — every money-changing action now asks first (buy/sell, travel, vehicles, warehouses, loans, staff, Save, End Day) showing details, cash on hand, amount spent/received, and projected cash after",
      "Help & FAQ page — new /help page with a search box over a knowledge base of rules, money, cities, travel, warehouse, loans, and more",
      "Full currency formatting — money always shown in full Indonesian format (Rp 13.000, Rp 9.500.000, Rp 45.000,25)",
      "Fixed Insights crash — price forecasts no longer crash the page",
      "Fixed intro screen warnings to match the real rules",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-09-10",
    changes: [
      "Intro briefing screen — after starting a new game, a dedicated page introduces the player with starting city, capital, objectives, warnings, and tips",
      "Desktop sidebar — sticky full-height sidebar with scrollable nav and Quit pinned permanently at the bottom",
      "Mobile navigation — bottom tab bar replaced by a hamburger menu that opens a slide-out drawer with nav links, theme toggle, save, and quit",
      "Sidebar branding — \"Kongsi\" title now includes a package icon",
      "Splash screen — logo images have feathered radial-gradient edges for seamless background blending",
    ],
  },
  {
    version: "2.0.1",
    date: "2026-09-10",
    changes: [
      "Sidebar layout — compact bottom tab bar restored; the Quit button sits alone at the bottom on desktop and as a separate icon on mobile",
      "Responsive polish — nav labels hidden on narrow phones, top bar and Bank/Report rows wrap instead of overflowing, forecast table scrolls horizontally",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-09-10",
    changes: [
      "Warehouse capacity & limits — cards show used/free capacity with a fill bar; buying goods is capped by the vehicle's carry capacity",
      "Warehouse upgrades — upgrade any warehouse (up to 3 levels, +25% capacity each)",
      "Warehouse cost breakdown — rent, maintenance, security, electricity, and operations itemized per day",
      "End Day (sleep) — top-bar button skips to the next day so prices update with supply/demand trends",
      "Insights page — Daily Herald newspaper, plus 30-day contracts to hire a Market Analyst (price forecast), Govt. Cargo Manager (best buy/sell cities), and Trade Insider (hot goods tips)",
      "Market search — filter goods by name or category",
      "Quit to menu — sidebar button with a confirmation modal",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-09-10",
    changes: [
      "Commodity emojis — each good now shows an emoji icon (🌾 Rice, ☕ Coffee, 🍬 Sugar, 🐟 Fish, 🛞 Rubber, 🔩 Steel, 💻 Electronics, ⛽ Fuel, 💊 Medicine, 👕 Clothing, 🧱 Construction) across Market, Map, Dashboard signals, Warehouse, and the final Report",
    ],
  },
  {
    version: "1.2.1",
    date: "2026-09-10",
    changes: [
      "Consistent panel styling — Paper (cream) panels on Dashboard, Market, Bank, and Report now use the same dark ledger styling as all other panels in both themes",
      "Input fields on Market, Bank, and Warehouse share the same dark inset style",
      "Amount and error text tones brightened for contrast on dark panels",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-09-10",
    changes: [
      "New splash screen — the root / route is now the opener page with the Kongsi logo",
      "Theme-aware logo — kongsi-dark.webp on #272B2E bg in dark mode, kongsi-light.webp on #F2F1EC bg in light mode",
      "New favicon — replaced icon with kongsi-transparent.png",
      "Game pages now live under /dashboard, /market, /map, /garage, /warehouse, /bank, /report",
      "Start a new venture on the Report page now returns to a fresh /dashboard",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-09-10",
    changes: [
      "Splash screen — Animated opener page with game title, description, and start button",
      "Light mode — Full light theme with warm paper tones, toggleable from splash screen or in-game topbar",
      "Theme toggle — Sun/Moon button in topbar and splash screen to switch between dark and light mode",
      "Theme persistence — Theme preference saved to localStorage",
      "Fixed Report page crash — state is not defined reference error on credit rating display",
      "Fixed infinite render loop — Zustand selectors returning new object references on each render",
      "Fixed white areas on Dashboard/Bank — PaperPanel and input backgrounds now adapt to current theme",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-09-10",
    changes: [
      "Initial release of Kongsi — Trading Economy Game",
      "Dynamic market system with supply/demand-driven prices across 8 cities",
      "11 commodities: Rice, Coffee, Sugar, Fish, Rubber, Steel, Electronics, Fuel, Medicine, Clothing, Construction Materials",
      "8 cities with unique economic identities: Bandung, Jakarta, Surabaya, Semarang, Yogyakarta, Malang, Medan, Makassar",
      "5 vehicle types: Motorcycle, Pickup, Truck, Refrigerated Truck, Container Truck",
      "3 warehouse sizes with daily operating costs",
      "Banking system: Bank loans (low interest) and Moneylender (high interest)",
      "Credit rating system that affects loan eligibility",
      "Market events system: Weather, disasters, festivals, and economic shifts",
      "Perishable goods with quality decay over time",
      "Vehicle maintenance and breakdown risk mechanics",
      "Trip expense system: Fuel, tolls, driver wages, loading costs, maintenance",
      "180-day game with final economic report and ranking",
      "8 objectives to track throughout the season",
      "Save/load system with JSON export",
      "Dashboard with net worth, cash movement, market signals, and active events",
      "Market page with live price comparison, supply/demand meters, and sparkline charts",
      "Map page for city-to-city travel with expense estimation",
      "Garage for vehicle management and purchase",
      "Warehouse for goods storage and management",
      "Bank page for loans and credit rating",
      "Dark theme with brass accents for an old-world trading feel",
    ],
  },
];

export function Changelog() {
  return (
    <div className="min-h-screen bg-ink-900 text-paper-200">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="text-[14px] text-brass-300 hover:text-brass-200"
          >
            ← Back to Kongsi
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-4xl font-semibold text-paper-100 mb-8">
          Changelog
        </h1>

        <div className="space-y-10">
          {changelog.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-baseline gap-4 mb-4">
                <h2 className="font-display text-2xl font-medium text-brass-300">
                  v{entry.version}
                </h2>
                <span className="text-[13px] text-mist-400">{entry.date}</span>
              </div>
              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[14px] text-paper-200"
                  >
                    <span className="text-mist-400 mt-1.5 shrink-0">
                      •
                    </span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
