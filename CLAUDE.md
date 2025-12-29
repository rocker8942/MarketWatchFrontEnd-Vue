# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript frontend application for MarketWatch, integrating with an ABP Framework backend via OAuth authentication. The app displays stock market data, charts, and trading strategies.

The backend code is at ../MarketWatchWeb_AbpBackEnd
The backend code uses Abp Framework

## Agent instruction
- Always create a todo list and process it one by one
- Choose the simplest solution
- After implementation, update CLAUDE.md if needed. CLAUD.md needs to to high-level and concise

## Development Commands

**Development server:**
```bash
npm run dev
```
Runs on https://localhost:4200 with auto-generated SSL certificates (via vite-plugin-mkcert)

**Build for production:**
```bash
npm run build
```
Runs type checking in parallel with the Vite build

**Type checking only:**
```bash
npm run type-check
```

**Linting:**
```bash
npm run lint
```
Auto-fixes issues where possible

**Testing:**
```bash
npm run test:unit              # Run Vitest unit tests
npm run test:e2e               # E2E tests with Cypress (interactive)
npm run test:e2e:ci            # E2E tests (headless)
```

## Architecture

### Authentication Flow
- OAuth/OIDC authentication via `vue-oidc-client` library
- Identity server configured in [src/core/config/globalConfig.ts](src/core/config/globalConfig.ts) (`APIServer: "https://localhost:44324"`)
- Authentication setup in [src/idsrvAuth.ts](src/idsrvAuth.ts) - creates OIDC auth instance with ABP-specific configuration
- App initialization in [src/main.ts](src/main.ts) waits for `idsrvAuth.startup()` before mounting
- Protected routes require `meta.authName` set to `idsrvAuth.authName` in router config

### API Communication
- Centralized API service: [src/core/services/apiService.ts](src/core/services/apiService.ts)
- Automatically injects Bearer token from OIDC auth into all axios requests
- Base URL configured via `GlobalConfig.APIServer`
- Methods: `get()`, `post()`, `update()`, `delete()`
- marketWatchClient.ts is auto-generated from backend. Run "G:\SourceCode\MarketWatchWeb_AbpBackEnd\src\MarketWatchWeb.HttpApi.Host\CreateClient.bat"

### Directory Structure
```
src/
├── core/
│   ├── config/          # Global configuration (API endpoints)
│   └── services/        # API service layer
├── views/               # Page components (HomeView, StockList, StockPrice, etc.)
├── components/          # Reusable components (HeaderComponent, etc.)
├── router/              # Vue Router configuration
├── assets/              # Static assets, CSS (including main.css for Tailwind)
├── idsrvAuth.ts         # OIDC authentication setup
├── main.ts              # App initialization and plugin registration
└── vue-oidc-client.ts   # OIDC client wrapper
```

### Styling
- Tailwind CSS v4 (requires `@tailwindcss/postcss` plugin in [postcss.config.js](postcss.config.js))
- Element Plus UI library globally registered
- PrimeVue components available

### Routing
Protected routes (all except home) require authentication and use lazy loading for code splitting.

### Data Entities
- **Company** entity mapped to `Companys` table - provides comprehensive financial data (market cap, P/E ratio, EPS, sector, etc.)
- **StockInfo** entity for basic stock information
- **StockPrice** entity for historical price data

Recent additions:
- `GET /strategyHistory` route renders Strategy trade history list (from `tblFundTradeHistory`)
- StockChart page now displays financial overview section with key metrics from Company entity
- StrategyView page now includes Name column and Edit functionality for strategies (from `tblFundStrategy`)

## Key Configuration Files
- [vite.config.ts](vite.config.ts) - Vite config with HTTPS enabled, alias `@` → `./src`
- [postcss.config.js](postcss.config.js) - PostCSS with Tailwind v4 (`@tailwindcss/postcss`)
- [tsconfig.json](tsconfig.json), [tsconfig.app.json](tsconfig.app.json), [tsconfig.vitest.json](tsconfig.vitest.json) - TypeScript configs

## Coding Standards
- Vue 3 Composition API with TypeScript
- Use Tailwind CSS for styling
- Keep implementations simple and straightforward

## log
- backend log file is at "G:\SourceCode\MarketWatchWeb_AbpBackEnd\src\MarketWatchWeb.HttpApi.Host\Logs\logs.txt"
