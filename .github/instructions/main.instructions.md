---
applyTo: '**'
---

## Agent Instructions
- Always create a todo list and process it one by one
- Choose the simplest solution that maintains code quality
- After implementation, update CLAUDE.md and main.instructions.md if needed (keep it high-level and concise)

## Project Overview
- Vue 3 + TypeScript frontend for MarketWatch stock market application
- Displays stock prices, charts (ECharts), and trading strategies
- Backend: ABP Framework at `../MarketWatchWeb_AbpBackEnd`

## Tech Stack
- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Styling**: Tailwind CSS v4 + Element Plus UI
- **Charts**: ECharts via `vue-echarts`
- **HTTP**: Axios with auto-injected Bearer tokens
- **Auth**: OIDC via `vue-oidc-client` (connects to ABP IdentityServer)
- **Routing**: Vue Router with lazy-loaded protected routes

## Key Patterns
- **API Client**: Auto-generated `marketWatchClient.ts` from backend (run `CreateClient.bat`)
- **API Service**: Centralized `src/core/services/apiService.ts` handles all HTTP requests
- **Auth Flow**: App waits for `idsrvAuth.startup()` before mounting
- **Protected Routes**: Use `meta: { authName: idsrvAuth.authName }`

## Directory Structure
```
src/
├── core/services/       # ApiService, auto-generated marketWatchClient
├── views/               # Page components (HomeView, StockList, StrategyView, etc.)
├── components/charts/   # Reusable chart components (LineChart, AreaChart, SparklineChart)
├── router/              # Vue Router with auth guards
└── idsrvAuth.ts         # OIDC authentication setup
```

## Commands
- `npm run dev` - Dev server (https://localhost:4200)
- `npm run build` - Production build with type checking
- `npm run test:unit` - Vitest unit tests
- `npm run lint` - ESLint with auto-fix

## Coding Standards
- Make it as simple as possible
- Use TypeScript for all new code
- Prefer Composition API (`<script setup lang="ts">`)
- Use Element Plus components for UI elements
- Use Tailwind CSS for custom styling

## Debug
- Backend log: `G:\SourceCode\MarketWatchWeb_AbpBackEnd\src\MarketWatchWeb.HttpApi.Host\Logs\logs.txt`