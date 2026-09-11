import { NavLink, Outlet } from "react-router-dom";
import {
  NotebookPen,
  ArrowLeftRight,
  Map as MapIcon,
  Truck,
  Warehouse,
  Landmark,
  ScrollText,
  Save,
} from "lucide-react";
import { player } from "../data/mockData";
import { formatFullRp } from "../utils/format";

const navItems = [
  { to: "/", label: "Ledger", icon: NotebookPen, end: true },
  { to: "/market", label: "Market", icon: ArrowLeftRight },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/garage", label: "Garage", icon: Truck },
  { to: "/warehouse", label: "Warehouse", icon: Warehouse },
  { to: "/bank", label: "Bank", icon: Landmark },
  { to: "/report", label: "Report", icon: ScrollText },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-900 text-paper-200 md:flex-row">
      <Sidebar />
      <div className="order-1 flex min-w-0 flex-1 flex-col md:order-2">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="order-2 flex shrink-0 border-ink-700 bg-ink-950 md:order-1 md:w-56 md:flex-col md:border-r">
      <div className="hidden border-b border-ink-700 px-5 py-6 md:block">
        <p className="font-display text-xl font-semibold tracking-tight text-paper-100">
          Kongsi
        </p>
        <p className="mt-0.5 text-[13px] text-mist-400">Trading ledger</p>
      </div>
      <nav className="flex w-full justify-around md:flex-col md:justify-start md:px-3 md:py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[12px] md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-[14px] ${
                isActive
                  ? "text-brass-300 md:border-l-2 md:border-brass-400 md:bg-ink-800/60 md:text-brass-300"
                  : "text-mist-300 hover:text-paper-200 md:border-l-2 md:border-transparent"
              }`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink-700 bg-ink-900/95 px-4 py-3 md:px-8 md:py-4">
      <div className="flex items-center gap-4 md:gap-6">
        <div>
          <p className="text-[12px] text-mist-400">Day</p>
          <p className="font-nums font-display text-lg text-paper-100">
            {player.day}
            <span className="text-mist-400"> / {player.totalDays}</span>
          </p>
        </div>
        <div className="hidden h-8 w-px bg-ink-700 sm:block" />
        <div className="hidden sm:block">
          <p className="text-[12px] text-mist-400">Location</p>
          <p className="font-display text-lg text-paper-100">Bandung</p>
        </div>
      </div>

      <div className="flex items-center gap-5 md:gap-8">
        <Readout label="Cash" value={player.cash} />
        <Readout label="Net worth" value={player.netWorth} emphasize />
        <button
          type="button"
          title="Save or load — wire to the save-file system"
          className="border border-ink-600 p-2 text-mist-300 transition-colors hover:border-brass-400 hover:text-brass-300"
        >
          <Save size={16} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

function Readout({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="text-right">
      <p className="text-[12px] text-mist-400">{label}</p>
      <p
        className={`font-nums font-display text-lg ${
          emphasize ? "text-brass-300" : "text-paper-100"
        }`}
      >
        {formatFullRp(value)}
      </p>
    </div>
  );
}