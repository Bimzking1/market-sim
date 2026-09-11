import type { ReactNode } from "react";

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