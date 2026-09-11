import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Wallet,
  CalendarDays,
  Target,
  TriangleAlert,
  Lightbulb,
  ChevronRight,
  Anchor,
  Package,
  Truck,
} from "lucide-react";
import { formatFullRp } from "../utils/format";
import { ALL_CITY_IDS } from "../engine/cities";
import { ALL_WAREHOUSE_TYPE_IDS } from "../engine/warehouses";
import { gameStartDate, formatDate } from "../engine/calendar";

const STARTING_CASH = 10_000_000;
const TOTAL_DAYS = 180;
const START_DATE_LABEL = formatDate(new Date(gameStartDate()));

const objectives = [
  "Reach Rp50M, Rp200M, then Rp500M net worth",
  "Own 3 vehicles and 2 warehouses",
  "Make Rp100M from trading",
  `Visit all ${ALL_CITY_IDS.length} cities`,
  "Finish with zero debt",
];

const warnings = [
  "Perishable goods spoil after a few days — sell them fast",
  "Vehicles wear down and may break down without regular servicing",
  "Missing a loan repayment crushes your credit rating",
  "Random events can crash prices or disrupt trade routes",
];

const tips = [
  "Buy low in one city, sell high in another — watch the signals",
  "Use warehouses to store goods and wait for better prices",
  "Visit the Insights desk to hire analysts and forecast prices",
  "Bank loans are cheap (0.1% daily) — moneylenders charge 0.3%",
  "End day from the top bar to let prices shift without traveling",
  "Keep an eye on commodity conditions — spicy goods spoil fast",
];

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 text-brass-300">
        <Icon size={18} strokeWidth={1.75} />
        <p className="font-display text-[15px] font-semibold uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, isLight }: { icon: React.ElementType; label: string; value: string; isLight: boolean }) {
  return (
    <div className={`p-4 text-center space-y-1.5 border ${isLight ? "border-mist-300 bg-white" : "border-ink-700 bg-ink-800/60"}`}>
      <Icon size={16} className="mx-auto text-brass-400" />
      <p className={`text-[11px] uppercase tracking-wider ${isLight ? "text-mist-500" : "text-mist-400"}`}>{label}</p>
      <p className={`font-display text-[17px] font-semibold ${isLight ? "text-ink-900" : "text-paper-100"}`}>{value}</p>
    </div>
  );
}

export function IntroScreen() {
  const navigate = useNavigate();
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem("kongsi-theme") === "light";
  });

  useEffect(() => {
    const onStorage = () => setIsLight(localStorage.getItem("kongsi-theme") === "light");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const bg = isLight ? "bg-[#F2F1EC]" : "bg-[#272B2E]";
  const text = isLight ? "text-[#3a3530]" : "text-[#d5cfc6]";
  const heading = isLight ? "text-ink-900" : "text-paper-100";
  const subtext = isLight ? "text-mist-500" : "text-mist-400";

  return (
    <div
      onClick={() => navigate("/dashboard")}
      className={`flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-y-auto px-5 py-16 ${bg} ${text}`}
    >
      <div className="w-full max-w-7xl space-y-10">
        <div className="text-center space-y-3">
          <p className="font-display text-[13px] uppercase tracking-[0.2em] text-brass-400">
            Before you begin
          </p>
          <h1 className={`font-display text-[28px] font-semibold ${heading}`}>
            Welcome to Kongsi
          </h1>
          <p className={`text-[15px] ${subtext}`}>
            Your trading venture begins here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard icon={MapPin} label="Starting city" value="Bandung" isLight={isLight} />
          <InfoCard icon={Wallet} label="Starting capital" value={formatFullRp(STARTING_CASH)} isLight={isLight} />
          <InfoCard icon={CalendarDays} label="Starting date" value={START_DATE_LABEL} isLight={isLight} />
          <InfoCard icon={CalendarDays} label="Duration" value={`${TOTAL_DAYS} days`} isLight={isLight} />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Section icon={Target} title="Objectives">
            <ul className="space-y-1.5">
              {objectives.map((o) => (
                <li key={o} className="flex items-start gap-2">
                  <ChevronRight size={14} className="mt-1 shrink-0 text-brass-400" />
                  <span className="text-[14px]">{o}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={TriangleAlert} title="Watch out for">
            <ul className="space-y-1.5">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <TriangleAlert size={13} className={`mt-1 shrink-0 ${isLight ? "text-rust-600" : "text-rust-400"}`} />
                  <span className={`text-[14px] ${isLight ? "text-rust-600" : "text-rust-300"}`}>{w}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Lightbulb} title="Tips">
            <ul className="space-y-1.5">
              {tips.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Lightbulb size={13} className="mt-1 shrink-0 text-jade-400" />
                  <span className="text-[14px]">{t}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
          <p className={`border ${isLight ? "border-mist-300 bg-white" : "border-ink-700 bg-ink-800/60"} p-3 text-[12px] ${subtext}`}>
            <Anchor size={14} className="mx-auto mb-1 text-brass-400" />
            Sea routes unlock distant cities — bring cargo and a ticket.
          </p>
          <p className={`border ${isLight ? "border-mist-300 bg-white" : "border-ink-700 bg-ink-800/60"} p-3 text-[12px] ${subtext}`}>
            <Truck size={14} className="mx-auto mb-1 text-brass-400" />
            Trucks haul quicker but cross-region trips need a ship.
          </p>
          <p className={`border ${isLight ? "border-mist-300 bg-white" : "border-ink-700 bg-ink-800/60"} p-3 text-[12px] ${subtext}`}>
            <Package size={14} className="mx-auto mb-1 text-brass-400" />
            {ALL_WAREHOUSE_TYPE_IDS.length} warehouse sizes · remote storage via delegation.
          </p>
        </div>

        <p className={`text-center text-[14px] animate-pulse ${subtext}`}>
          Click anywhere to begin
        </p>
      </div>
    </div>
  );
}
