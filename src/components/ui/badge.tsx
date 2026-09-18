import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className, tone = "muted", ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "teal" | "rust" | "ok" | "amber" | "ink" }) {
  const tones: Record<string, string> = {
    muted: "bg-paper-2 text-ink-soft",
    teal: "bg-teal-soft text-teal",
    rust: "bg-rust-soft text-rust",
    ok: "bg-ok-soft text-ok",
    amber: "bg-amber-soft text-amber",
    ink: "bg-ink text-cream",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...props} />
  );
}
