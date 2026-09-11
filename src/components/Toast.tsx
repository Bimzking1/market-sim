import { create } from "zustand";

export type ToastTone = "default" | "good" | "bad" | "brass";

export interface Toast {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let toastCounter = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++toastCounter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(t: Omit<Toast, "id">) {
  useToasts.getState().push(t);
}

const toneStyles: Record<ToastTone, string> = {
  default: "border-ink-600 bg-ink-800",
  good: "border-jade-400/60 bg-ink-800",
  bad: "border-rust-400/60 bg-ink-800",
  brass: "border-brass-400/60 bg-ink-800",
};

const titleStyles: Record<ToastTone, string> = {
  default: "text-paper-100",
  good: "text-jade-300",
  bad: "text-rust-300",
  brass: "text-brass-300",
};

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-72 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto border px-4 py-3 shadow-lg ${toneStyles[t.tone]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className={`font-display text-[14px] ${titleStyles[t.tone]}`}>
              {t.title}
            </p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-[12px] text-mist-400 hover:text-paper-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
          {t.message && (
            <p className="mt-0.5 text-[12px] text-mist-300">{t.message}</p>
          )}
        </div>
      ))}
    </div>
  );
}