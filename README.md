# Real-time Financial Charting System

Production-grade Next.js (App Router) + TypeScript application for real-time financial charting using Binance perpetual futures data and TradingView Lightweight Charts.

## Stack

- **Next.js** (App Router), **TypeScript** (strict)
- **lightweight-charts** — canvas-based charting
- **Zustand** — state management
- **Axios** — REST client
- **Zod** — WebSocket payload validation
- **Tailwind CSS**, **clsx**, **dayjs**

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

3. **Build for production**

   ```bash
   npm run build
   npm start
   ```

4. **Lint and format**

   ```bash
   npm run lint
   npx prettier --write "src/**/*.{ts,tsx}"
   ```

## Architecture

- **REST**: Historical 1m candles from Binance Futures `GET /fapi/v1/klines`.
- **WebSocket**: Binance futures stream `wss://fstream.binance.com/ws/btcusdt@kline_1m`; same open time → update last candle, new open time → append; reconnect with backoff.
- **Chart**: `ChartManager` owns the Lightweight Charts instance and lifecycle; incremental updates via `series.update()`; last 500 candles kept.
- **UI**: No business logic in components; chart actions (price lines, markers) exposed via hooks and passed to controls.

## Features

- Historical 1m candles on load
- Live 1m kline stream (update/append, no polling)
- Horizontal price line with label
- Floating markers (add/update)
- Move price line live via controls
- Dark theme, crosshair, time/price scales, ResizeObserver
- Graceful WebSocket reconnect and cleanup on unmount

## Project structure

```
src/
  app/           — layout, page, globals
  components/    — ChartContainer, ChartControls
  features/     — chart (store, types, manager)
  services/      — binance (REST, WebSocket, types)
  hooks/         — useChart, useWebSocket
  lib/           — utils, constants
```

## Deploy to Vercel

1. Push the project to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. **Add New Project** → Import your repository.
4. Vercel auto-detects Next.js; keep default **Build Command** `next build` and **Output Directory** (auto).
5. Click **Deploy**. No environment variables are required.

Or deploy from the CLI:

```bash
npm i -g vercel
vercel
```

## Environment

No API keys required; Binance public REST and WebSocket endpoints are used.
