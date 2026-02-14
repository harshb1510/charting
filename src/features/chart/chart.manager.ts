import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type ISeriesMarkersPluginApi,
  type MouseEventHandler,
  type Time,
  type SeriesMarker,
} from "lightweight-charts";
import type { ChartCandleData, PriceLineOptions, PriceMarkerOptions } from "@/features/chart/chart.types";
import { MAX_CANDLES } from "@/lib/constants";
import { formatTimeIST, formatTickMarkIST } from "@/lib/time";

const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: "#000000" },
    textColor: "#ffffff",
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: "#262626", visible: true },
    horzLines: { color: "#262626", visible: true },
  },
  crosshair: {
    mode: 1 as const,
    vertLine: {
      color: "#525252",
      width: 1 as const,
      style: 0 as const,
      labelBackgroundColor: "#262626",
    },
    horzLine: {
      color: "#525252",
      width: 1 as const,
      style: 0 as const,
      labelBackgroundColor: "#262626",
    },
  },
  rightPriceScale: {
    borderColor: "#262626",
    scaleMargins: { top: 0.1, bottom: 0.2 },
    textColor: "#ffffff",
  },
  timeScale: {
    borderColor: "#262626",
    timeVisible: true,
    secondsVisible: false,
    textColor: "#ffffff",
    rightOffset: 20,
    tickMarkFormatter: (time: Time, tickMarkType: number) =>
      formatTickMarkIST(time as number, tickMarkType),
  },
  localization: {
    timeFormatter: (time: unknown) => formatTimeIST(time as number),
  },
  autoSize: true,
};

const CANDLE_OPTIONS = {
  upColor: "#22c55e",
  downColor: "#ef4444",
  borderVisible: true,
  borderUpColor: "#22c55e",
  borderDownColor: "#ef4444",
  wickUpColor: "#22c55e",
  wickDownColor: "#ef4444",
};

export class ChartManager {
  private chart: IChartApi | null = null;
  private series: ISeriesApi<"Candlestick"> | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private dataBuffer: ChartCandleData[] = [];
  private priceLines = new Map<string, IPriceLine>();
  private markersPlugin: ISeriesMarkersPluginApi<Time> | null = null;
  private markersMap = new Map<string, SeriesMarker<Time>>();
  private destroyed = false;
  private dblClickHandler: MouseEventHandler<Time> | null = null;
  private crosshairHandler: MouseEventHandler<Time> | null = null;
  private lastCrosshairPrice: number | null = null;
  private contextmenuHandler: ((e: MouseEvent) => void) | null = null;

  attach(container: HTMLElement, initialData: ChartCandleData[]): void {
    if (this.chart || this.destroyed) return;
    this.container = container;
    this.dataBuffer = this.trimBuffer(initialData);

    this.chart = createChart(container, CHART_OPTIONS);
    this.series = this.chart.addSeries(CandlestickSeries, CANDLE_OPTIONS);
    this.series.setData(this.dataBuffer);

    this.markersPlugin = createSeriesMarkers(this.series);
    this.setupResizeObserver();

    this.dblClickHandler = (param) => {
      if (!param.point || !this.series) return;
      const price = this.series.coordinateToPrice(param.point.y as number);
      if (price == null) return;
      const id = `line-${Date.now()}`;
      this.addPriceLine({
        id,
        price,
        title: price.toFixed(2),
      });
    };
    this.chart.subscribeDblClick(this.dblClickHandler);

    this.crosshairHandler = (param) => {
      if (!param.point || !this.series) {
        this.lastCrosshairPrice = null;
        return;
      }
      const price = this.series.coordinateToPrice(param.point.y as number);
      this.lastCrosshairPrice = price ?? null;
    };
    this.chart.subscribeCrosshairMove(this.crosshairHandler);

    this.contextmenuHandler = (e: MouseEvent) => {
      e.preventDefault();
      if (this.lastCrosshairPrice == null || !this.series || this.priceLines.size === 0) return;
      this.removePriceLineAtPrice(this.lastCrosshairPrice);
    };
    container.addEventListener("contextmenu", this.contextmenuHandler);
  }

