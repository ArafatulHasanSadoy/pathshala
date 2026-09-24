import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Slip({
  className,
  children,
  as: Tag = "div",
  onClick,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "button" | "article";
  onClick?: () => void;
}) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-lg border border-line bg-cream p-4 shadow-slip text-left",
        onClick && "hover:border-line-strong transition-colors duration-150",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "rust" | "teal" | "ink";
}) {
  const color = tone === "rust" ? "text-rust" : tone === "teal" ? "text-teal" : "text-ink";
  return (
    <Slip>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl tabular-nums", color)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Slip>
  );
}
