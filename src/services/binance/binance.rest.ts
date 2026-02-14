import axios, { type AxiosInstance } from "axios";
import type { BinanceCandle, BinanceRestKlineResponse } from "@/services/binance/binance.types";
import { BINANCE_REST_BASE } from "@/lib/constants";

function parseRestKline(row: BinanceRestKlineResponse): BinanceCandle {
  return {
    time: row[0],
    open: parseFloat(row[1]),
    high: parseFloat(row[2]),
    low: parseFloat(row[3]),
    close: parseFloat(row[4]),
    volume: parseFloat(row[5]),
  };
}

export function createBinanceRestClient(baseURL: string = BINANCE_REST_BASE): {
  fetchKlines: (symbol: string, interval: string, limit: number) => Promise<BinanceCandle[]>;
} {
  const client: AxiosInstance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
  });

  async function fetchKlines(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<BinanceCandle[]> {
    const { data } = await client.get<BinanceRestKlineResponse[]>("fapi/v1/klines", {
      params: { symbol: symbol.toUpperCase(), interval, limit },
    });
    return data.map(parseRestKline);
  }

  return { fetchKlines };
}

export const binanceRest = createBinanceRestClient();
