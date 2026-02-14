export const MAX_CANDLES = 500;

export const BINANCE_REST_BASE = "https://fapi.binance.com";
export const BINANCE_WS_BASE = "wss://fstream.binance.com";

export const DEFAULT_SYMBOL = "BTCUSDT";
export const DEFAULT_INTERVAL = "1m";

export const TIMEFRAME_OPTIONS: { value: string; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1D" },
];

export const WS_RECONNECT_DELAY_MS = 3000;
export const WS_RECONNECT_MAX_ATTEMPTS = 10;
