import { useRef, useEffect } from "react";
import { createBinanceSocket, type BinanceSocketHandle } from "@/services/binance/binance.socket";
import { binanceCandleToChartCandle } from "@/features/chart/chart.types";
import { useChartStore } from "@/features/chart/chart.store";
import { DEFAULT_SYMBOL, DEFAULT_INTERVAL } from "@/lib/constants";

export interface UseWebSocketOptions {
  symbol?: string;
  interval?: string;
  onKline?: (candle: ReturnType<typeof binanceCandleToChartCandle>, isClosed: boolean) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): void {
  const { symbol = DEFAULT_SYMBOL, interval = DEFAULT_INTERVAL, onKline } = options;
  const socketRef = useRef<BinanceSocketHandle | null>(null);
  const onKlineRef = useRef(onKline);
  const setConnectionStatus = useChartStore((s) => s.setConnectionStatus);
  const setLastError = useChartStore((s) => s.setLastError);

  useEffect(() => {
    onKlineRef.current = onKline;
  }, [onKline]);

  useEffect(() => {
    socketRef.current = createBinanceSocket(symbol, interval, {
      onKline: (candle, isClosed) => {
        const chartCandle = binanceCandleToChartCandle(candle);
        onKlineRef.current?.(chartCandle, isClosed);
      },
      onOpen: () => setConnectionStatus("connected"),
      onClose: () => setConnectionStatus("idle"),
      onError: () => {
        setConnectionStatus("error");
        setLastError("WebSocket error");
      },
    });

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      setConnectionStatus("idle");
    };
  }, [symbol, interval, setConnectionStatus, setLastError]);
}
