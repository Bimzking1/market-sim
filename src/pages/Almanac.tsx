import { useMemo, useState } from "react";
import { ReadoutPanel } from "../components/Panel";
import { COMMODITIES, ALL_COMMODITY_IDS } from "../engine/commodities";
import { citiesThatSellCommodity, CITIES } from "../engine/cities";

export function Almanac() {
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return ALL_COMMODITY_IDS.map((cid) => ({
      cid,
      def: COMMODITIES[cid],
      cities: citiesThatSellCommodity(cid),
    })).filter(({ def, cities }) => {
      if (!q) return true;
      const nameHit = def.name.toLowerCase().includes(q);
      const cityHit = cities.some((cid2) =>
        CITIES[cid2].name.toLowerCase().includes(q)
      );
      return nameHit || cityHit;
    });
  }, [filter]);

  const staples = rows.filter((r) => r.def.availableEverywhere);
  const signature = rows.filter((r) => !r.def.availableEverywhere);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[13px] text-mist-400">Commodity reference</p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          Almanac
        </h1>
      </header>

      <ReadoutPanel
        title="Where goods are sold"
        action={
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter goods or cities…"
            className="w-full max-w-[220px] border border-ink-600 bg-ink-900 px-3 py-2 text-[13px] text-paper-200 placeholder-mist-500 focus:border-brass-400 focus:outline-none"
          />
        }
      >
        <p className="mb-4 text-[13px] text-mist-400">
          Common goods are sold in every city. Signature goods only appear
          where they are produced — you must travel there (or buy through a
          warehouse agent) to get them. Prices are a trader's secret and are
          only revealed once you arrive in a city.
        </p>

        {rows.length === 0 && (
          <p className="text-[14px] text-mist-400">
            No goods match “{filter}”.
          </p>
        )}

        {signature.length > 0 && (
          <Section label="Signature goods (limited cities)">
            <ul className="divide-y divide-ink-700">
              {signature.map(({ cid, def, cities }) => (
                <li key={cid} className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[14px] text-paper-100">
                      {def.emoji} {def.name}
                    </p>
                    <span className="text-[11px] text-mist-500">
                      {def.category}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {cities.map((cityId) => (
                      <span
                        key={cityId}
                        className="px-2 py-0.5 text-[12px] text-brass-300 bg-brass-400/10"
                      >
                        {CITIES[cityId].name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {staples.length > 0 && (
          <Section label="Common goods (sold everywhere)">
            <ul className="divide-y divide-ink-700">
              {staples.map(({ cid, def }) => (
                <li
                  key={cid}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <p className="text-[14px] text-paper-100">
                    {def.emoji} {def.name}
                  </p>
                  <span className="text-[12px] text-mist-400">
                    Every city
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </ReadoutPanel>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="mb-2 text-[12px] uppercase tracking-wide text-mist-400">
        {label}
      </p>
      {children}
    </div>
  );
}