import { cn } from "@/lib/cn";
import type { Kid } from "@/lib/types";

const sizes = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  xl: "size-28",
  fill: "size-full",
} as const;

const pads = {
  sm: "p-0.5",
  md: "p-1",
  lg: "p-1.5",
  xl: "p-2",
  fill: "p-[7%]",
} as const;

export function Coin({
  kid,
  size = "lg",
  className,
}: {
  kid: Pick<Kid, "name" | "photo">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div className={cn("coin-rim relative shrink-0 overflow-hidden rounded-full", sizes[size], pads[size], className)}>
      <div className="coin-face size-full overflow-hidden rounded-full p-[6%]">
        {kid.photo ? (
          <img src={kid.photo} alt={kid.name} className="size-full rounded-full object-cover outline-none" draggable={false} />
        ) : (
          <div className="flex size-full items-center justify-center rounded-full bg-cream font-display text-lg text-muted">
            {kid.name.slice(0, 1) || "?"}
          </div>
        )}
      </div>
    </div>
  );
}
