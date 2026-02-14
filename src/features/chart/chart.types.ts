import type { IChartApi, ISeriesApi, IPriceLine } from "lightweight-charts";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import type { BinanceCandle } from "@/services/binance/binance.types";

export type ChartSeriesType = "Candlestick";

export interface ChartCandleData extends CandlestickData<UTCTimestamp> {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function binanceCandleToChartCandle(candle: BinanceCandle): ChartCandleData {
  return {
    time: Math.floor(candle.time / 1000) as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

export interface PriceLineOptions {
  id: string;
  price: number;
  color?: string;
  lineWidth?: number;
  title?: string;
}

export type PriceMarkerPosition =
  | "aboveBar"
  | "belowBar"
  | "inBar"
  | "atPriceTop"
  | "atPriceBottom"
  | "atPriceMiddle";

export interface PriceMarkerOptions {
  id: string;
  time: UTCTimestamp;
  price: number;
  text: string;
  color?: string;
  position?: PriceMarkerPosition;
}

export interface ChartManagerRef {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  addPriceLine: (options: PriceLineOptions) => IPriceLine | null;
  removePriceLine: (line: IPriceLine) => void;
  setPriceLineValue: (line: IPriceLine, price: number) => void;
  addOrUpdateMarker: (options: PriceMarkerOptions) => void;
  updateLastCandle: (candle: ChartCandleData) => void;
  appendCandle: (candle: ChartCandleData) => void;
  destroy: () => void;
}
