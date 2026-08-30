import { useEffect, useRef } from "react";
import { Coin } from "@/components/coin";
import { cn } from "@/lib/cn";
import type { Kid } from "@/lib/types";

function pileSlots(n: number) {
  const out: Array<{ x: number; y: number; rot: number; z: number }> = [];
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(i / 5);
    const slot = i % 5;
    const r = 16 + ring * 9;
    const a = (slot / 5) * Math.PI * 2 + ring * 0.35;
    out.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r * 0.5 + ring * 5,
      rot: (i * 37) % 24 - 12,
      z: 10 + i,
    });
  }
  return out;
}

export function Basket({
  open,
  bounceKey,
  piles,
  className,
}: {
  open: boolean;
  bounceKey?: number;
  piles: Array<{ kid: Kid; count: number }>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || bounceKey == null) return;
    el.classList.remove("basket-hit");
    void el.offsetWidth;
    el.classList.add("basket-hit");
  }, [bounceKey]);

  const coins: Array<{ kid: Kid; slot: number }> = [];
  if (open) {
    for (const pile of piles) {
      for (let i = 0; i < Math.min(pile.count, 7); i++) {
        coins.push({ kid: pile.kid, slot: coins.length });
      }
    }
  }
  const slots = pileSlots(coins.length);

  return (
    <div ref={ref} className={cn("relative mx-auto w-[min(72vw,280px)]", className)}>
      <img
        src={open ? "/art/basket-open.jpg" : "/art/basket-closed.jpg"}
        alt={open ? "סל פתוח" : "סל סגור"}
        className="block w-full rounded-2xl outline-none"
        draggable={false}
      />
      {coins.length > 0 ? (
        <div className="pointer-events-none absolute inset-[18%_22%_28%_22%]">
          <div className="relative size-full">
            {coins.map((c, i) => {
              const s = slots[i];
              return (
                <div
                  key={`${c.kid.id}-${i}`}
                  className="pile-coin absolute top-1/2 left-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) rotate(${s.rot}deg)`,
                    zIndex: s.z,
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <Coin kid={c.kid} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type Flyer = {
  id: string;
  kid: Kid;
  start: DOMRect;
  end: DOMRect;
};

export function CoinFlyer({ flyer, onDone }: { flyer: Flyer; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a = { x: flyer.start.left, y: flyer.start.top };
    const b = {
      x: flyer.end.left + flyer.end.width / 2 - flyer.start.width / 2,
      y: flyer.end.top + flyer.end.height * 0.42 - flyer.start.height / 2,
    };
    if (reduce) {
      onDone();
      return;
    }
    const mid = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 140 };
    const t0 = performance.now();
    el.style.transform = `translate(${a.x}px, ${a.y}px)`;
    let raf = 0;
    const tick = (now: number) => {
      const n = Math.min(1, (now - t0) / 620);
      const i = 1 - (1 - n) ** 3;
      const x = (1 - i) * (1 - i) * a.x + 2 * (1 - i) * i * mid.x + i * i * b.x;
      const y = (1 - i) * (1 - i) * a.y + 2 * (1 - i) * i * mid.y + i * i * b.y;
      const scale = 1 - 0.58 * i;
      const rot = i * 210;
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`;
      el.style.opacity = String(1 - i * 0.2);
      if (n < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flyer, onDone]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
      style={{ width: flyer.start.width, height: flyer.start.height }}
    >
      <Coin kid={flyer.kid} size="fill" />
    </div>
  );
}
