import { cn } from "@/lib/utils";
import { hueColor, initials } from "@/lib/pathshala/format";

export function Avatar({
  name,
  hue,
  photo,
  size = "md",
}: {
  name: string;
  hue: number;
  photo?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-9 text-xs" : size === "lg" ? "size-16 text-xl" : "size-11 text-sm";
  if (photo) {
    return <img src={photo} alt="" className={cn("rounded-md object-cover", dim)} />;
  }
  return (
    <div
      className={cn(
        "grid place-items-center rounded-md font-display font-medium text-cream shrink-0",
        dim,
      )}
      style={{ background: hueColor(hue) }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
