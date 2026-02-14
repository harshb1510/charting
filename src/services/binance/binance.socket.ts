import { z } from "zod";
import type { BinanceCandle } from "@/services/binance/binance.types";
import {
  BINANCE_WS_BASE,
  WS_RECONNECT_DELAY_MS,
  WS_RECONNECT_MAX_ATTEMPTS,
} from "@/lib/constants";

const klinePayloadSchema = z.object({
  e: z.literal("kline"),
  E: z.number(),
  s: z.string(),
  k: z.object({
    t: z.number(),
    o: z.string(),
    h: z.string(),
    l: z.string(),
    c: z.string(),
    v: z.string(),
    T: z.number(),
    q: z.string(),
    n: z.number(),
    V: z.string(),
    Q: z.string(),
    x: z.boolean(), // is candle closed
  }),
});

export type KlinePayload = z.infer<typeof klinePayloadSchema>;

function parseKlinePayload(payload: unknown): KlinePayload | null {
  const result = klinePayloadSchema.safeParse(payload);
  return result.success ? result.data : null;
}

function toCandle(k: KlinePayload["k"]): BinanceCandle {
  return {
    time: k.t,
    open: parseFloat(k.o),
    high: parseFloat(k.h),
    low: parseFloat(k.l),
    close: parseFloat(k.c),
    volume: parseFloat(k.v),
  };
}

export type BinanceSocketCallbacks = {
  onKline: (candle: BinanceCandle, isClosed: boolean) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

function buildKlineStreamUrl(symbol: string, interval: string): string {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  return `${BINANCE_WS_BASE}/ws/${stream}`;
}

export interface BinanceSocketHandle {
  close: () => void;
  reconnect: () => void;
}

export function createBinanceSocket(
  symbol: string,
  interval: string,
  callbacks: BinanceSocketCallbacks
): BinanceSocketHandle {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function connect(): void {
    if (closed) return;
    const url = buildKlineStreamUrl(symbol, interval);
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      callbacks.onOpen?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data as string) as unknown;
        const parsed = parseKlinePayload(raw);
        if (parsed) {
          const candle = toCandle(parsed.k);
          callbacks.onKline(candle, parsed.k.x);
        }
      } catch {
        // ignore invalid messages
      }
    };

    ws.onclose = () => {
      callbacks.onClose?.();
      if (closed) return;
      if (reconnectAttempts < WS_RECONNECT_MAX_ATTEMPTS) {
        reconnectTimer = setTimeout(() => {
          reconnectAttempts += 1;
          connect();
        }, WS_RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = (error: Event) => {
      callbacks.onError?.(error);
    };
  }

  connect();

  return {
    close() {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    reconnect() {
      if (ws) {
        ws.close();
        ws = null;
      }
      reconnectAttempts = 0;
      connect();
    },
  };
}
