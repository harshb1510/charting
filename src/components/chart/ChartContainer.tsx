"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

export interface ChartContainerProps {
  attach: (container: HTMLElement) => void;
  className?: string;
}

export function ChartContainer({ attach, className }: ChartContainerProps) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) attach(el);
    },
    [attach]
  );

  return (
    <div
      ref={setRef}
      className={cn("w-full h-full min-h-[400px] bg-black", className)}
      role="img"
      aria-label="BTC/USDT real-time chart"
    />
  );
}
