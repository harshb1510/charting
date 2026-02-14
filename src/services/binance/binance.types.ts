export interface BinanceKlineRaw {
  t: number; // open time
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  T: number; // close time
  q: string; // quote volume
  n: number; // number of trades
  V: string; // taker buy base volume
  Q: string; // taker buy quote volume
}

export interface BinanceRestKlineResponse {
  0: number;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: number;
  7: string;
  8: number;
  9: string;
  10: string;
  11: string;
}

export interface BinanceCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