  private removePriceLineAtPrice(targetPrice: number): void {
    if (!this.series) return;
    let closestId: string | null = null;
    let closestDiff = Infinity;
    for (const [id, line] of this.priceLines) {
      const linePrice = line.options().price;
      const diff = Math.abs(linePrice - targetPrice);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestId = id;
      }
    }
    if (closestId == null) return;
    const line = this.priceLines.get(closestId);
    if (line) {
      this.series.removePriceLine(line);
      this.priceLines.delete(closestId);
    }
  }

  private trimBuffer(data: ChartCandleData[]): ChartCandleData[] {
    if (data.length <= MAX_CANDLES) return [...data];
    return data.slice(-MAX_CANDLES);
  }

  private setupResizeObserver(): void {
    if (!this.container) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.chart?.applyOptions({ width: this.container!.clientWidth, height: this.container!.clientHeight });
    });
    this.resizeObserver.observe(this.container);
  }

  getChart(): IChartApi | null {
    return this.chart;
  }

  getSeries(): ISeriesApi<"Candlestick"> | null {
    return this.series;
  }

  updateLastCandle(candle: ChartCandleData): void {
    if (!this.series || this.dataBuffer.length === 0) return;
    const last = this.dataBuffer[this.dataBuffer.length - 1];
    if (last.time !== candle.time) return;
    this.dataBuffer[this.dataBuffer.length - 1] = candle;
    this.series.update(candle);
  }

  appendCandle(candle: ChartCandleData): void {
    if (!this.series) return;
    this.dataBuffer.push(candle);
    if (this.dataBuffer.length > MAX_CANDLES) {
      this.dataBuffer = this.dataBuffer.slice(-MAX_CANDLES);
      this.series.setData(this.dataBuffer);
    } else {
      this.series.update(candle);
    }
  }

  setData(data: ChartCandleData[]): void {
    this.dataBuffer = this.trimBuffer(data);
    this.series?.setData(this.dataBuffer);
  }

  addPriceLine(options: PriceLineOptions): IPriceLine | null {
    if (!this.series) return null;
    const line = this.series.createPriceLine({
      price: options.price,
      color: options.color ?? "#2563eb",
      lineWidth: (options.lineWidth ?? 2) as 1 | 2 | 3 | 4,
      axisLabelVisible: true,
      title: options.title ?? "",
    });
    this.priceLines.set(options.id, line);
    return line;
  }

  removePriceLine(line: IPriceLine): void {
    this.series?.removePriceLine(line);
    for (const [id, l] of this.priceLines) {
      if (l === line) {
        this.priceLines.delete(id);
        break;
      }
    }
  }

  setPriceLineValue(line: IPriceLine, price: number): void {
    line.applyOptions({ price });
  }

  addOrUpdateMarker(options: PriceMarkerOptions): void {
    if (!this.markersPlugin) return;
    const position = options.position ?? "aboveBar";
    const isPricePosition =
      position === "atPriceTop" || position === "atPriceBottom" || position === "atPriceMiddle";
    const marker: SeriesMarker<Time> = isPricePosition
      ? {
          time: options.time,
          position,
          shape: "circle",
          color: options.color ?? "#3b82f6",
          text: options.text,
          id: options.id,
          price: options.price,
        }
      : {
          time: options.time,
          position,
          shape: "circle",
          color: options.color ?? "#3b82f6",
          text: options.text,
          id: options.id,
        };
    this.markersMap.set(options.id, marker);
    this.markersPlugin.setMarkers(Array.from(this.markersMap.values()));
  }

  removeMarker(id: string): void {
    this.markersMap.delete(id);
    this.markersPlugin?.setMarkers(Array.from(this.markersMap.values()));
  }

  destroy(): void {
    this.destroyed = true;
    if (this.container && this.contextmenuHandler) {
      this.container.removeEventListener("contextmenu", this.contextmenuHandler);
      this.contextmenuHandler = null;
    }
    if (this.chart && this.crosshairHandler) {
      this.chart.unsubscribeCrosshairMove(this.crosshairHandler);
      this.crosshairHandler = null;
    }
    if (this.chart && this.dblClickHandler) {
      this.chart.unsubscribeDblClick(this.dblClickHandler);
      this.dblClickHandler = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.priceLines.clear();
    this.markersMap.clear();
    this.chart?.remove();
    this.chart = null;
    this.series = null;
    this.markersPlugin = null;
    this.container = null;
    this.dataBuffer = [];
  }
}
