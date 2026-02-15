"use client";

import { cn } from "@/lib/utils";

export interface CEPEOverlayProps {
  strikes: number[];
  priceToY: (price: number) => number | null;
  className?: string;
  /** CE (Call) order premium / P&L — only shown when non-empty */
  cePremium?: (price: number) => string | undefined;
  /** PE (Put) order premium / P&L — only shown when non-empty */
  pePremium?: (price: number) => string | undefined;
  /** Optional: move CE block vertically to show P&L (pixels; positive = up) */
  cePnlOffset?: (price: number) => number;
  /** Optional: move PE block vertically to show P&L (pixels; positive = up) */
  pePnlOffset?: (price: number) => number;
}

function OptionBlock({
  label,
  value,
  className,
}: {
  label: "CE" | "PE";
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 overflow-hidden rounded border border-white/30 font-mono text-xs font-medium leading-tight",
        className
      )}
    >
      <span className="shrink-0 bg-white px-1.5 py-0.5 text-black">{label}</span>
      <span className="shrink-0 whitespace-nowrap bg-black px-2 py-0.5 text-white">
        $ {value}
      </span>
    </span>
  );
}

const ROW_HEIGHT = 24;

function hasRealValue(val: string | undefined | null): boolean {
  return val != null && String(val).trim() !== "";
}

export function CEPEOverlay({
  strikes,
  priceToY,
  className,
  cePremium,
  pePremium,
  cePnlOffset = () => 0,
  pePnlOffset = () => 0,
}: CEPEOverlayProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-10", className)}
      aria-hidden
    >
      {strikes.map((price) => {
        const y = priceToY(price);
        if (y == null) return null;
        const baseTop = y - ROW_HEIGHT / 2;
        const ceVal = cePremium?.(price);
        const peVal = pePremium?.(price);
        const showCe = hasRealValue(ceVal);
        const showPe = hasRealValue(peVal);
        if (!showCe && !showPe) return null;
        return (
          <div
            key={price}
            className="absolute left-2 flex gap-8"
            style={{ top: baseTop }}
          >
            {showCe && (
              <div style={{ marginTop: cePnlOffset(price) }}>
                <OptionBlock label="CE" value={String(ceVal!).trim()} />
              </div>
            )}
            {showPe && (
              <div style={{ marginTop: pePnlOffset(price) }}>
                <OptionBlock label="PE" value={String(peVal!).trim()} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
