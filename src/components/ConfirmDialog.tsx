import { create } from "zustand";
import { formatFullRp } from "../utils/format";
import { playSfx } from "../lib/sfx";

export interface ConfirmLine {
  label: string;
  value: string;
  tone?: "default" | "good" | "bad";
}

export interface ConfirmConfig {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  currentCash?: number;
  cashChange?: number;
  lines?: ConfirmLine[];
}

type Resolve = (ok: boolean) => void;

interface ConfirmState {
  config: (ConfirmConfig & { resolve: Resolve }) | null;
}

export const useConfirmDialog = create<ConfirmState>(() => ({
  config: null,
}));

export function confirmAction(config: ConfirmConfig): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useConfirmDialog.setState({ config: { ...config, resolve } });
  });
}

function closeConfirm(ok: boolean) {
  const cfg = useConfirmDialog.getState().config;
  useConfirmDialog.setState({ config: null });
  cfg?.resolve(ok);
}

export function ConfirmDialog() {
  const cfg = useConfirmDialog((s) => s.config);
  if (!cfg) return null;

  const showCash =
    cfg.currentCash !== undefined &&
    cfg.cashChange !== undefined;
  const after =
    showCash ? cfg.currentCash! + cfg.cashChange! : undefined;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/80 p-4"
      onClick={() => closeConfirm(false)}
    >
      <div
        className="w-full max-w-md border border-ink-600 bg-ink-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-[18px] font-semibold text-paper-100">
          {cfg.title}
        </p>
        {cfg.description && (
          <p className="mt-1.5 text-[13px] text-mist-300">
            {cfg.description}
          </p>
        )}

        {(cfg.lines ?? []).length > 0 && (
          <dl className="mt-4 space-y-2 text-[13px]">
            {cfg.lines!.map((l) => (
              <div
                key={l.label}
                className="flex items-center justify-between gap-4"
              >
                <dt className="text-mist-300">{l.label}</dt>
                <dd
                  className={`font-nums ${
                    l.tone === "good"
                      ? "text-jade-300"
                      : l.tone === "bad"
                      ? "text-rust-300"
                      : "text-paper-100"
                  }`}
                >
                  {l.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {showCash && (
          <div className="mt-4 space-y-2 border-t border-ink-700 pt-3 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-mist-300">Cash on hand</span>
              <span className="font-nums text-paper-100">
                {formatFullRp(cfg.currentCash!)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-mist-300">Cash change</span>
              <span
                className={`font-nums ${
                  cfg.cashChange! < 0 ? "text-rust-300" : "text-jade-300"
                }`}
              >
                {cfg.cashChange! < 0 ? "-" : "+"}
                {formatFullRp(Math.abs(cfg.cashChange!))}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-ink-700 pt-2">
              <span className="font-display text-[14px] text-paper-100">
                Cash after
              </span>
              <span className="font-nums font-display text-[15px] text-paper-100">
                {formatFullRp(after!)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => { playSfx("cancel"); closeConfirm(false); }}
            className="flex-1 border border-ink-600 px-4 py-2.5 text-[14px] text-mist-300 hover:border-brass-400 hover:text-brass-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { playSfx("check"); closeConfirm(true); }}
            className={`flex-1 px-4 py-2.5 text-[14px] font-medium ${
              cfg.danger
                ? "bg-rust-500/25 text-rust-300 hover:bg-rust-500/35"
                : "bg-brass-400/15 text-brass-300 hover:bg-brass-400/25"
            }`}
          >
            {cfg.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}