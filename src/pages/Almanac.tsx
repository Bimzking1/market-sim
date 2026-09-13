import { useMemo, useState } from "react";
import { ReadoutPanel } from "../components/Panel";
import { COMMODITIES, ALL_COMMODITY_IDS } from "../engine/commodities";
import { citiesThatSellCommodity, CITIES, ALL_CITY_IDS } from "../engine/cities";
import type { CityId } from "../types";

interface Row {
  cid: (typeof ALL_COMMODITY_IDS)[number];
  name: string;
  emoji: string;
  category: string;
  availableEverywhere: boolean;
  cities: CityId[];
}

export function Almanac() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<"all" | CityId>("all");
  const [catFilter, setCatFilter] = useState<"all" | string>("all");

  const categories = useMemo(
    () =>
      [...new Set(ALL_COMMODITY_IDS.map((cid) => COMMODITIES[cid].category))].sort(),
    []
  );

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    return ALL_COMMODITY_IDS.map((cid) => {
      const def = COMMODITIES[cid];
      return {
        cid,
        name: def.name,
        emoji: def.emoji,
        category: def.category,
        availableEverywhere: def.availableEverywhere,
        cities: citiesThatSellCommodity(cid),
      };
    }).filter((row) => {
      if (cityFilter !== "all" && !row.cities.includes(cityFilter)) return false;
      if (catFilter !== "all" && row.category !== catFilter) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q) || row.category.includes(q);
    });
  }, [search, cityFilter, catFilter]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Commodity reference</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Almanac
        </h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value as "all" | CityId)}
          className="border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-200 focus:border-brass-400 focus:outline-none"
        >
          <option value="all">All cities</option>
          {ALL_CITY_IDS.map((cid) => (
            <option key={cid} value={cid}>
              {CITIES[cid].name}
            </option>
          ))}
        </select>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-200 focus:border-brass-400 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search goods…"
          className="border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-200 placeholder-mist-500 focus:border-brass-400 focus:outline-none"
        />
        <span className="ml-auto text-[12px] text-mist-400">
          {rows.length} {rows.length === 1 ? "good" : "goods"}
        </span>
      </div>

      <ReadoutPanel title="Goods at a glance" eyebrow="City and category filters">
        <p className="mb-4 text-[13px] text-mist-400">
          Common goods are sold in every city. Signature goods only appear where
          they are produced — travel there (or use a warehouse agent) to buy them.
          Prices stay secret until you arrive.
        </p>

        {rows.length === 0 ? (
          <p className="text-[14px] text-mist-400">No goods match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {rows.map((row) => (
              <div
                key={row.cid}
                className="flex flex-col border border-ink-700 bg-ink-900/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[16px]">{row.emoji}</span>
                  <span className="text-[10px] uppercase tracking-wide text-mist-500">
                    {row.category}
                  </span>
                </div>
                <p
                  className="mt-1 truncate text-[13px] text-paper-100"
                  title={row.name}
                >
                  {row.name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {row.availableEverywhere ? (
                    <span className="rounded-full border border-jade-400/40 px-1.5 py-0.5 text-[10px] text-jade-300">
                      Every city
                    </span>
                  ) : (
                    <>
                      {row.cities.slice(0, 3).map((cid) => (
                        <span
                          key={cid}
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            cityFilter === cid
                              ? "bg-brass-400/20 text-brass-300"
                              : "bg-brass-400/10 text-brass-300/80"
                          }`}
                        >
                          {CITIES[cid]?.name ?? cid}
                        </span>
                      ))}
                      {row.cities.length > 3 && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] text-mist-500">
                          +{row.cities.length - 3}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReadoutPanel>
    </div>
  );
}