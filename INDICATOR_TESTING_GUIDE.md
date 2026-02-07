# Indicator Strategy Testing Guide

## Prerequisites
- [ ] ABP Backend running at `https://localhost:44324`
- [ ] Vue frontend running at `https://localhost:4200`
- [ ] MarketWatchCore simulation service running at `http://localhost:52335`
- [ ] Database contains stock price data for testing

## Test Plan

### 1. UI Functionality Tests

#### 1.1 Strategy Configuration Type Toggle
- [ ] Navigate to `/simulate/run`
- [ ] Verify "Strategy Configuration Type" section is visible
- [ ] Verify radio buttons show "Pair-Trading" and "Indicator-Based"
- [ ] Default selection should be "Pair-Trading"
- [ ] Click "Indicator-Based" - verify indicator fields appear
- [ ] Click "Pair-Trading" - verify indicator fields hide

#### 1.2 Indicator Selection
**When "Indicator-Based" is selected:**
- [ ] Primary Indicator dropdown shows three options:
  - RSI (Relative Strength Index)
  - MACD
  - Bollinger Bands
- [ ] Select RSI - verify default period changes to 14
- [ ] Select MACD - verify default period changes to 26
- [ ] Select Bollinger Bands - verify default period changes to 20
- [ ] Verify "Indicator Period" input is editable (range: 2-200)

#### 1.3 Field Visibility Logic
**Indicator-Based Mode:**
- [ ] "Coefficient Allowed" field should be HIDDEN
- [ ] "Analysis Method" (Correlation/Cointegration) should be HIDDEN
- [ ] "Invest Trigger Rate" label changes to "Indicator Threshold"
- [ ] Tooltip shows context-specific hint (e.g., "RSI oversold level = 30")

**Pair-Trading Mode:**
- [ ] "Coefficient Allowed" field should be VISIBLE
- [ ] "Analysis Method" (Correlation/Cointegration) should be VISIBLE
- [ ] "Invest Trigger Rate" label shows "Entry Trigger (%)" or "Z-Score Threshold"
- [ ] Indicator fields (Primary Indicator, Indicator Period) should be HIDDEN

#### 1.4 Smart Defaults
- [ ] Switch to Indicator-Based mode - verify RSI selected with period 14 and threshold 30
- [ ] Change to MACD - verify period updates to 26 and threshold to 0
- [ ] Change to Bollinger Bands - verify period updates to 20 and threshold to 2

### 2. API Integration Tests

#### 2.1 RSI Mean Reversion Strategy
**Configuration:**
- Strategy Type: Mean Reversion
- Configuration Type: Indicator-Based
- Primary Indicator: RSI
- Indicator Period: 14
- Indicator Threshold: 30 (oversold level)
- Start Date: 2024-01-01
- End Date: 2024-12-31
- Stock(s): Any liquid stock (e.g., AAPL, MSFT)

**Expected Behavior:**
- [ ] Form submits without errors
- [ ] API request includes `primaryIndicator: "RSI"`
- [ ] API request includes `indicatorPeriod: 14`
- [ ] API request includes `investTriggerRate: 30`
- [ ] Backend routes to `RSIMeanReversionStrategy`
- [ ] Simulation completes successfully
- [ ] Results page shows trade history with RSI-based entries

**Verify in Browser DevTools Network Tab:**
```json
{
  "strategyType": 0, // MeanReversion
  "primaryIndicator": "RSI",
  "indicatorPeriod": 14,
  "investTriggerRate": 30.0,
  // ... other fields
}
```

#### 2.2 Bollinger Bands Strategy
**Configuration:**
- Strategy Type: Mean Reversion
- Configuration Type: Indicator-Based
- Primary Indicator: Bollinger Bands
- Indicator Period: 20
- Indicator Threshold: 2 (standard deviations)
- Start Date: 2024-01-01
- End Date: 2024-12-31

**Expected Behavior:**
- [ ] API request includes `primaryIndicator: "BollingerBands"`
- [ ] API request includes `indicatorPeriod: 20`
- [ ] Simulation runs successfully

#### 2.3 MACD Strategy
**Configuration:**
- Strategy Type: Momentum
- Configuration Type: Indicator-Based
- Primary Indicator: MACD
- Indicator Period: 26
- Indicator Threshold: 0

**Expected Behavior:**
- [ ] API request includes `primaryIndicator: "MACD"`
- [ ] API request includes `indicatorPeriod: 26`
- [ ] Simulation runs successfully

### 3. Backward Compatibility Tests

#### 3.1 Existing Pair-Trading Strategies
**Configuration:**
- Strategy Type: Mean Reversion
- Configuration Type: Pair-Trading
- Analysis Method: Correlation
- Coefficient Allowed: Top 100
- Analysis Period: 250
- Entry Trigger: 5.0%

