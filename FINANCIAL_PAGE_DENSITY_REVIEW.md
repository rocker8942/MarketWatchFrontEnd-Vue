# MarketWatch financial page density review

The biggest opportunity is to bring the first comparison higher on the page. At 1440 × 900, the dashboard’s first chart starts at y=480, the fund table starts at y=452, and the Movers losers table starts at y=940. Compact headings, fewer card layers and better column priorities will give readers more information in the same viewport.

## Fix first

1. **Correct the market snapshot.** The dashboard renders four hard-coded changes under a real-time heading. Derive signed changes from comparable observations and show the period and latest data date. Show an unavailable state when the series lacks a comparable point. Label ETF proxies such as FXI, EWY and EWA by their instrument and ticker so readers can distinguish them from country indexes. [Dashboard template](src/views/HomeView.vue#L3)
2. **Keep price and return visible with the instrument.** At 390 px, Stock Prices initially shows Code and Name, with Price outside the visible table area. Movers likewise puts the current price and change beyond the visible area. Combine symbol and company into one cell. Put price and signed change next, with dates, volume and prior price available on demand. [Stock prices](src/views/StockPrice.vue#L35) · [Movers](src/views/MoversView.vue#L48)
3. **Make the tables fit the comparison.** The fund grid renders 2,540 px of columns in a 1,270 px desktop table viewport. Its first sample row was 79 px tall. Prioritize operational and performance columns and use a detail panel for the full parameter set. Movers renders two 950 px minimum-width grids that stack. A compact four-column view can show gainers and losers side by side on desktop, with a labeled switch on narrow screens. The current Movers screenshot also wraps rank `10` and the `Actions` header across lines. [Fund table](src/views/StrategyView.vue#L46) · [Movers tables](src/views/MoversView.vue#L38)
4. **Fix narrow-screen navigation and document overflow.** At 390 px the initial shell shows Dashboard while Markets, Fund, Simulate and Optimize sit beyond the visible navigation region. Give those destinations a compact tap- and keyboard-operable menu. The populated Stock Chart document measured 746 px wide, with the chart starting at y=1,337. The backtest history document measured 523 px wide and the graph measured 488 px before strategy selection. Keep horizontal scrolling inside data grids and let chart controls and filter bars wrap within the viewport. [Application shell](src/App.vue#L25) · [Stock Chart](src/views/StockChart.vue#L40) · [Backtest filters](src/views/SimulateBacktestHistory.vue#L8) · [Graph filters](src/views/SimulateGraphView.vue#L8)

## Route-by-route changes

| Route | Density change |
| --- | --- |
| `/` Dashboard | Replace the four large summary cards and eight default chart panels with a market grid showing instrument, latest value, signed change, as-of date and sparkline. Show one readable detail chart for the selected instrument. Keep instrument groups visible together on desktop. |
| `/stockPrice` Stock Prices | Put search in a single toolbar and combine symbol and company. Pin price beside the instrument on mobile, with volume and date in details. Increase the desktop default from 10 to 25 rows so tighter spacing yields more visible quotes. |
| `/movers` Market Movers | Put period and country in a compact toolbar. In each table show rank, instrument, latest price and change. Link the instrument to its chart and keep previous price and the stock explanation accessible from the row. State the selected period once above both rankings. The draft already supplies row currency, which the compact view should preserve. |
| `/stockChart` Stock Chart | Put symbol, quote, signed change, currency and data date together. Keep period controls adjacent to the chart and place comparable fundamentals alongside it on wide screens, below on mobile. Group the draft’s analysis and price-refresh operations in one secondary area with progress and errors still visible. |
| `/stockRelations/:stockId` Stock Relations | The route currently renders only a heading. A populated version needs a symbol, analysis window and a sortable peer table with relationship metric and sample period. Treat this as a feature gap, with its own scope. |
| `/fund` Fund Strategy | Compress summary counts into a single line. Lead with strategy, market, period and annual return, status and action. Put raw parameters in row details and preserve access to editing. |
| `/strategyHistory` Strategy History | Keep date, strategy, symbol, exit reason and return in predictable positions. The existing grid derives columns from returned rows. Define those primary columns explicitly and show other returned fields in details. |
| `/simulate/strategy` Strategies | Keep country, strategy type and active return filters visible in the toolbar. Right-align numeric parameters and returns. Keep selection and comparison actions close to the selected rows. |
| `/simulate/backtest-history` Backtest History | With a selected strategy, the summary pushes the trade table to y=758 on desktop and y=2,354 on mobile. Group figures by return, risk and activity in compact aligned bands. Follow immediately with trade date, instrument, entry and exit price, and return. Preserve Sharpe, drawdown and other available metrics in the summary and secondary detail. |
| `/simulate/graph` Strategy Graph | Put strategy selection and compact annual and total return figures above the NAV chart. Keep the full chart and its axis labels legible. Put benchmark basis, measurement period and dividend/currency treatment next to the legend when the draft benchmark overlay is present. |
| `/simulate/run` Run Simulation | Give strategy, country, dates and the main action a stable position. Group conditional and advanced parameters and display a summary of applied settings. After a run, put metrics and trades near the top, with exclusions accessible alongside the results. The default form’s Run Simulation button starts at y=1,095 at 1440 × 900. |
| `/optimization/config` Parameter Optimization | Put strategy, method and dates at the top. Lay out each parameter range in a row with label, minimum, maximum and step. Keep validation and combination count near the start action, currently at y=1,343 on desktop. Keep walk-forward controls together when selected. |
| `/optimization/monitor` Optimization Monitor | Keep job, status, progress, best return and Sharpe visible together. Use a job detail pane on desktop and a dedicated detail view on small screens, with the ranked results and actions beside the selected job context. |
| `/about` About | The authenticated diagnostic template renders an access-token field alongside claims. Remove token rendering as a separate cleanup and put any retained diagnostics in a small key/value list. This route has no financial-data density work. |

## Shared compact layout

- **Structure.** Keep the existing 52 px desktop navigation. Use a single title and toolbar over each data surface, with 12–16 px page gutters as a starting point and 8–12 px gaps within control groups. Reduce repeated subtitles and nested card padding. Keep charts tall enough to read axes and distinguish series.
- **Type and alignment.** Keep the existing Inter and system font stack. Use 20–24 px page titles and 13–14 px table text, with right-aligned tabular numbers and left-aligned names. Keep currency, units and precision explicit. Preserve `+` and `−` signs and a text label for statuses.
- **Palette.** Start with the existing slate ink `#0F172A`, soft surface `#F5F7FA`, divider `#E3E8EF`, action blue `#1976D2`, gain green `#2E7D32` and loss red `#D32F2F`. Reserve the gain and loss colors for signed values and verify contrast in both themes.
- **Interaction.** Target 32–36 px desktop data rows and approximately 32 px table headers. Keep mobile controls comfortably tappable. Pin only the essential identifier when the grid needs horizontal scrolling. Keep full company names accessible when truncated and preserve keyboard access to row details and sorting.

```text
Market Movers                     [Period] [Country]
Gainers                            Losers
#  Instrument    Last   Change     #  Instrument    Last   Change
```

## Implementation order and acceptance

1. Start with the shared shell, Stock Prices and Movers. At 1440 × 900, target a first table header above y=200, at least 15 visible quote rows with adequate data, and both 10-row mover rankings visible together. Verify that a 390 px viewport shows instrument and price or return for market lists, with no document-level horizontal overflow.
2. Apply the grid and detail pattern to Fund, Strategy History, Simulation Strategies, Backtest History and Optimization Monitor. Verify sorting, filtering, status and date formatting, detail access, and long symbols and company names. Test zero, negative, large and unavailable financial values across instrument currencies.
3. Apply the dashboard and chart treatments, then the Simulation and Optimization forms. Verify chart labels across breakpoints, the distinction between price and total return, and access to the primary action before scrolling in the default desktop form. Check conditional fields, validation, progress and results separately.

## Review coverage

Reviewed the 14 registered Vue routes and shared shell in source. Rendered all 14 in Edge at 1440 × 900 and 390 × 844 against the existing local development server, which serves the frontend draft. Also rendered Stock Chart with a symbol and Backtest History and Strategy Graph with a selected strategy. Browser requests used in-memory synthetic data and a browser-local auth fixture. A separate live browser session reached the sign-in page. The measurements describe the fixture and current draft layout. Authenticated data, completed simulation results and optimization details were outside browser verification. The review worktree is based on frontend commit `7273b61`.
