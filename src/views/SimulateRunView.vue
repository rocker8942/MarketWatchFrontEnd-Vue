<template>
  <div class="page-container">
    <div class="content-wrapper">
      <PageHeader
        title="Run Simulation"
        subtitle="Execute trading strategy simulations using historical data"
      />
      <!-- Configuration Form -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">Simulation Configuration</span>
          </div>
        </template>

        <el-form :model="formData" label-position="top" :disabled="running">
          <el-row :gutter="24">
            <!-- Strategy Type -->
            <el-col :span="12">
              <el-form-item label="Strategy Type" required>
                <el-select
                  v-model="formData.strategyType"
                  placeholder="Select strategy"
                  style="width: 100%"
                  @change="onStrategyChanged">
                  <el-option
                    v-for="strategy in strategies"
                    :key="strategy.type"
                    :label="strategy.name"
                    :value="strategy.type">
                    <div class="strategy-option">
                      <span class="strategy-name">{{ strategy.name }}</span>
                      <span class="strategy-desc">{{ strategy.description }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <!-- Country -->
            <el-col :span="12">
              <el-form-item label="Country" required>
                <el-select
                  v-model="formData.country"
                  placeholder="Select country"
                  style="width: 100%">
                  <el-option
                    v-for="country in countries"
                    :key="country.value"
                    :label="country.name"
                    :value="country.value" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- Analysis Method -->
            <el-col :span="24" v-if="isMeanReversionStrategy">
              <el-form-item label="Analysis Method" required>
                <el-radio-group v-model="formData.analysisMethod" @change="onAnalysisMethodChanged">
                  <el-radio :value="0">
                    <div style="display: inline-block;">
                      <div style="font-weight: 500;">Correlation</div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary);">
                        Measures synchronous co-movement between stocks (-1 to 1)
                      </div>
                    </div>
                  </el-radio>
                  <el-radio :value="1" style="margin-top: 0.5rem;">
                    <div style="display: inline-block;">
                      <div style="font-weight: 500;">Cointegration</div>
                      <div style="font-size: 0.75rem; color: var(--color-text-secondary);">
                        Identifies long-term equilibrium relationships (statistical pairs trading)
                      </div>
                    </div>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>

            <!-- Date Range -->
            <el-col :span="12">
              <el-form-item label="Start Date" required>
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="Select start date"
                  style="width: 100%"
                  :disabled-date="disabledStartDate" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="End Date" required>
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="Select end date"
                  style="width: 100%"
                  :disabled-date="disabledEndDate" />
              </el-form-item>
            </el-col>

            <!-- Analysis Period -->
            <el-col :span="8">
              <el-form-item label="Analysis Period (days)" required>
                <el-input-number
                  v-model="formData.analysisPeriod"
                  :min="1"
                  :max="365"
                  style="width: 100%" />
              </el-form-item>
            </el-col>

            <!-- Coefficient Allowed -->
            <el-col :span="8">
              <el-form-item :label="coefficientAllowedLabel" required>
                <el-input-number
                  v-model="formData.coefficientAllowed"
                  :min="coefficientAllowedMin"
                  :max="coefficientAllowedMax"
                  :step="coefficientAllowedStep"
                  :precision="coefficientAllowedPrecision"
                  style="width: 100%" />
                <span class="form-hint" style="display: block; margin-top: 0.5rem;">
                  {{ coefficientAllowedHint }}
                </span>
              </el-form-item>
            </el-col>

            <!-- Portfolio Number -->
            <el-col :span="8">
              <el-form-item label="Portfolio Size" required>
                <el-input-number
                  v-model="formData.portfolioNumber"
                  :min="1"
                  :max="100"
                  style="width: 100%" />
              </el-form-item>
            </el-col>

            <!-- Invest Trigger Rate -->
            <el-col :span="8">
              <el-form-item :label="investTriggerRateLabel" required>
                <el-input-number
                  v-model="formData.investTriggerRate"
                  :min="investTriggerRateMin"
                  :max="investTriggerRateMax"
                  :step="investTriggerRateStep"
                  :precision="investTriggerRatePrecision"
                  style="width: 100%" />
                <span class="form-hint" style="display: block; margin-top: 0.5rem;">
                  {{ investTriggerRateHint }}
                </span>
              </el-form-item>
            </el-col>

            <!-- Loss Cut Rate -->
            <el-col :span="8">
              <el-form-item label="Stop Loss (%)" required>
                <el-input-number
                  v-model="formData.lossCutRate"
                  :min="-1"
                  :max="0"
                  :step="0.01"
                  :precision="2"
                  style="width: 100%" />
              </el-form-item>
            </el-col>

            <!-- Trade Fee -->
            <el-col :span="8">
              <el-form-item label="Trade Fee (%)" required>
                <el-input-number
                  v-model="formData.tradeFee"
                  :min="0"
                  :max="1"
                  :step="0.001"
                  :precision="3"
                  style="width: 100%" />
              </el-form-item>
            </el-col>

            <!-- Slippage -->
            <el-col :span="8">
              <el-form-item label="Slippage (%)" required>
                <el-input-number
                  v-model="formData.slippage"
                  :min="0"
                  :max="1"
                  :step="0.001"
                  :precision="3"
                  style="width: 100%" />
              </el-form-item>
            </el-col>

            <!-- Trend Filter -->
            <el-col :span="8">
              <el-form-item label="Use Trend Filter">
                <el-switch v-model="formData.useTrendFilter" />
                <span class="form-hint" style="display: block; margin-top: 0.5rem;">
                  Filter trades based on market trend direction
                </span>
              </el-form-item>
            </el-col>

            <!-- Trend Filter Threshold -->
            <el-col :span="8">
              <el-form-item label="Trend Filter Threshold" required>
                <el-input-number
                  v-model="formData.trendFilterThreshold"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  :precision="2"
                  :disabled="!formData.useTrendFilter"
                  style="width: 100%" />
                <span class="form-hint" style="display: block; margin-top: 0.5rem;">
                  Threshold for trend strength (0-1)
                </span>
              </el-form-item>
            </el-col>

            <!-- Stock Codes -->
            <el-col :span="24">
              <el-form-item label="Stock Codes">
                <div class="stock-selection-header">
                  <el-button size="small" @click="selectTopStocks">Select Top 20 Stocks</el-button>
                  <el-button size="small" @click="clearStocks">Clear Selection</el-button>
                </div>
                <el-select
                  v-model="formData.stockCodes"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="Select stocks or leave empty to use all available stocks"
                  style="width: 100%; margin-top: 0.5rem">
                  <el-option
                    v-for="stock in filteredStocks"
                    :key="stock.code"
                    :label="`${stock.code} - ${stock.name}`"
                    :value="stock.code" />
                </el-select>
                <div class="form-hint">
                  Optional: Select specific stocks to test, or leave empty to use all available stocks in the selected country.
                  Selected: {{ formData.stockCodes.length > 0 ? formData.stockCodes.length : 'All' }} stocks
                </div>
              </el-form-item>
            </el-col>

            <!-- Run Async -->
            <el-col :span="24">
              <el-form-item label="Execution Mode">
                <el-radio-group v-model="formData.runAsync">
                  <el-radio :value="true">Asynchronous (recommended for long simulations)</el-radio>
                  <el-radio :value="false">Synchronous (wait for completion)</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>

            <!-- Action Buttons -->
            <el-col :span="24">
              <div class="action-buttons">
                <el-button @click="resetForm">Reset</el-button>
                <el-button type="primary" :loading="running" @click="runSimulation">
                  <el-icon v-if="!running"><VideoPlay /></el-icon>
                  {{ running ? 'Running...' : 'Run Simulation' }}
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- Results Section -->
      <el-card v-if="simulationResult" class="results-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">Simulation Results</span>
            <el-tag v-if="simulationResult.status === 0" type="warning">Pending</el-tag>
            <el-tag v-else-if="simulationResult.status === 1" type="info">Running</el-tag>
            <el-tag v-else-if="simulationResult.status === 2" type="success">Completed</el-tag>
            <el-tag v-else-if="simulationResult.status === 3" type="danger">Failed</el-tag>
          </div>
        </template>

        <!-- Simulation Info -->
        <div class="result-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Simulation ID:</span>
              <span class="info-value">{{ simulationResult.simulationId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Strategy ID:</span>
              <span class="info-value">{{ simulationResult.strategyId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Requested At:</span>
              <span class="info-value">{{ formatDateTime(simulationResult.requestedAt) }}</span>
            </div>
            <div class="info-item" v-if="simulationResult.completedAt">
              <span class="info-label">Completed At:</span>
              <span class="info-value">{{ formatDateTime(simulationResult.completedAt) }}</span>
            </div>
          </div>

          <el-alert
            v-if="simulationResult.errorMessage"
            type="error"
            :title="simulationResult.errorMessage"
            :closable="false"
            style="margin-top: 1rem" />
        </div>

        <!-- Performance Summary -->
        <div v-if="simulationResult.summary" class="result-section">
          <h3 class="section-title">Performance Metrics</h3>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Return</div>
              <div class="metric-value" :class="getReturnClass(simulationResult.summary.totalReturn)">
                {{ formatPercentage(simulationResult.summary.totalReturn) }}
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Annualized Return</div>
              <div class="metric-value" :class="getReturnClass(simulationResult.summary.annualizedReturn)">
                {{ formatPercentage(simulationResult.summary.annualizedReturn) }}
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Sharpe Ratio</div>
              <div class="metric-value">{{ formatNumber(simulationResult.summary.sharpeRatio) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Max Drawdown</div>
              <div class="metric-value negative">
                {{ formatPercentage(simulationResult.summary.maxDrawdown) }}
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Win Rate</div>
              <div class="metric-value">{{ formatPercentage(simulationResult.summary.winRate) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Total Trades</div>
              <div class="metric-value">{{ simulationResult.summary.totalTrades }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Days Simulated</div>
              <div class="metric-value">{{ simulationResult.summary.daysSimulated }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Volatility</div>
              <div class="metric-value">{{ formatPercentage(simulationResult.summary.volatility) }}</div>
            </div>
          </div>
        </div>

        <!-- Trade Details -->
        <div v-if="simulationResult.summary?.trades && simulationResult.summary.trades.length > 0" class="result-section">
          <h3 class="section-title">Trade History ({{ simulationResult.summary.trades.length }} trades)</h3>

          <el-table :data="paginatedTrades" stripe class="trades-table">
            <el-table-column label="Entry Date" min-width="120">
              <template #default="scope">
                {{ formatDate(scope.row.entryDate) }}
              </template>
            </el-table-column>

            <el-table-column label="Exit Date" min-width="120">
              <template #default="scope">
                {{ formatDate(scope.row.exitDate) }}
              </template>
            </el-table-column>

            <el-table-column label="Leader" prop="leaderCode" min-width="100" />
            <el-table-column label="Follower" prop="followerCode" min-width="100" />

            <el-table-column label="Entry Price" min-width="110" align="right">
              <template #default="scope">
                ${{ formatNumber(scope.row.entryPrice) }}
              </template>
            </el-table-column>

            <el-table-column label="Exit Price" min-width="110" align="right">
              <template #default="scope">
                ${{ formatNumber(scope.row.exitPrice) }}
              </template>
            </el-table-column>

            <el-table-column label="Return" min-width="100" align="right">
              <template #default="scope">
                <span :class="getReturnClass(scope.row.return)">
                  {{ formatPercentage(scope.row.return) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="Exit Reason" prop="exitReason" min-width="150" />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="tradesCurrentPage"
              v-model:page-size="tradesPageSize"
              :page-sizes="[10, 25, 50, 100]"
              :total="simulationResult.summary.trades.length"
              layout="total, sizes, prev, pager, next"
              background />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import axios from "axios";
import PageHeader from "@/components/PageHeader.vue";
import { VideoPlay } from '@element-plus/icons-vue';
import { StockInfoClient } from "@/core/services/marketWatchClient";
import ApiService from "@/core/services/apiService";

enum AnalysisMethod {
  Correlation = 0,
  Cointegration = 1
}

enum CointegrationMethod {
  EngleGranger = 0
}

enum CorrelationMethod {
  PearsonSIMD = 0,
  Spearman = 1
}

interface Strategy {
  type: number;
  name: string;
  description: string;
  recommendedParameters: {
    analysisPeriod: number;
    coefficientAllowed: number;
    investTriggerRate: number;
    lossCutRate: number;
  };
}

interface Country {
  value: number;
  name: string;
}

interface TradeDetail {
  entryDate: string;
  exitDate: string;
  leaderCode: string;
  followerCode: string;
  entryPrice: number;
  exitPrice: number;
  return: number;
  exitReason: string;
}

interface SimulationSummary {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  daysSimulated: number;
  volatility: number;
  trades: TradeDetail[];
}

interface SimulationResult {
  simulationId: string;
  status: number;
  strategyId: number;
  summary: SimulationSummary | null;
  errorMessage: string | null;
  requestedAt: string;
  completedAt: string | null;
}

export default defineComponent({
  components: {
    PageHeader,
    VideoPlay
  },

  data() {
    return {
      strategies: [] as Strategy[],
      countries: [] as Country[],
      availableStocks: [] as Array<{ code: string; name: string; country: string }>,
      formData: {
        strategyType: 0,
        country: 0,
        startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: new Date(),
        analysisPeriod: 60,
        coefficientAllowed: 0.85,
        investTriggerRate: 0.02,
        lossCutRate: -0.01,
        portfolioNumber: 10,
        tradeFee: 0.001,
        slippage: 0.001,
        stockCodes: [] as string[],
        runAsync: true,
        useTrendFilter: true,
        trendFilterThreshold: 0.08,
        analysisMethod: AnalysisMethod.Correlation,
        cointegrationMethod: CointegrationMethod.EngleGranger,
        correlationMethod: CorrelationMethod.PearsonSIMD
      },
      running: false,
      simulationResult: null as SimulationResult | null,
      tradesCurrentPage: 1,
      tradesPageSize: 25,
      simulationApiUrl: "http://localhost:52335",
      statusPollTimer: null as number | null,
      isLoadingFromRoute: false
    };
  },

  computed: {
    paginatedTrades(): TradeDetail[] {
      if (!this.simulationResult?.summary?.trades) return [];
      const start = (this.tradesCurrentPage - 1) * this.tradesPageSize;
      const end = start + this.tradesPageSize;
      return this.simulationResult.summary.trades.slice(start, end);
    },

    filteredStocks(): Array<{ code: string; name: string; country: string }> {
      if (this.formData.country === 0) {
        // Show all stocks
        return this.availableStocks;
      }

      // Map country code to country string
      const countryMap: { [key: number]: string[] } = {
        1: ['US', 'USA', 'United States'],
        2: ['AU', 'AUS', 'Australia', 'ASX'],
        3: ['Korea', 'KR', 'South Korea']
      };

      const countryStrings = countryMap[this.formData.country] || [];

      // Filter stocks by country
      return this.availableStocks.filter(stock => {
        // Check if stock's country matches any of the country strings
        return countryStrings.some(countryStr =>
          stock.country?.toUpperCase() === countryStr.toUpperCase() ||
          stock.country?.toUpperCase().includes(countryStr.toUpperCase())
        );
      });
    },

    isMeanReversionStrategy(): boolean {
      const strategy = this.strategies.find(s => s.type === this.formData.strategyType);
      return strategy?.name === 'MeanReversion';
    },

    isCointegrationMode(): boolean {
      return this.formData.analysisMethod === AnalysisMethod.Cointegration;
    },

    coefficientAllowedLabel(): string {
      return this.isCointegrationMode ? 'P-Value Threshold' : 'Correlation Threshold';
    },

    coefficientAllowedMin(): number {
      return 0;
    },

    coefficientAllowedMax(): number {
      return this.isCointegrationMode ? 0.20 : 1.0;
    },

    coefficientAllowedStep(): number {
      return this.isCointegrationMode ? 0.01 : 0.05;
    },

    coefficientAllowedPrecision(): number {
      return this.isCointegrationMode ? 3 : 2;
    },

    coefficientAllowedHint(): string {
      return this.isCointegrationMode
        ? 'Maximum p-value for cointegration (0-0.20, lower = stronger relationship)'
        : 'Minimum correlation coefficient (0-1, higher = stronger relationship)';
    },

    investTriggerRateLabel(): string {
      return this.isCointegrationMode ? 'Z-Score Threshold' : 'Entry Trigger (%)';
    },

    investTriggerRateMin(): number {
      return 0;
    },

    investTriggerRateMax(): number {
      return this.isCointegrationMode ? 5.0 : 1.0;
    },

    investTriggerRateStep(): number {
      return this.isCointegrationMode ? 0.1 : 0.01;
    },

    investTriggerRatePrecision(): number {
      return this.isCointegrationMode ? 1 : 2;
    },

    investTriggerRateHint(): string {
      return this.isCointegrationMode
        ? 'Enter trade when spread is this many standard deviations from mean (1.5-3.0 typical)'
        : 'Enter trade when stocks diverge by this percentage';
    }
  },

  methods: {
    async loadStrategiesAndCountries() {
      try {
        const response = await axios.get(`${this.simulationApiUrl}/api/Simulation/strategies`);
        this.strategies = response.data.strategies || [];
        this.countries = response.data.countries || [];

        // Check if we have route parameters to load
        const hasRouteParams = this.$route.query.strategyType !== undefined;

        if (hasRouteParams) {
          // Wait for Vue to update the DOM with the new options
          await this.$nextTick();
          // Load parameters from route after strategies and countries are loaded
          this.loadParametersFromRoute();
        } else if (this.strategies.length > 0) {
          // Default behavior: set first strategy and load recommended parameters
          this.formData.strategyType = this.strategies[0].type;
          this.onStrategyChanged();
        }
      } catch (error) {
        console.error("Failed to load strategies and countries", error);
        this.$message.error("Failed to load simulation configuration");
      }
    },

    async loadAvailableStocks() {
      try {
        const client = new StockInfoClient(undefined, ApiService.vueInstance.axios);
        const result = await client.stockInfoGetList(undefined, 0, 1000);
        this.availableStocks = (result.items || []).map((stock: any) => ({
          code: stock.stockCode || stock.code || stock.id || '',
          name: stock.name || '',
          country: stock.country || ''
        })).filter(s => s.code);
      } catch (error) {
        console.error("Failed to load stocks", error);
      }
    },

    onStrategyChanged() {
      // Skip auto-updating parameters if we're loading from route
      if (this.isLoadingFromRoute) {
        return;
      }

      const strategy = this.strategies.find(s => s.type === this.formData.strategyType);
      if (strategy?.recommendedParameters) {
        // Set analysis period to 90 for MeanReversion strategy, otherwise use recommended value
        if (strategy.name === 'MeanReversion') {
          this.formData.analysisPeriod = 90;
        } else {
          this.formData.analysisPeriod = strategy.recommendedParameters.analysisPeriod;
        }
        this.formData.coefficientAllowed = strategy.recommendedParameters.coefficientAllowed;
        this.formData.investTriggerRate = strategy.recommendedParameters.investTriggerRate;
        this.formData.lossCutRate = -0.01; // Default stoploss for all strategies
      }
    },

    onAnalysisMethodChanged() {
      // Update parameters based on analysis method
      if (this.formData.analysisMethod === AnalysisMethod.Cointegration) {
        // Switch to cointegration mode - use recommended cointegration parameters
        this.formData.coefficientAllowed = 0.05; // p-value threshold
        this.formData.investTriggerRate = 2.0; // z-score threshold
      } else {
        // Switch to correlation mode - use recommended correlation parameters
        this.formData.coefficientAllowed = 0.80; // correlation threshold
        this.formData.investTriggerRate = 0.02; // percentage divergence
      }
    },

    disabledStartDate(date: Date) {
      if (!this.formData.endDate) return false;
      return date > this.formData.endDate;
    },

    disabledEndDate(date: Date) {
      if (!this.formData.startDate) return false;
      return date < this.formData.startDate || date > new Date();
    },

    selectTopStocks() {
      if (this.filteredStocks.length === 0) {
        this.$message.warning("No stocks available for the selected country. Please select a different country.");
        return;
      }
      this.formData.stockCodes = this.filteredStocks.slice(0, 20).map(s => s.code);
      this.$message.success(`Selected top ${this.formData.stockCodes.length} stocks from ${this.formData.country === 0 ? 'all countries' : 'selected country'}`);
    },

    clearStocks() {
      this.formData.stockCodes = [];
      this.$message.info("Stock selection cleared. Will use all available stocks.");
    },

    async runSimulation() {
      // Validate required fields
      if (!this.formData.startDate || !this.formData.endDate) {
        this.$message.warning("Please select both start and end dates");
        return;
      }

      this.running = true;
      this.simulationResult = null;

      try {
        const requestPayload = {
          strategyType: this.formData.strategyType,
          country: this.formData.country,
          startDate: this.formData.startDate.toISOString(),
          endDate: this.formData.endDate.toISOString(),
          analysisPeriod: this.formData.analysisPeriod,
          coefficientAllowed: this.formData.coefficientAllowed,
          investTriggerRate: this.formData.investTriggerRate,
          lossCutRate: this.formData.lossCutRate,
          portfolioNumber: this.formData.portfolioNumber,
          tradeFee: this.formData.tradeFee,
          slippage: this.formData.slippage,
          stockCodes: this.formData.stockCodes.length > 0 ? this.formData.stockCodes : [],
          runAsync: this.formData.runAsync,
          useTrendFilter: this.formData.useTrendFilter,
          trendFilterThreshold: this.formData.trendFilterThreshold,
          analysisMethod: this.formData.analysisMethod,
          cointegrationMethod: this.formData.cointegrationMethod,
          correlationMethod: this.formData.correlationMethod
        };

        const response = await axios.post(
          `${this.simulationApiUrl}/api/Simulation/run`,
          requestPayload
        );

        this.simulationResult = response.data;

        if (this.simulationResult?.status === 2) {
          this.$message.success("Simulation completed successfully!");
        } else if (this.formData.runAsync) {
          this.$message.info(`Simulation started. ID: ${this.simulationResult?.simulationId}`);
          // Start polling for status updates
          if (this.simulationResult?.simulationId) {
            this.startStatusPolling(this.simulationResult.simulationId);
          }
        }
      } catch (error: any) {
        console.error("Simulation failed", error);
        const errorMsg = error.response?.data?.detail || error.response?.data?.title || error.message || "Unknown error";
        this.$message.error(`Simulation failed: ${errorMsg}`);
      } finally {
        this.running = false;
      }
    },

    async checkSimulationStatus(simulationId: string) {
      try {
        const response = await axios.get(
          `${this.simulationApiUrl}/api/Simulation/status/${simulationId}`
        );
        return response.data;
      } catch (error) {
        console.error("Failed to check simulation status", error);
        return null;
      }
    },

    startStatusPolling(simulationId: string) {
      // Clear any existing timer
      this.stopStatusPolling();

      // Poll every 3 seconds
      this.statusPollTimer = window.setInterval(async () => {
        const status = await this.checkSimulationStatus(simulationId);

        if (status) {
          this.simulationResult = status;

          // Check if simulation is completed or failed
          if (status.status === 2) {
            // Completed
            this.stopStatusPolling();
            this.$message.success("Simulation completed successfully!");
            // Use Element Plus notification for more prominent alert
            this.$notify({
              title: "Simulation Complete",
              message: `Simulation ${simulationId} has finished. Total Return: ${this.formatPercentage(status.summary?.totalReturn)}`,
              type: "success",
              duration: 5000, // Auto close after 5 seconds
              position: "bottom-right"
            });
          } else if (status.status === 3) {
            // Failed
            this.stopStatusPolling();
            this.$message.error("Simulation failed!");
            this.$notify({
              title: "Simulation Failed",
              message: `Simulation ${simulationId} failed: ${status.errorMessage || "Unknown error"}`,
              type: "error",
              duration: 5000, // Auto close after 5 seconds
              position: "bottom-right"
            });
          }
        }
      }, 3000); // Poll every 3 seconds
    },

    stopStatusPolling() {
      if (this.statusPollTimer !== null) {
        clearInterval(this.statusPollTimer);
        this.statusPollTimer = null;
      }
    },

    resetForm() {
      this.stopStatusPolling();
      this.formData = {
        strategyType: this.strategies[0]?.type || 0,
        country: 0,
        startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: new Date(),
        analysisPeriod: 60,
        coefficientAllowed: 0.85,
        investTriggerRate: 0.02,
        lossCutRate: -0.01,
        portfolioNumber: 10,
        tradeFee: 0.001,
        slippage: 0.001,
        stockCodes: [],
        runAsync: true,
        useTrendFilter: true,
        trendFilterThreshold: 0.08,
        analysisMethod: AnalysisMethod.Correlation,
        cointegrationMethod: CointegrationMethod.EngleGranger,
        correlationMethod: CorrelationMethod.PearsonSIMD
      };
      this.simulationResult = null;
      this.onStrategyChanged();
    },

    formatPercentage(value: number | null | undefined): string {
      if (value === null || value === undefined) return "—";
      return `${(value * 100).toFixed(2)}%`;
    },

    formatNumber(value: number | null | undefined): string {
      if (value === null || value === undefined) return "—";
      return value.toFixed(2);
    },

    formatDate(dateStr: string | null | undefined): string {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleDateString();
    },

    formatDateTime(dateStr: string | null | undefined): string {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleString();
    },

    getReturnClass(value: number | null | undefined): string {
      if (value === null || value === undefined) return "";
      return value >= 0 ? "positive" : "negative";
    },

    loadParametersFromRoute() {
      const query = this.$route.query;

      // Set flag to prevent onStrategyChanged from overwriting values
      this.isLoadingFromRoute = true;

      console.log('Loading parameters from route:', query);
      console.log('Available countries:', this.countries);

      // Populate form fields from query parameters if they exist
      if (query.strategyType) {
        this.formData.strategyType = parseInt(query.strategyType as string);
        console.log('Set strategyType to:', this.formData.strategyType);
      }

      // Map country code string to numeric value
      if (query.countryCode !== undefined) {
        const countryCodeRaw = query.countryCode as string;
        const countryCode = countryCodeRaw.toUpperCase();
        console.log('Looking for country code:', countryCode, '(raw:', countryCodeRaw, ')');
        console.log('Available countries from API:', this.countries);

        // Map country codes to full country names to search in the countries array
        const countryNameMap: { [key: string]: string[] } = {
          'US': ['United States', 'USA', 'US', 'America'],
          'HK': ['Hong Kong', 'HK', 'Hongkong'],
          'AU': ['Australia', 'AU'],
          'UK': ['United Kingdom', 'UK', 'Britain', 'Great Britain'],
          'JP': ['Japan', 'JP'],
          'CN': ['China', 'CN', 'PRC']
        };

        let matchingCountry = null;

        // First, try to find by matching country names from the map
        if (countryCode in countryNameMap) {
          const possibleNames = countryNameMap[countryCode];
          for (const name of possibleNames) {
            matchingCountry = this.countries.find(c =>
              c.name.toUpperCase() === name.toUpperCase() ||
              c.name.toUpperCase().includes(name.toUpperCase())
            );
            if (matchingCountry) {
              console.log('Found country by name mapping:', name, '->', matchingCountry.name, 'with value:', matchingCountry.value);
              break;
            }
          }
        }

        // If not found, try direct search in countries array
        if (!matchingCountry && countryCode) {
          matchingCountry = this.countries.find(c =>
            c.name.toUpperCase().includes(countryCode) ||
            c.name.toUpperCase().startsWith(countryCode) ||
            c.name.toUpperCase() === countryCode
          );
          if (matchingCountry) {
            console.log('Found country by code search:', matchingCountry.name, 'with value:', matchingCountry.value);
          }
        }

        // Set the country value
        if (matchingCountry) {
          this.formData.country = matchingCountry.value;
          console.log('Final country value set to:', this.formData.country);
        } else {
          console.warn('Could not find country for code:', countryCode);
          // Default to ALL (0) if not found
          this.formData.country = 0;
          console.log('Defaulting to ALL (0)');
        }

        // Force Vue to update the select
        this.$nextTick(() => {
          console.log('After nextTick, formData.country is:', this.formData.country);
        });
      } else if (query.country !== undefined) {
        // Fallback: direct numeric value (for backward compatibility)
        const countryValue = parseInt(query.country as string);
        this.formData.country = countryValue;
        console.log('Set country to:', this.formData.country, 'from query:', query.country);
      }

      if (query.analysisPeriod) {
        this.formData.analysisPeriod = parseInt(query.analysisPeriod as string);
      }

      if (query.coefficientAllowed) {
        this.formData.coefficientAllowed = parseFloat(query.coefficientAllowed as string);
      }

      if (query.investTriggerRate) {
        this.formData.investTriggerRate = parseFloat(query.investTriggerRate as string);
      }

      if (query.lossCutRate) {
        this.formData.lossCutRate = parseFloat(query.lossCutRate as string);
      }

      if (query.portfolioNumber) {
        this.formData.portfolioNumber = parseInt(query.portfolioNumber as string);
      }

      if (query.tradeFee) {
        this.formData.tradeFee = parseFloat(query.tradeFee as string);
      }

      if (query.slippage) {
        this.formData.slippage = parseFloat(query.slippage as string);
      }

      if (query.runAsync) {
        this.formData.runAsync = query.runAsync === 'true';
      }

      if (query.startDate) {
        this.formData.startDate = new Date(query.startDate as string);
      }

      if (query.endDate) {
        this.formData.endDate = new Date(query.endDate as string);
      }

      if (query.useTrendFilter !== undefined) {
        this.formData.useTrendFilter = query.useTrendFilter === 'true';
      }

      if (query.trendFilterThreshold) {
        this.formData.trendFilterThreshold = parseFloat(query.trendFilterThreshold as string);
      }

      if (query.analysisMethod !== undefined) {
        this.formData.analysisMethod = parseInt(query.analysisMethod as string);
      }

      if (query.cointegrationMethod !== undefined) {
        this.formData.cointegrationMethod = parseInt(query.cointegrationMethod as string);
      }

      if (query.correlationMethod !== undefined) {
        this.formData.correlationMethod = parseInt(query.correlationMethod as string);
      }

      // Reset flag after loading is complete
      this.isLoadingFromRoute = false;
    }
  },

  watch: {
    'formData.country'(newCountry, oldCountry) {
      // Clear stock selection when country changes
      if (newCountry !== oldCountry && !this.isLoadingFromRoute) {
        this.formData.stockCodes = [];
        this.$message.info(`Country changed. Stock selection cleared.`);
      }
    }
  },

  mounted() {
    this.loadStrategiesAndCountries();
    this.loadAvailableStocks();
  },

  beforeUnmount() {
    // Clean up polling timer when component is destroyed
    this.stopStatusPolling();
  }
});
</script>

<style scoped>
.page-container {
  padding: 2rem 3rem;
  max-width: 100%;
  background: var(--color-background);
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.config-card,
.results-card {
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.strategy-option {
  display: flex;
  flex-direction: column;
}

.strategy-name {
  font-weight: 500;
}

.strategy-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.5rem;
}

.stock-selection-header {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-subtle);
}

.result-section {
  margin-bottom: 2rem;
}

.result-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--color-text);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--color-surface-variant);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
}

.metric-value.positive {
  color: #27ae60;
}

.metric-value.negative {
  color: #e74c3c;
}

.trades-table {
  margin-top: 1rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1.5rem 1rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>