**Expected Behavior:**
- [ ] API request does NOT include `primaryIndicator` (null)
- [ ] API request does NOT include `indicatorPeriod` (null)
- [ ] API request includes traditional pair-trading fields
- [ ] Backend routes to traditional `BacktestStrategyBase`
- [ ] Simulation runs successfully (no regression)

#### 3.2 Switching Between Modes
- [ ] Configure an RSI strategy (Indicator-Based)
- [ ] Switch to Pair-Trading mode
- [ ] Verify indicator fields are cleared/hidden
- [ ] Configure pair-trading parameters
- [ ] Switch back to Indicator-Based mode
- [ ] Verify previous indicator values are NOT restored (fresh defaults)

### 4. Performance Tests

#### 4.1 Indicator Cache Verification
**Monitor Backend Logs:**
```
G:\SourceCode\MarketWatchWeb_AbpBackEnd\src\MarketWatchWeb.HttpApi.Host\Logs\logs.txt
```

**First Run (Cold Cache):**
- [ ] Run RSI strategy simulation
- [ ] Check logs for "Pre-calculating indicators..."
- [ ] Note execution time
- [ ] Verify results are correct

**Second Run (Warm Cache):**
- [ ] Run SAME RSI strategy configuration again
- [ ] Check logs for cache hit messages
- [ ] Note execution time (should be significantly faster - 10-1300x speedup)
- [ ] Verify results match first run

**Expected Log Entries:**
```
[INF] Pre-calculating indicators for 100 stocks...
[INF] Indicator cache: 95% hit rate
[INF] Simulation completed in 2.5s (vs 45s cold)
```

### 5. Edge Case Tests

#### 5.1 Invalid Indicator Period
- [ ] Set Indicator Period to 1 (below minimum)
- [ ] Verify validation error or auto-correct to 2
- [ ] Set Indicator Period to 500 (above maximum)
- [ ] Verify validation error or auto-correct to 200

#### 5.2 Missing Required Fields
- [ ] Select Indicator-Based mode
- [ ] Clear Primary Indicator selection
- [ ] Attempt to submit form
- [ ] Verify appropriate validation error

#### 5.3 Date Range Edge Cases
- [ ] Set date range shorter than indicator period (e.g., 5 days with RSI-14)
- [ ] Verify backend handles gracefully (error message or no trades)

### 6. Data Validation Tests

#### 6.1 Verify Strategy Record in Database
After running an indicator strategy:
- [ ] Check `strategy` table in database
- [ ] Verify `PrimaryIndicator` column has correct value ("RSI", "MACD", or "BollingerBands")
- [ ] Verify `IndicatorPeriod` column has correct value (14, 20, 26, etc.)
- [ ] Verify `SecondaryIndicator` and `IndicatorParameters` are null (for simple strategies)

#### 6.2 Verify BacktestHistory Results
- [ ] Check `backtestHistory` table for new simulation results
- [ ] Verify `StrategyId` links to correct strategy record
- [ ] Verify trade dates, entry/exit prices make sense for indicator logic
- [ ] Verify performance metrics (Sharpe ratio, win rate) are calculated

### 7. Documentation Tests

#### 7.1 CLAUDE.md Accuracy
- [ ] Read CLAUDE.md "Indicator-Based Strategies" section
- [ ] Verify all documented features match actual implementation
- [ ] Verify usage examples are accurate and complete
- [ ] Verify indicator descriptions match actual behavior

## Test Results

### Summary
- **Total Tests:** 50+
- **Passed:** ___
- **Failed:** ___
- **Blocked:** ___

### Issues Found
| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1       |             |          |        |
| 2       |             |          |        |

### Performance Metrics
| Test Case | First Run | Cached Run | Speedup |
|-----------|-----------|------------|---------|
| RSI-14 (100 stocks, 1 year) | ___s | ___s | ___x |
| MACD (100 stocks, 1 year)   | ___s | ___s | ___x |
| Bollinger Bands (50 stocks) | ___s | ___s | ___x |

## Regression Tests Passed?
- [ ] Existing pair-trading strategies still work
- [ ] Correlation-based strategies still work
- [ ] Cointegration-based strategies still work
- [ ] Optimization jobs still work
- [ ] Live trading strategies (`tblFundStrategy`) unaffected

## Sign-Off

**Frontend Developer:** _____________ Date: _____
**Backend Developer:** _____________ Date: _____
**QA Engineer:** _____________ Date: _____

## Notes

- Remember to regenerate TypeScript client properly once backend is running:
  ```bash
  cd G:\SourceCode\MarketWatchWeb_AbpBackEnd\src\MarketWatchWeb.HttpApi.Host
  CreateClient.bat
  ```
- Current TypeScript client has manually added indicator fields (temporary fix)
- Monitor backend logs for indicator cache performance
- Test with diverse stock symbols and date ranges
