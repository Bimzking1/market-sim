export function Meter({
  value,
  max,
  tone = "brass",
  label,
  valueLabel,
}: {
  value: number;
  max: number;
  tone?: "brass" | "jade";
  label: string;
  valueLabel: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = tone === "jade" ? "bg-jade-400" : "bg-brass-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-paper-200">{label}</span>
        <span className="font-nums text-[13px] text-mist-300">{valueLabel}</span>
      </div>
      <div className="h-2 bg-ink-700 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DualMeter({ supply, demand }: { supply: number; demand: number }) {
  const max = Math.max(supply, demand, 1);
  const sPct = (supply / max) * 100;
  const dPct = (demand / max) * 100;

  return (
    <div className="w-24 space-y-1 sm:w-28">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-mist-400 w-7 sm:w-12 sm:text-[11px]">
          <span className="sm:hidden">S</span>
          <span className="hidden sm:inline">Supply</span>
        </span>
        <div className="flex-1 h-1.5 bg-ink-700">
          <div className="h-full bg-jade-400/70" style={{ width: `${sPct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-mist-400 w-7 sm:w-12 sm:text-[11px]">
          <span className="sm:hidden">D</span>
          <span className="hidden sm:inline">Demand</span>
        </span>
        <div className="flex-1 h-1.5 bg-ink-700">
          <div className="h-full bg-rust-400/70" style={{ width: `${dPct}%` }} />
        </div>
      </div>
    </div>
  );
}
