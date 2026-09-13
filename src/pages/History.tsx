import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { ReadoutPanel } from "../components/Panel";
import { Dropdown, type DropdownOption } from "../components/Dropdown";
import { COMMODITIES } from "../engine/commodities";
import { CITIES } from "../engine/cities";
import { formatFullRp } from "../utils/format";
import { dateForDay, formatDateForDay, formatMonthYear } from "../engine/calendar";

type TypeFilter = "all" | "buy" | "sell";

export function History() {
  const transactions = useGameStore((s) => s.transactions);
  const startDate = useGameStore((s) => s.startDate);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const dayInputValue = (day: number) => {
    const d = dateForDay(startDate, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };
  const monthKeyOfDay = (day: number) => dayInputValue(day).slice(0, 7);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.day - a.day),
    [transactions]
  );

  const monthKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(monthKeyOfDay(t.day));
    return [...set].sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, startDate]);

  const monthOptions: DropdownOption[] = [
    { value: "all", label: "All time" },
    ...monthKeys.map((k) => ({
      value: k,
      label: formatMonthYear(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1)),
    })),
  ];

  const q = search.trim().toLowerCase();
  const rows = sorted.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (monthFilter !== "all" && monthKeyOfDay(t.day) !== monthFilter) return false;
    const dv = dayInputValue(t.day);
    if (fromDate && dv < fromDate) return false;
    if (toDate && dv > toDate) return false;
    if (q) {
      const name = COMMODITIES[t.commodityId].name.toLowerCase();
      const city = CITIES[t.cityId].name.toLowerCase();
      if (!name.includes(q) && !city.includes(q)) return false;
    }
    return true;
  });

  const hasDateFilter =
    monthFilter !== "all" || Boolean(fromDate) || Boolean(toDate);

  const clearDates = () => {
    setMonthFilter("all");
    setFromDate("");
    setToDate("");
  };

  const typeOptions: DropdownOption[] = [
    { value: "all", label: "All trades" },
    { value: "buy", label: "Bought" },
    { value: "sell", label: "Sold" },
  ];

  const buyVolume = rows
    .filter((t) => t.type === "buy")
    .reduce((s, t) => s + t.total, 0);
  const sellVolume = rows
    .filter((t) => t.type === "sell")
    .reduce((s, t) => s + t.total, 0);
  const feeTotal = rows.reduce((s, t) => {
    const marketFee = Math.round(t.total * 0.015);
    return s + marketFee + (t.delegationFee ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-mist-400">
          Every purchase and sale you've made
        </p>
        <h1 className="font-display text-3xl font-medium text-paper-100">
          History
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <ReadoutPanel eyebrow="Trades logged" title={String(rows.length)}>
          <p className="text-[12px] text-mist-400">
            {typeFilter === "all" ? "all types" : `only ${typeFilter}`}
          </p>
        </ReadoutPanel>
        <ReadoutPanel eyebrow="Bought vs sold" title={`${formatFullRp(buyVolume)} / ${formatFullRp(sellVolume)}`}>
          <p className="text-[12px] text-mist-400">
            total purchase vs sale cash flow
          </p>
        </ReadoutPanel>
        <ReadoutPanel eyebrow="Fees paid" title={formatFullRp(feeTotal)}>
          <p className="text-[12px] text-mist-400">
            market 1.5% + delegation 6% where applied
          </p>
        </ReadoutPanel>
      </div>

      <ReadoutPanel title="Trade log" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-700 px-5 py-3">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={15}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item or city…"
              className="w-full border border-ink-600 bg-ink-900 py-2 pl-9 pr-3 text-[13px] text-paper-100 placeholder:text-mist-400 focus:border-brass-400 focus:outline-none"
            />
          </div>
          <div className="w-40">
            <Dropdown
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as TypeFilter)}
              options={typeOptions}
            />
          </div>
          <div className="w-44">
            <Dropdown
              value={monthFilter}
              onChange={setMonthFilter}
              options={monthOptions}
              placeholder="All time"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              min={dayInputValue(1)}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-ink-600 bg-ink-900 px-2 py-2 font-nums text-[12px] text-paper-100 focus:border-brass-400 focus:outline-none"
            />
            <span className="text-[12px] text-mist-400">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-ink-600 bg-ink-900 px-2 py-2 font-nums text-[12px] text-paper-100 focus:border-brass-400 focus:outline-none"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={clearDates}
                className="inline-flex items-center gap-1 border border-ink-600 px-2 py-2 text-[12px] text-mist-300 hover:border-rust-400 hover:text-rust-300"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col gap-3 px-5 py-8">
            <p className="text-center text-[14px] text-mist-400">
              No trades logged yet. Buy or sell goods to build your ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-ink-800/60 text-[12px] uppercase tracking-wider text-mist-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit price</th>
                  <th className="px-4 py-3 text-right font-medium">Fees</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {rows.map((t, i) => {
                  const def = COMMODITIES[t.commodityId];
                  const marketFee = Math.round(t.total * 0.015);
                  const fee = marketFee + (t.delegationFee ?? 0);
                  return (
                    <tr key={i} className="text-[13px]">
                      <td className="px-4 py-3 text-mist-300 whitespace-nowrap">
                        {formatDateForDay(startDate, t.day)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium ${
                            t.type === "buy"
                              ? "bg-jade-500/15 text-jade-300"
                              : "bg-rust-500/15 text-rust-300"
                          }`}
                        >
                          {t.type === "buy" ? "Bought" : "Sold"}
                          {t.remote && (
                            <span className="text-[10px] uppercase tracking-wide opacity-70">
                              delegate
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-paper-100 whitespace-nowrap">
                        {def.emoji} {def.name}
                      </td>
                      <td className="px-4 py-3 text-right font-nums text-paper-100">
                        {t.quantity}
                        <span className="ml-1 text-[11px] text-mist-500">
                          {def.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-nums text-mist-300">
                        {formatFullRp(t.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-nums text-mist-300">
                        {fee > 0 ? `-${formatFullRp(fee)}` : "—"}
                        {t.delegationFee ? (
                          <span className="block text-[10px] text-brass-300">
                            incl 6% delegation
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-nums ${
                          t.type === "sell" ? "text-jade-300" : "text-paper-100"
                        }`}
                      >
                        {t.type === "sell" ? "+" : "-"}
                        {formatFullRp(t.total)}
                      </td>
                      <td className="px-4 py-3 text-mist-300 whitespace-nowrap">
                        {CITIES[t.cityId].name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ReadoutPanel>
    </div>
  );
}