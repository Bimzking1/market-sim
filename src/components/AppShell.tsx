import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  NotebookPen,
  ArrowLeftRight,
  Map as MapIcon,
  Truck,
  Warehouse,
  Landmark,
  Newspaper,
  ScrollText,
  Save,
  Moon,
  LogOut,
  Menu,
  X,
  Package,
  HelpCircle,
  Boxes,
  BookOpen,
} from "lucide-react";
import { useGameStore } from "../store/gameStore";
import { ThemeToggle } from "./ThemeToggle";
import { ConfirmDialog, confirmAction } from "./ConfirmDialog";
import { ToastHost } from "./Toast";
import { unlockSfx, playSfx } from "../lib/sfx";
import { formatFullRp } from "../utils/format";
import { VEHICLES } from "../engine/vehicles";
import { WAREHOUSES, warehouseDailyCost } from "../engine/warehouses";
import { STAFF } from "../engine/staff";
import { dailyInterest } from "../engine/banking";
import { CITY_COST_MULTIPLIER } from "../engine/cities";
import { formatDateForDay } from "../engine/calendar";
import type { StaffId } from "../types";

const navItems = [
  { to: "/dashboard", label: "Ledger", icon: NotebookPen },
  { to: "/market", label: "Market", icon: ArrowLeftRight },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/garage", label: "Garage", icon: Truck },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/warehouse", label: "Warehouse", icon: Warehouse },
  { to: "/bank", label: "Bank", icon: Landmark },
  { to: "/almanac", label: "Almanac", icon: BookOpen },
  { to: "/insights", label: "Insights", icon: Newspaper },
  { to: "/report", label: "Report", icon: ScrollText },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export function AppShell() {
  useEffect(() => {
    function handleFirstClick() {
      unlockSfx();
      document.removeEventListener("pointerdown", handleFirstClick);
    }
    document.addEventListener("pointerdown", handleFirstClick, { once: true });
    return () => document.removeEventListener("pointerdown", handleFirstClick);
  }, []);

  useEffect(() => {
    function handleClick(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("button:not(:disabled), a:not([aria-disabled]), summary")) {
        playSfx("press");
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, []);

  return (
    <div className="flex h-screen bg-ink-900 text-paper-200">
      <DesktopSidebar />
      <MobileDrawer />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <ConfirmDialog />
      <ToastHost />
    </div>
  );
}

function downloadJson(fileName: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function promptSave() {
  const state = useGameStore.getState();
  const fileName = `kongsi-save-day${state.currentDay}.json`;
  const ok = await confirmAction({
    title: "Save your venture?",
    description: "Your progress is saved to a JSON file on this device.",
    confirmLabel: "Download save",
    lines: [
      { label: "File", value: fileName },
      {
        label: "Current day",
        value: `${state.gameOver ? state.totalDays : state.currentDay} / ${state.totalDays}`,
      },
      { label: "Net worth", value: formatFullRp(state.playerNetWorth) },
    ],
  });
  if (!ok) return;
  playSfx("checkpoint");
  downloadJson(fileName, state.actions.saveGame());
}

async function promptEndDay() {
  const state = useGameStore.getState();
  const interest = dailyInterest(state.loans);
  const warehouseCost = state.warehouses.reduce(
    (s, wh) => s + warehouseDailyCost(WAREHOUSES[wh.typeId], CITY_COST_MULTIPLIER[wh.cityId] ?? 1),
    0
  );
  const staffCost = Object.entries(state.staffHires ?? {}).reduce(
    (s, [id, days]) => (days >= 2 ? s + STAFF[id as StaffId].dailyRate : s),
    0
  );
  const vehicleUpkeep = state.vehicles.reduce(
    (s, v) => s + Math.round(VEHICLES[v.typeId].maintenanceCost * 0.1),
    0
  );
  const total = interest + warehouseCost + staffCost + vehicleUpkeep;

  const lines: { label: string; value: string }[] = [];
  if (interest > 0)
    lines.push({ label: "Loan interest", value: `-${formatFullRp(interest)}` });
  if (warehouseCost > 0)
    lines.push({ label: "Warehouses", value: `-${formatFullRp(warehouseCost)}` });
  if (staffCost > 0)
    lines.push({ label: "Staff wages", value: `-${formatFullRp(staffCost)}` });
  if (vehicleUpkeep > 0)
    lines.push({ label: "Vehicle upkeep", value: `-${formatFullRp(vehicleUpkeep)}` });

  const ok = await confirmAction({
    title: state.gameOver
      ? "End day"
      : `End day ${state.currentDay}?`,
    description: "Markets shift overnight and operating costs are deducted.",
    confirmLabel: "End day",
    lines,
    currentCash: state.playerCash,
    cashChange: -total,
  });
  if (!ok) return;
  playSfx("select");
  state.actions.advanceTime();
}

function DesktopSidebar() {
  const navigate = useNavigate();
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ink-700 bg-ink-950 md:flex">
        <div className="border-b border-ink-700 px-5 py-6">
          <p className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-paper-100">
            <Package size={22} strokeWidth={1.75} className="text-brass-400" />
            Kongsi
          </p>
          <p className="mt-0.5 text-[13px] text-mist-400">Trading ledger</p>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[14px] ${
                  isActive
                    ? "border-l-2 border-brass-400 bg-ink-800/60 text-brass-300"
                    : "border-l-2 border-transparent text-mist-300 hover:text-paper-200"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setConfirmQuit(true)}
          className="flex items-center gap-3 border-t border-ink-700 px-5 py-3.5 text-[14px] text-mist-400 transition-colors hover:text-rust-300"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          Quit to menu
        </button>
      </aside>

      {confirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4">
          <div className="w-full max-w-sm border border-ink-600 bg-ink-800 p-6">
            <p className="font-display text-[18px] text-paper-100">
              Quit to menu?
            </p>
            <p className="mt-2 text-[14px] text-mist-300">
              Your progress is only kept if you save it to a file first. Are you
              sure you want to leave this venture?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmQuit(false)}
                className="flex-1 border border-ink-600 px-4 py-2.5 text-[14px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 bg-rust-500/20 px-4 py-2.5 text-[14px] text-rust-300 hover:bg-rust-500/30"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3.5 z-40 border border-ink-600 p-2 text-mist-300 md:hidden"
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/70" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-64 flex-col border-r border-ink-700 bg-ink-950"
          >
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-6">
              <p className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-paper-100">
                <Package size={22} strokeWidth={1.75} className="text-brass-400" />
                Kongsi
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-mist-400 hover:text-paper-100"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 text-[15px] ${
                      isActive
                        ? "border-l-2 border-brass-400 bg-ink-800/60 text-brass-300"
                        : "border-l-2 border-transparent text-mist-300 hover:text-paper-200"
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  <span className="max-w-full truncate">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-ink-700 px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  type="button"
                  title="Save game"
                  onClick={() => promptSave()}
                  className="border border-ink-600 p-2 text-mist-300 transition-colors hover:border-brass-400 hover:text-brass-300"
                >
                  <Save size={16} strokeWidth={1.75} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className="flex w-full items-center gap-3 border-t border-ink-700 pt-3 text-[14px] text-mist-400 transition-colors hover:text-rust-300"
              >
                <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
                Quit to menu
              </button>
            </div>
          </aside>
        </div>
      )}

      {confirmQuit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/80 p-4">
          <div className="w-full max-w-sm border border-ink-600 bg-ink-800 p-6">
            <p className="font-display text-[18px] text-paper-100">
              Quit to menu?
            </p>
            <p className="mt-2 text-[14px] text-mist-300">
              Your progress is only kept if you save it to a file first. Are you
              sure you want to leave this venture?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmQuit(false)}
                className="flex-1 border border-ink-600 px-4 py-2.5 text-[14px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 bg-rust-500/20 px-4 py-2.5 text-[14px] text-rust-300 hover:bg-rust-500/30"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TopBar() {
  const currentDay = useGameStore((s) => s.currentDay);
  const totalDays = useGameStore((s) => s.totalDays);
  const startDate = useGameStore((s) => s.startDate);
  const currentCity = useGameStore((s) => s.currentCity);
  const playerCash = useGameStore((s) => s.playerCash);
  const playerNetWorth = useGameStore((s) => s.playerNetWorth);
  const gameOver = useGameStore((s) => s.gameOver);

  const cityName = currentCity.charAt(0).toUpperCase() + currentCity.slice(1);
  const dateLabel = formatDateForDay(startDate, gameOver ? totalDays : currentDay);

  return (
    <header className="flex items-center justify-between gap-x-4 gap-y-2 border-b border-ink-700 bg-ink-900/95 px-4 py-3 sm:gap-x-6 md:px-8 md:py-4">
      <div className="flex items-center gap-4 pl-10 md:gap-6 md:pl-0">
        <div>
          <p className="text-[12px] text-mist-400">Day</p>
          <p className="font-nums font-display text-lg text-paper-100">
            {gameOver ? totalDays : currentDay}
            <span className="text-mist-400"> / {totalDays}</span>
          </p>
        </div>
        <div className="hidden h-8 w-px bg-ink-700 sm:block" />
        <div className="hidden sm:block">
          <p className="text-[12px] text-mist-400">Today</p>
          <p className="font-display text-lg text-paper-100">{dateLabel}</p>
        </div>
        <div className="hidden h-8 w-px bg-ink-700 lg:block" />
        <div className="hidden lg:block">
          <p className="text-[12px] text-mist-400">Location</p>
          <p className="font-display text-lg text-paper-100">{cityName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-x-5 md:gap-x-8">
        <div className="hidden text-right sm:block">
          <p className="text-[12px] text-mist-400">Cash</p>
          <p className="font-nums font-display text-lg text-paper-100">
            {formatFullRp(playerCash)}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[12px] text-mist-400">Net worth</p>
          <p className="font-nums font-display text-lg text-brass-300">
            {formatFullRp(playerNetWorth)}
          </p>
        </div>
        <div className="hidden md:flex md:items-center md:gap-3">
          <ThemeToggle />
          <button
            type="button"
            title="Save game"
            onClick={() => promptSave()}
            className="border border-ink-600 p-2 text-mist-300 transition-colors hover:border-brass-400 hover:text-brass-300"
          >
            <Save size={16} strokeWidth={1.75} />
          </button>
        </div>
        <button
          type="button"
          title="Skip to next day"
          disabled={gameOver}
          onClick={() => promptEndDay()}
          className="flex items-center gap-2 border border-brass-400/70 px-3 py-2 text-[13px] text-brass-300 transition-colors hover:bg-brass-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Moon size={16} strokeWidth={1.75} />
          <span className="hidden sm:inline">End day</span>
        </button>
      </div>
    </header>
  );
}