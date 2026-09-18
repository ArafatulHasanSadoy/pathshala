import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-opacity duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-teal text-teal-fg hover:opacity-90",
        secondary: "bg-paper-2 text-ink hover:opacity-90",
        outline: "border border-line-strong bg-cream text-ink hover:bg-paper-2",
        ghost: "text-ink-soft hover:bg-paper-2",
        danger: "bg-rust text-destructive-foreground hover:opacity-90",
        stamp: "bg-ink text-cream hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-sm",
        md: "h-11 px-4 text-sm rounded-md",
        lg: "h-12 px-5 text-base rounded-md",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
