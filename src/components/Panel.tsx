import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function PaperPanel({
  eyebrow,
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`border border-ink-700 bg-ink-800/60 ${className}`}>
      {(eyebrow || title || action) && (
        <div className="flex items-end justify-between border-b border-ink-700 px-5 py-4">
          <div>
            {eyebrow && (
              <p className="text-[12px] text-mist-400">{eyebrow}</p>
            )}
            {title && (
              <p className="font-display text-[16px] font-medium text-paper-100">{title}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName || "px-5 py-4"}>{children}</div>
    </div>
  );
}

export function ReadoutPanel({
  eyebrow,
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  collapsible = false,
  defaultOpen = true,
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border border-ink-700 bg-ink-800/60 ${className}`}>
      {collapsible ? (
        <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-5 py-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center justify-between gap-3 text-left"
            aria-expanded={open}
          >
            <div>
              {eyebrow && <p className="text-[12px] text-mist-400">{eyebrow}</p>}
              {title && (
                <p className="font-display text-[16px] font-medium text-paper-100">{title}</p>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-mist-300 transition-transform ${
                open ? "" : "-rotate-90"
              }`}
            />
          </button>
          {action}
        </div>
      ) : (
        (eyebrow || title || action) && (
          <div className="flex items-end justify-between border-b border-ink-700 px-5 py-4">
            <div>
              {eyebrow && (
                <p className="text-[12px] text-mist-400">{eyebrow}</p>
              )}
              {title && (
                <p className="font-display text-[16px] font-medium text-paper-100">{title}</p>
              )}
            </div>
            {action}
          </div>
        )
      )}
      {open && <div className={bodyClassName || "px-5 py-4"}>{children}</div>}
    </div>
  );
}