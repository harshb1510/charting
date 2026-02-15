"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { CEPEOverlay } from "./CEPEOverlay";

export interface ChartContainerProps {
  attach: (container: HTMLElement) => void;
  strikes: number[];
  priceToCoordinate: (price: number) => number | null;
  /** CE premium/P&L per strike — only blocks with real values are shown */
  cePremium?: (strike: number) => string | undefined;
  /** PE premium/P&L per strike — only blocks with real values are shown */
  pePremium?: (strike: number) => string | undefined;
  className?: string;
}

export function ChartContainer({
  attach,
  strikes,
  priceToCoordinate,
  cePremium,
  pePremium,
  className,
}: ChartContainerProps) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) attach(el);
    },
    [attach]
  );

  return (
    <div
      className={cn("relative w-full min-h-[400px] flex-1", className)}
      style={{ minHeight: 400 }}
    >
      <div
        ref={setRef}
        className="absolute inset-0 bg-black"
        role="img"
        aria-label="BTC/USDT real-time chart"
      />
      <CEPEOverlay
        strikes={strikes}
        priceToY={priceToCoordinate}
        cePremium={cePremium}
        pePremium={pePremium}
        className="absolute inset-0"
      />
    </div>
  );
}
