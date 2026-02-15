"use client";

import { useState, useEffect, useCallback } from "react";
import { ChartContainer } from "@/components/chart/ChartContainer";
import { useChart } from "@/hooks/useChart";
import { useWebSocket } from "@/hooks/useWebSocket";
import { binanceRest } from "@/services/binance/binance.rest";
import { binanceCandleToChartCandle } from "@/features/chart/chart.types";
import { useChartStore } from "@/features/chart/chart.store";
import type { ChartCandleData } from "@/features/chart/chart.types";
import { useLiveTime } from "@/hooks/useLiveTime";
import { formatDateTimeIST } from "@/lib/time";
import { DEFAULT_SYMBOL, MAX_CANDLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ChartPage() {
  const [initialData, setInitialData] = useState<ChartCandleData[]>([]);
  const [interval] = useState("1m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<"orders" | "positions" | "history">("orders");
  const [bottomExpanded, setBottomExpanded] = useState(false);

  const setLastCandleTime = useChartStore((s) => s.setLastCandleTime);
  const setLastCandleOHLC = useChartStore((s) => s.setLastCandleOHLC);
  const [strikes, setStrikes] = useState<number[]>([]);
  const { attach, setData, handleCandle, priceToCoordinate } = useChart({
    initialData,
    onCandleUpdate: (candle) => {
      setLastCandleTime(candle.time);
      setLastCandleOHLC({ o: candle.open, h: candle.high, l: candle.low, c: candle.close });
    },
    onStrikesChange: setStrikes,
  });

  useWebSocket({ interval, onKline: handleCandle });

  const lastCandleOHLC = useChartStore((s) => s.lastCandleOHLC);
  const lastCandleTime = useChartStore((s) => s.lastCandleTime);
  const liveTimeIST = useLiveTime(1000);

  const fetchKlines = useCallback(
    (int: string) => {
      let cancelled = false;
      binanceRest
        .fetchKlines(DEFAULT_SYMBOL, int, MAX_CANDLES)
        .then((candles) => {
          if (cancelled) return;
          const chartData = candles.map(binanceCandleToChartCandle);
          if (chartData.length > 0) {
            const last = chartData[chartData.length - 1];
            setLastCandleTime(last.time);
            setLastCandleOHLC({ o: last.open, h: last.high, l: last.low, c: last.close });
          }
          setInitialData((prev) => {
            if (prev.length === 0) return chartData;
            setData(chartData);
            return prev;
          });
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Failed to load candles");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [setData, setLastCandleTime, setLastCandleOHLC]
  );

  useEffect(() => {
    const cancel = fetchKlines(interval);
    return cancel;
  }, [interval, fetchKlines]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <div className="text-[#9ca3af]">Loading chart data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <div className="rounded-lg border border-[#374151] bg-[#171717] p-4 text-[#ef4444]">
          {error}
        </div>
      </div>
    );
  }

  if (initialData.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <div className="text-[#9ca3af]">No data available.</div>
      </div>
    );
  }

  const isCloseUp = lastCandleOHLC ? lastCandleOHLC.c >= lastCandleOHLC.o : true;

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-black">
      <header className="shrink-0 border-b border-[#262626] bg-black px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">BTCUSD • BINANCE • Perp Futures</p>
          <p className="font-mono text-xs tabular-nums text-white/80">
            IST {liveTimeIST}
            
          </p>
        </div>
        {lastCandleOHLC && (
          <p className="mt-1 font-mono text-sm tabular-nums text-white">
            <span>O {formatPrice(lastCandleOHLC.o)}</span>
            <span className="mx-2 text-white/60"> </span>
            <span>H {formatPrice(lastCandleOHLC.h)}</span>
            <span className="mx-2 text-white/60"> </span>
            <span>L {formatPrice(lastCandleOHLC.l)}</span>
            <span className="mx-2 text-white/60"> </span>
            <span className={isCloseUp ? "text-[#22c55e]" : "text-[#ef4444]"}>
              C {formatPrice(lastCandleOHLC.c)}
            </span>
          </p>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden transition-[flex]">
        <ChartContainer
          attach={attach}
          strikes={strikes}
          priceToCoordinate={priceToCoordinate}
          cePremium={
            lastCandleOHLC?.c != null
              ? (strike) => Math.max(0, lastCandleOHLC!.c - strike).toFixed(2)
              : undefined
          }
          pePremium={
            lastCandleOHLC?.c != null
              ? (strike) => Math.max(0, strike - lastCandleOHLC!.c).toFixed(2)
              : undefined
          }
          className="h-full w-full"
        />
      </div>
      <div className="flex shrink-0 flex-col border-t border-white/20 bg-[#1a1a1a]">
        <div className="flex items-center">
          <nav className="flex flex-1">
            {(["orders", "positions", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveNav(tab)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  activeNav === tab ? "border-b-2 text-white" : "text-[#9ca3af]"
                )}
                style={
                  activeNav === tab
                    ? { borderBottomWidth: 2, borderBottomColor: "white" }
                    : undefined
                }
              >
                {tab === "orders" && "Orders (0)"}
                {tab === "positions" && "Positions (0)"}
                {tab === "history" && "History (0)"}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setBottomExpanded((e) => !e)}
            className="flex shrink-0 items-center justify-center px-3 py-3 text-[#9ca3af] transition-colors hover:text-white"
            aria-label={bottomExpanded ? "Collapse panel" : "Expand panel"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform", bottomExpanded && "rotate-180")}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
        {bottomExpanded && (
          <div className="h-[40vh] min-h-[120px] max-h-[320px] overflow-auto border-t border-white/10 bg-[#171717]">
            <div className="p-4 text-sm text-[#9ca3af]">
              {activeNav === "orders" && "No orders yet."}
              {activeNav === "positions" && "No open positions."}
              {activeNav === "history" && "No history yet."}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
