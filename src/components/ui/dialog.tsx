import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
}: {
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-line bg-cream p-5 shadow-slip max-h-[86vh] overflow-y-auto",
          className,
        )}
      >
        {title ? (
          <DialogPrimitive.Title className="font-display text-xl text-ink mb-3 pr-10">{title}</DialogPrimitive.Title>
        ) : (
          <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
        )}
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm p-2 text-muted hover:bg-paper-2">
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
