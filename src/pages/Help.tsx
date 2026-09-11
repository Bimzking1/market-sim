import { useState } from "react";
import { Search, ChevronDown, FileQuestion } from "lucide-react";
import { ReadoutPanel } from "../components/Panel";

interface HelpEntry {
  question: string;
  answer: string;
  tags: string[];
}

const ENTRIES: HelpEntry[] = [
  {
    question: "What is Kongsi?",
    answer:
      "Kongsi is a 180-day trading venture. You start in Bandung with Rp 10.000.000 and a Pickup Truck. Buy goods where they are cheap, haul them where they sell for more, and build your fortune before the season ends.",
    tags: ["about", "game", "intro", "start"],
  },
  {
    question: "How long does a game last?",
    answer:
      "A game runs for exactly 180 days. Each day costs money (warehouses, staff, loan interest, vehicle upkeep) and markets shift. When day 180 passes, the venture closes and you receive a final report with a rank.",
    tags: ["days", "length", "duration", "180", "time"],
  },
  {
    question: "How do I make money?",
    answer:
      "Buy low in one city and sell high in another. Cities produce and consume different goods, which drives prices apart. Use the Market page for prices, the Map to compare cities, and warehouses to hold stock until prices rise. Each trade costs a 1.5% market fee.",
    tags: ["profit", "money", "trade", "buy", "sell", "how"],
  },
  {
    question: "What is net worth?",
    answer:
      "Net worth equals cash plus inventory (valued at current-city prices), plus goods stored in warehouses (valued at each warehouse's city), plus vehicle value (purchase price scaled by condition), minus outstanding debt. Objectives are measured against net worth.",
    tags: ["net worth", "wealth", "score"],
  },
  {
    question: "How is money written in the game?",
    answer:
      "Money uses Indonesian formatting: thousands are separated by dots and decimals by a comma. Examples: Rp 13.000, Rp 9.500.000, Rp 45.000,25.",
    tags: ["currency", "format", "rupiah", "rp", "money"],
  },
  {
    question: "Why are prices different between cities?",
    answer:
      "Every city has a personality: agricultural, commercial, industrial, tourist, or mining. It produces some goods (high supply = cheaper) and consumes others (high demand = more expensive). A good's price reflects its local supply and demand plus any active market events.",
    tags: ["price", "city", "supply", "demand", "cheap", "expensive"],
  },
  {
    question: "How do I move to another city?",
    answer:
      "Open the Map page and pick a destination. Within the same region you drive your vehicle: fuel, tolls, a driver, loading, and maintenance — plus a small chance of an unexpected expense. Crossing into another region sets sail instead: the ship charges a port fee, uses less fuel, is slower, and has a different driver tariff. Longer trips take more days, during which perishable goods spoil. You must have enough cash to cover the trip.",
    tags: ["travel", "move", "map", "city", "journey", "fuel", "ship", "sea"],
  },
  {
    question: "Do vehicles wear out?",
    answer:
      "Yes. Every kilometer driven reduces condition, and a low-condition vehicle is more likely to break down. Service a vehicle anytime in the Garage to restore it to 100%. Every day each vehicle also costs upkeep (10% of its maintenance rate).",
    tags: ["vehicle", "condition", "repair", "service", "maintenance", "garage"],
  },
  {
    question: "Why did my goods spoil?",
    answer:
      "Some goods are perishable: rice loses 3% a day, fish 8%, and medicine 2%. Perishables also spoil while you travel, unless your vehicle has perishable protection (the Refrigerated Truck is best). Sell perishables quickly or lock them in a warehouse — warehouses protect goods from spoiling.",
    tags: ["spoil", "perishable", "rot", "fish", "rice", "medicine"],
  },
  {
    question: "What do the different vehicles do?",
    answer:
      "There are five vehicles: Motorcycle (Rp 15M, 50 units), Pickup Truck (Rp 85M, 200 units), Truck (Rp 250M, 600 units), Refrigerated Truck (Rp 450M, 500 units, 70% perishable protection), and Container Truck (Rp 650M, 1.500 units). Bigger vehicles carry more but cost more to run.",
    tags: ["vehicle", "types", "truck", "pickup", "motorcycle", "capacity"],
  },
  {
    question: "What are warehouses for?",
    answer:
      "Warehouses store goods so they don't clog your vehicle, and they stop perishables from spoiling. You buy a warehouse by paying 30 days of rent upfront. You can then wait for prices to rise before selling. Owned warehouses also add asset value to your net worth. You can even buy, upgrade, store, and withdraw remotely — but a 6% delegation fee applies to any action handled from another city.",
    tags: ["warehouse", "storage", "store", "capacity", "delegate", "remote"],
  },
  {
    question: "How much do warehouses cost?",
    answer:
      "There are three sizes: Small (500 units), Medium (2.000 units), and Large (10.000 units). The purchase price is 30 days of rent upfront. Every day you pay rent, maintenance, security, electricity, and operations for each warehouse you own. Every city has a cost multiplier — Jakarta and Jayapura are the priciest (×1.6), Mataram the cheapest (×0.75).",
    tags: ["warehouse", "cost", "rent", "price", "daily", "city"],
  },
  {
    question: "Can I expand a warehouse?",
    answer:
      "Yes. Upgrades add 25% capacity per level, up to 3 levels, at a cost of Rp 800 per added storage unit, scaled by the warehouse's city multiplier. Capacity with upgrades: level 1 = +25%, level 2 = +50%, level 3 = +75%. Upgrading a warehouse in another city adds the 6% delegation fee.",
    tags: ["warehouse", "upgrade", "expand", "level", "capacity"],
  },
  {
    question: "What is the credit rating?",
    answer:
      "Your credit rating starts at 600 and scales to 900. It rises slowly when you have no loans and falls sharply when loans become due soon or overdue. It determines your maximum loan amount: Rp 10M × (0.5 + rating / 200).",
    tags: ["credit", "rating", "score", "bank", "loan"],
  },
  {
    question: "How do bank loans work?",
    answer:
      "Borrow from the bank at 0.1% interest per day, or from the moneylender at 0.3% per day. Loans must be repaid within 30 days and accrue interest every day. Paying late hurts your credit rating. The moneylender has no limit checks, so it's a last resort.",
    tags: ["loan", "borrow", "bank", "moneylender", "interest", "debt"],
  },
  {
    question: "What happens if I owe too much?",
    answer:
      "Outstanding loans drag down your net worth and pile up daily interest. Defaulting crushes your credit rating, which shrinks how much you can borrow later. There is no bankruptcy — you can keep playing even with debt, but it makes objectives hard to reach.",
    tags: ["debt", "loan", "owe", "bankrupt", "interest"],
  },
  {
    question: "What is the Insights page for?",
    answer:
      "Insights is your intelligence desk. It always shows the free Daily Herald (active events and trending goods). You can also hire professionals with 30-day contracts: the Market Analyst forecasts prices, the Govt. Cargo Manager reveals the best buy and sell cities, and the Trade Insider tips hot goods. Short on patience? The Premium Wire sells one extra story at a time for Rp 1.000 — quality declines after the desk runs dry.",
    tags: ["insights", "staff", "analyst", "broker", "cargo", "forecast", "hire", "news"],
  },
  {
    question: "What are market events?",
    answer:
      "Random events — droughts, factory fires, festivals, fuel shortages, and more — temporarily change supply and demand in specific cities, spiking or crashing prices. They last between 2 and 12 days. Watch the Daily Herald on the Insights page to know what's active.",
    tags: ["event", "weather", "random", "disaster", "herald"],
  },
  {
    question: "What about the calendar and rare conditions?",
    answer:
      "Your venture starts on the real current date, and each game day is one calendar day. Festive occasions (Christmas, Chinese New Year, Lebaran, Nyepi, Independence Day) and seasons (harvests, year-end sales) swing prices in specific cities on fixed dates. Rarer still are no-stock conditions: the market is effectively banned (e.g. Silk Export Ban, Batik Quota Freeze) and supply vanishes for a few days, so whoever stocked a warehouse beforehand sells at a fortune. The Insights forecast desk leaks these 7–30 days ahead — never more than a month in advance.",
    tags: ["calendar", "date", "holiday", "season", "rare", "banned", "no stock"],
  },
  {
    question: "How do loan due dates work?",
    answer:
      "Loans are due 30 days after you take them, which is shown as a real calendar date (for example 'Due 11 October 2026'). The last two days before the due date the loan shows as due-soon, and after the due date it becomes overdue and drags your credit rating down.",
    tags: ["loan", "due", "date", "repay", "deadline"],
  },
  {
    question: "What costs hit me every day?",
    answer:
      "At the end of each day you pay: loan interest (if any), daily warehouse costs, staff wages, and vehicle upkeep. Always review the End Day confirmation to see exactly what the night will cost, and check your daily ledger for a breakdown.",
    tags: ["cost", "daily", "expenses", "fee", "wages", "ledger"],
  },
  {
    question: "What are the objectives?",
    answer:
      "Ten goals: reach Rp50M, Rp200M, and Rp500M net worth; own 3 vehicles; own 2 warehouses; make Rp100M from trades; visit all 18 cities; and finish with zero debt. They are tracked on your Dashboard report.",
    tags: ["objective", "goal", "win", "target", "achievement"],
  },
  {
    question: "How much is my saved net worth worth at the end?",
    answer:
      "When the 180 days are up, the final report ranks you by net worth. Rank 1 requires Rp1B or more, and rank 8 is under Rp10M. Sell everything, repay loans, and travel the full map before the closing bell for the best score.",
    tags: ["rank", "report", "end", "final", "score", "win"],
  },
  {
    question: "How do I save and load the game?",
    answer:
      "Tap the save button (or End Day is a separate action) in the top bar and confirm — your game downloads as a JSON file. To resume, open the Load Save File button on the start screen and pick that file. Saves are stored on your device, not in the cloud.",
    tags: ["save", "load", "file", "json", "resume"],
  },
  {
    question: "How do trading fees work?",
    answer:
      "Every buy and sell on the Market charges a 1.5% fee on the gross amount. The trade ticket shows the fee before you confirm, so you always know the true cost of a deal.",
    tags: ["fee", "fee rate", "commission", "tax", "trade"],
  },
  {
    question: "Where should I start trading?",
    answer:
      "Bandung produces coffee and rubber cheaply, while Jakarta and Surabaya pay well for them. Early on, buy coffee in your home city, and compare the Map to find a buyer. Avoid hauling fish long distances — it spoils fast.",
    tags: ["start", "bandung", "first", "early", "advice", "strategy"],
  },
];

