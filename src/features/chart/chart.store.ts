import { create } from "zustand";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "error";

export interface OHLC {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface ChartState {
  connectionStatus: ConnectionStatus;
  lastError: string | null;
  lastCandleTime: number | null;
  lastCandleOHLC: OHLC | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastError: (error: string | null) => void;
  setLastCandleTime: (time: number | null) => void;
  setLastCandleOHLC: (ohlc: OHLC | null) => void;
  reset: () => void;
}

const initialState = {
  connectionStatus: "idle" as ConnectionStatus,
  lastError: null as string | null,
  lastCandleTime: null as number | null,
  lastCandleOHLC: null as OHLC | null,
};

export const useChartStore = create<ChartState>((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastError: (lastError) => set({ lastError }),
  setLastCandleTime: (lastCandleTime) => set({ lastCandleTime }),
  setLastCandleOHLC: (lastCandleOHLC) => set({ lastCandleOHLC }),
  reset: () => set(initialState),
}));
