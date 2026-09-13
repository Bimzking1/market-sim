import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: ReactNode;
  sublabel?: ReactNode;
  meta?: ReactNode;
  group?: string;
  disabled?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  searchable = false,
  placeholder = "Select…",
  className = "",
  emptyLabel = "No options",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  searchable?: boolean;
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => {
        const text = `${o.label} ${o.sublabel ?? ""} ${o.meta ?? ""}`
          .toString()
          .toLowerCase();
        return text.includes(q);
      })
    : options;

  let lastGroup: string | undefined;
  const rows: ReactNode[] = [];

  for (const opt of filtered) {
    if (opt.group !== lastGroup) {
      rows.push(
        <div
          key={`g:${opt.group ?? ""}`}
          className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-mist-500"
        >
          {opt.group}
        </div>
      );
      lastGroup = opt.group;
    }
    rows.push(
      <OptionRow
        key={opt.value}
        option={opt}
        selected={opt.value === value}
        onPick={() => {
          if (opt.disabled) return;
          onChange(opt.value);
          setOpen(false);
        }}
      />
    );
  }

  if (filtered.length === 0) {
    rows.push(
      <div key="empty" className="px-3 py-3 text-center text-[12px] text-mist-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className={`flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors focus:border-brass-400 focus:outline-none ${
          open
            ? "border-brass-400 bg-ink-800"
            : "border-ink-600 bg-ink-900 hover:border-ink-500"
        }`}
      >
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block truncate text-[13px] text-paper-100">
                {selected.label}
              </span>
              {selected.sublabel && (
                <span className="block truncate text-[11px] text-mist-400">
                  {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            <span className="block text-[13px] text-mist-400">{placeholder}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {selected?.meta != null && (
            <span className="text-[11px] font-nums text-mist-300 whitespace-nowrap">
              {selected.meta}
            </span>
          )}
          <ChevronDown
            size={15}
            strokeWidth={1.75}
            className={`text-mist-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto border border-ink-600 bg-ink-900 shadow-lg shadow-ink-950/60">
          {searchable && (
            <div className="relative border-b border-ink-700">
              <Search
                size={14}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full border-0 bg-transparent py-2 pl-9 pr-3 text-[13px] text-paper-100 placeholder:text-mist-400 focus:outline-none"
              />
            </div>
          )}
          {rows}
        </div>
      )}
    </div>
  );
}

function OptionRow({
  option,
  selected,
  onPick,
}: {
  option: DropdownOption;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={option.disabled}
      onClick={onPick}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
        selected
          ? "bg-brass-400/10 text-brass-300"
          : "text-paper-100 hover:bg-ink-700/70"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px]">{option.label}</span>
        {option.sublabel && (
          <span className="block truncate text-[11px] text-mist-400">
            {option.sublabel}
          </span>
        )}
      </span>
      {option.meta != null && (
        <span className="shrink-0 text-[11px] font-nums text-mist-300 whitespace-nowrap">
          {option.meta}
        </span>
      )}
    </button>
  );
}