export function Help() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ENTRIES.filter((e) =>
        `${e.question} ${e.answer} ${e.tags.join(" ")}`.toLowerCase().includes(q)
      )
    : ENTRIES;

  const toggle = (q: string) => setOpen((cur) => (cur === q ? null : q));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-mist-400">Guide & reference</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Help & FAQ
        </h1>
      </header>

      <div className="relative">
        <Search
          size={15}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(null);
          }}
          placeholder="Search help, rules, money, cities, loans…"
          className="w-full border border-ink-600 bg-ink-900 py-2.5 pl-9 pr-3 text-[14px] text-paper-100 placeholder:text-mist-400 focus:border-brass-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Game length" value="180 days" />
        <Fact label="Starting cash" value="Rp 10.000.000" />
        <Fact label="Cities" value="8" />
        <Fact label="Commodities" value="11" />
      </div>

      <ReadoutPanel eyebrow="Knowledge base" title={`${filtered.length} articles`}>
        {filtered.length === 0 ? (
          <p className="text-[14px] text-mist-400">
            Nothing matches “{query}”. Try a broader word like “loan”, “warehouse”, or
            “travel”.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700">
            {filtered.map((e) => {
              const isOpen = open === e.question;
              return (
                <li key={e.question}>
                  <button
                    type="button"
                    onClick={() => toggle(e.question)}
                    className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2.5 text-[14px] text-paper-100">
                      <FileQuestion size={15} strokeWidth={1.75} className="shrink-0 text-brass-400" />
                      <span>{e.question}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={1.75}
                      className={`shrink-0 text-mist-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-4 pl-[26px] pr-6 text-[13px] leading-relaxed text-mist-300">
                      {e.answer}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ReadoutPanel>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink-700 bg-ink-800/60 p-3 text-center">
      <p className="text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
      <p className="font-nums font-display text-[15px] text-paper-100">{value}</p>
    </div>
  );
}