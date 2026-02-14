import { useRef, useEffect, useCallback } from "react";
import { ChartManager } from "@/features/chart/chart.manager";
import type { ChartCandleData, PriceLineOptions, PriceMarkerOptions } from "@/features/chart/chart.types";
import type { IPriceLine } from "lightweight-charts";

export interface UseChartOptions {
  initialData: ChartCandleData[];
  onCandleUpdate?: (candle: ChartCandleData, isClosed: boolean) => void;
}

export function useChart(options: UseChartOptions) {
  const { initialData, onCandleUpdate } = options;
  const managerRef = useRef<ChartManager | null>(null);
  const onCandleUpdateRef = useRef(onCandleUpdate);
  useEffect(() => {
    onCandleUpdateRef.current = onCandleUpdate;
  }, [onCandleUpdate]);

  const attach = useCallback((container: HTMLElement) => {
    if (!container || managerRef.current) return;
    const manager = new ChartManager();
    manager.attach(container, initialData);
    managerRef.current = manager;
  }, [initialData]);

  const updateLastCandle = useCallback((candle: ChartCandleData) => {
    managerRef.current?.updateLastCandle(candle);
  }, []);

  const appendCandle = useCallback((candle: ChartCandleData) => {
    managerRef.current?.appendCandle(candle);
  }, []);

  const addPriceLine = useCallback((opts: PriceLineOptions): IPriceLine | null => {
    return managerRef.current?.addPriceLine(opts) ?? null;
  }, []);

  const removePriceLine = useCallback((line: IPriceLine) => {
    managerRef.current?.removePriceLine(line);
  }, []);

  const setPriceLineValue = useCallback((line: IPriceLine, price: number) => {
    managerRef.current?.setPriceLineValue(line, price);
  }, []);

  const addOrUpdateMarker = useCallback((opts: PriceMarkerOptions) => {
    managerRef.current?.addOrUpdateMarker(opts);
  }, []);

  const setData = useCallback((data: ChartCandleData[]) => {
    managerRef.current?.setData(data);
  }, []);

  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const handleCandle = useCallback((candle: ChartCandleData, isClosed: boolean) => {
    if (isClosed) {
      appendCandle(candle);
    } else {
      updateLastCandle(candle);
    }
    onCandleUpdateRef.current?.(candle, isClosed);
  }, [appendCandle, updateLastCandle]);

  return {
    attach,
    setData,
    updateLastCandle,
    appendCandle,
    addPriceLine,
    removePriceLine,
    setPriceLineValue,
    addOrUpdateMarker,
    handleCandle,
  };
}
