<template>
  <div class="page-container">
    <div class="content-wrapper">
      <PageHeader
        title="Parameter Optimization"
        subtitle="Automatically find the best strategy parameters through systematic testing"
      />

      <!-- Configuration Form -->
      <el-card class="config-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">Optimization Configuration</span>
          </div>
        </template>

        <el-form :model="formData" label-position="top">
          <el-row :gutter="24">
            <!-- Strategy Type -->
            <el-col :span="12">
              <el-form-item label="Strategy Type" required>
                <el-select
                  v-model="formData.strategyType"
                  placeholder="Select strategy"
                  style="width: 100%"
                  @change="onStrategyChanged"
                >
                  <el-option
                    v-for="strategy in strategies"
                    :key="strategy.type"
                    :label="strategy.name"
                    :value="strategy.type"
                  >
                    <div class="strategy-option">
                      <span class="strategy-name">{{ strategy.name }}</span>
                      <span class="strategy-desc">{{
                        strategy.description
                      }}</span>
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
                  style="width: 100%"
                >
                  <el-option
                    v-for="country in countries"
                    :key="country.value"
                    :label="country.name"
                    :value="country.value"
                  />
                </el-select>
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
                  :disabled-date="disabledStartDate"
                />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="End Date" required>
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="Select end date"
                  style="width: 100%"
                  :disabled-date="disabledEndDate"
                />
              </el-form-item>
            </el-col>

            <!-- Optimization Method -->
            <el-col :span="24">
              <el-form-item label="Optimization Method" required>
                <el-radio-group v-model="formData.optimizationMethod">
                  <el-radio value="SmartGrid">
                    <strong>Smart Grid Search</strong> - Seeds from historical
                    winners, then coarse grid (Recommended)
                  </el-radio>
                  <el-radio value="GridSearch">
                    <strong>Grid Search</strong> - Exhaustive search of all
                    parameter combinations
                  </el-radio>
                  <el-radio value="WalkForward">
                    <strong>Walk-Forward Analysis</strong> - Rolling time
                    windows to prevent overfitting
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- Parameter Ranges -->
          <div class="section-divider">
            <h3 class="section-title">Parameter Ranges</h3>
            <p class="section-hint">
              Define the ranges for each parameter to test. Enter
              comma-separated values.
            </p>
          </div>

          <!-- Indicator-Based Parameters -->
          <template v-if="isIndicatorMode">
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="Primary Indicator" required>
                  <el-select
                    v-model="formData.primaryIndicator"
                    style="width: 100%"
                    @change="onIndicatorChanged"
                  >
                    <el-option
                      v-for="ind in indicatorOptions"
                      :key="ind.value"
                      :label="ind.label"
                      :value="ind.value"
                    >
                      <div class="strategy-option">
                        <span class="strategy-name">{{ ind.label }}</span>
                        <span class="strategy-desc">{{ ind.description }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Indicator Period (days)">
                  <el-input
                    v-model="paramRanges.indicatorPeriod"
                    :placeholder="
                      formData.primaryIndicator === 'RSI'
                        ? 'e.g., 10,14,21'
                        : formData.primaryIndicator === 'MACD'
                        ? 'e.g., 20,26,30'
                        : 'e.g., 15,20,25'
                    "
                  />
                  <span
                    class="form-hint"
                    style="display: block; margin-top: 0.25rem"
                  >
                    Number of periods for indicator calculation
                  </span>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item :label="indicatorThresholdLabel">
                  <el-input
                    v-model="paramRanges.indicatorThreshold"
                    :placeholder="selectedIndicatorOption.defaultThresholds"
                  />
                  <span
                    class="form-hint"
                    style="display: block; margin-top: 0.25rem"
                  >
                    {{ selectedIndicatorOption.thresholdHint }}
                  </span>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Stop Loss (%)">
                  <el-input
                    v-model="paramRanges.lossCutRate"
                    placeholder="e.g., -0.005,-0.01,-0.015,-0.02"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Portfolio Size">
                  <el-input
                    v-model="paramRanges.portfolioNumber"
                    placeholder="e.g., 1"
                    disabled
                  />
                  <span
                    class="form-hint"
                    style="display: block; margin-top: 0.5rem"
                  >
                    Currently fixed at 1
                  </span>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Trade Fee (%)">
                  <el-input
                    v-model="paramRanges.tradeFee"
                    placeholder="e.g., 0.001"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Slippage (%)">
                  <el-input
                    v-model="paramRanges.slippage"
                    placeholder="e.g., 0.001"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <!-- Pair-Trading Parameters -->
          <template v-else>
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="Analysis Period (days)">
                  <el-input
                    v-model="paramRanges.analysisPeriod"
                    placeholder="e.g., 30,60,90,120,180"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Correlation Threshold">
                  <el-input
                    v-model="paramRanges.coefficientAllowed"
                    placeholder="e.g., 0.75,0.80,0.85,0.90"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Entry Trigger (%)">
                  <el-input
                    v-model="paramRanges.investTriggerRate"
                    placeholder="e.g., 0.01,0.02,0.03,0.05"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Stop Loss (%)">
                  <el-input
                    v-model="paramRanges.lossCutRate"
                    placeholder="e.g., -0.005,-0.01,-0.015,-0.02"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Portfolio Size">
                  <el-input
                    v-model="paramRanges.portfolioNumber"
                    placeholder="e.g., 1"
                    disabled
                  />
                  <span
                    class="form-hint"
                    style="display: block; margin-top: 0.5rem"
                  >
                    Currently fixed at 1
                  </span>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Trade Fee (%)">
                  <el-input
                    v-model="paramRanges.tradeFee"
                    placeholder="e.g., 0.001"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Slippage (%)">
                  <el-input
                    v-model="paramRanges.slippage"
                    placeholder="e.g., 0.001"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Use Trend Filter">
                  <el-input
                    v-model="paramRanges.useTrendFilter"
                    placeholder="e.g., false,true"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="Trend Filter Threshold">
                  <el-input
                    v-model="paramRanges.trendFilterThreshold"
                    placeholder="e.g., 0,0.5"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <!-- Walk-Forward Config (shown only when WalkForward is selected) -->
          <div
            v-if="formData.optimizationMethod === 'WalkForward'"
            class="section-divider"
          >
            <h3 class="section-title">Walk-Forward Configuration</h3>
            <el-alert
              v-if="dateRangeTooShort"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 1rem"
            >
              Date range is too short. Need at least
              {{
                walkForwardConfig.trainingWindowMonths +
                walkForwardConfig.testingWindowMonths
              }}
              months, but selected range is only
              {{ monthsDiff(formData.startDate, formData.endDate) }} months.
            </el-alert>
          </div>

          <el-row
            v-if="formData.optimizationMethod === 'WalkForward'"
            :gutter="24"
          >
            <el-col :span="8">
              <el-form-item label="Training Window (months)">
                <el-input-number
                  v-model="walkForwardConfig.trainingWindowMonths"
                  :min="3"
                  :max="24"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Testing Window (months)">
                <el-input-number
                  v-model="walkForwardConfig.testingWindowMonths"
                  :min="1"
                  :max="12"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Step Size (months)">
                <el-input-number
                  v-model="walkForwardConfig.stepSizeMonths"
                  :min="1"
                  :max="6"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- Advanced Options -->
          <div class="section-divider">
            <h3 class="section-title">Advanced Options</h3>
          </div>

          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="Max Combinations">
                <el-input-number
                  v-model="configOptions.maxCombinations"
                  :min="10"
                  :max="5000"
                  :step="10"
                  style="width: 100%"
                />
                <span class="form-hint"
                  >Limit total simulations to prevent excessive runtime</span
                >
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Seed from History">
                <el-switch v-model="configOptions.seedFromHistory" />
                <span
                  class="form-hint"
                  style="display: block; margin-top: 0.5rem"
                >
                  Start with top 20% historical performers
                </span>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Top % to Refine">
                <el-input-number
                  v-model="configOptions.topPercentToRefine"
                  :min="5"
                  :max="50"
                  :step="5"
                  style="width: 100%"
                />
                <span class="form-hint"
                  >Percentage of best results to refine further</span
                >
              </el-form-item>
            </el-col>
          </el-row>

          <!-- Estimated Simulations -->
          <el-alert
            :title="`Estimated Simulations: ${estimatedSimulations}`"
            type="info"
            :closable="false"
            style="margin-top: 1rem"
          >
            <template #default>
              Based on your configuration, approximately
              {{ estimatedSimulations }} simulations will be run.
              <span v-if="estimatedTime">
                Estimated time: {{ estimatedTime }}
              </span>
            </template>
          </el-alert>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <el-button @click="resetForm">Reset</el-button>
            <el-button
              type="primary"
              :loading="creating"
              @click="createOptimization"
            >
              <el-icon v-if="!creating"><VideoPlay /></el-icon>
              {{ creating ? "Creating..." : "Start Optimization" }}
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import PageHeader from "@/components/PageHeader.vue";
import { VideoPlay } from "@element-plus/icons-vue";
import ApiService from "@/core/services/apiService";

interface Strategy {
  type: number;
  name: string;
  description: string;
}

interface Country {
  value: number;
  name: string;
}

export default defineComponent({
  components: {
    PageHeader,
    VideoPlay,
  },

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      strategies: [] as Strategy[],
      countries: [] as Country[],
      simulationApiUrl: "http://localhost:52335",
      indicatorOptions: [
        {
          label: "RSI (Relative Strength Index)",
          value: "RSI",
          description: "Momentum oscillator (oversold < 30, overbought > 70)",
          defaultPeriod: 14,
          defaultThresholds: "20,25,30,35,40",
          thresholdHint:
            "RSI oversold levels (buy when RSI drops below these values)",
        },
        {
          label: "MACD",
          value: "MACD",
          description: "Trend-following momentum indicator",
          defaultPeriod: 26,
          defaultThresholds: "-0.5,-0.2,0,0.2,0.5",
          thresholdHint: "MACD signal thresholds for entry/exit",
        },
        {
          label: "Bollinger Bands",
          value: "BollingerBands",
          description: "Volatility bands (price extremes)",
          defaultPeriod: 20,
          defaultThresholds: "1.5,2.0,2.5",
          thresholdHint: "Standard deviations from mean (typically 1.5-2.5)",
        },
      ],
      formData: {
        strategyType: 0,
        country: 0,
        startDate: new Date(
          new Date().setFullYear(new Date().getFullYear() - 5)
        ),
        endDate: new Date(),
        optimizationMethod: "SmartGrid",
        primaryIndicator: "RSI" as string,
      },
      paramRanges: {
        analysisPeriod: "30,60,90,120,180",
        coefficientAllowed: "0.75,0.80,0.85,0.90",
        investTriggerRate: "0.01,0.02,0.03,0.05",
        lossCutRate: "-0.005,-0.01,-0.015,-0.02",
        portfolioNumber: "1",
        tradeFee: "0.001",
        slippage: "0.001",
        useTrendFilter: "false,true",
        trendFilterThreshold: "0,0.5",
        indicatorPeriod: "10,14,21",
        indicatorThreshold: "20,25,30,35,40",
      },
      walkForwardConfig: {
        trainingWindowMonths: 6,
        testingWindowMonths: 3,
        stepSizeMonths: 3,
      },
      configOptions: {
        maxCombinations: 500,
        seedFromHistory: true,
        topPercentToRefine: 20,
        stockCodes: [],
      },
      creating: false,
    };
  },

  computed: {
    isIndicatorMode(): boolean {
      const strategy = this.strategies.find(
        (s) => s.type === this.formData.strategyType
      );
      return strategy?.name === "IndicatorBased";
    },

    selectedIndicatorOption(): any {
      return (
        this.indicatorOptions.find(
          (ind) => ind.value === this.formData.primaryIndicator
        ) || this.indicatorOptions[0]
      );
    },

    indicatorThresholdLabel(): string {
      if (!this.isIndicatorMode) return "Entry Trigger (%)";
      const indicator = this.formData.primaryIndicator;
      if (indicator === "RSI") return "RSI Threshold (oversold level)";
      if (indicator === "MACD") return "MACD Signal Threshold";
      if (indicator === "BollingerBands")
        return "Bollinger Bands Std Deviations";
      return "Indicator Threshold";
    },

    dateRangeTooShort(): boolean {
      if (this.formData.optimizationMethod !== "WalkForward") return false;
      const totalMonths = this.monthsDiff(
        this.formData.startDate,
        this.formData.endDate
      );
      const requiredMonths =
        this.walkForwardConfig.trainingWindowMonths +
        this.walkForwardConfig.testingWindowMonths;
      return totalMonths < requiredMonths;
    },

    estimatedSimulations(): number {
      if (this.isIndicatorMode) {
        const counts = {
          indicatorPeriod: this.paramRanges.indicatorPeriod
            .split(",")
            .filter((v) => v.trim()).length,
          indicatorThreshold: this.paramRanges.indicatorThreshold
            .split(",")
            .filter((v) => v.trim()).length,
          lossCutRate: this.paramRanges.lossCutRate
            .split(",")
            .filter((v) => v.trim()).length,
          portfolioNumber: this.paramRanges.portfolioNumber
            .split(",")
            .filter((v) => v.trim()).length,
        };

        let total =
          counts.indicatorPeriod *
          counts.indicatorThreshold *
          counts.lossCutRate *
          counts.portfolioNumber;

        if (this.formData.optimizationMethod === "WalkForward") {
          const totalMonths = this.monthsDiff(
            this.formData.startDate,
            this.formData.endDate
          );
          const windows =
            Math.floor(
              (totalMonths -
                this.walkForwardConfig.trainingWindowMonths -
                this.walkForwardConfig.testingWindowMonths) /
                this.walkForwardConfig.stepSizeMonths
            ) + 1;
          total *= Math.max(windows, 1);
        }

        return Math.min(total, this.configOptions.maxCombinations);
      }

      const counts = {
        analysisPeriod: this.paramRanges.analysisPeriod
          .split(",")
          .filter((v) => v.trim()).length,
        coefficientAllowed: this.paramRanges.coefficientAllowed
          .split(",")
          .filter((v) => v.trim()).length,
        investTriggerRate: this.paramRanges.investTriggerRate
          .split(",")
          .filter((v) => v.trim()).length,
        lossCutRate: this.paramRanges.lossCutRate
          .split(",")
          .filter((v) => v.trim()).length,
        portfolioNumber: this.paramRanges.portfolioNumber
          .split(",")
          .filter((v) => v.trim()).length,
      };

      let total =
        counts.analysisPeriod *
        counts.coefficientAllowed *
        counts.investTriggerRate *
        counts.lossCutRate *
        counts.portfolioNumber;

      if (this.formData.optimizationMethod === "WalkForward") {
        const totalMonths = this.monthsDiff(
          this.formData.startDate,
          this.formData.endDate
        );
        const windows =
          Math.floor(
            (totalMonths -
              this.walkForwardConfig.trainingWindowMonths -
              this.walkForwardConfig.testingWindowMonths) /
              this.walkForwardConfig.stepSizeMonths
          ) + 1;
        total *= Math.max(windows, 1);
      }

      return Math.min(total, this.configOptions.maxCombinations);
    },

    estimatedTime(): string {
      const simulations = this.estimatedSimulations;
      const secondsPerSim = 30; // Assume 30 seconds per simulation
      const totalSeconds = simulations * secondsPerSim;

      if (totalSeconds < 60) return `${totalSeconds} seconds`;
      if (totalSeconds < 3600)
        return `${Math.round(totalSeconds / 60)} minutes`;
      return `${Math.round(totalSeconds / 3600)} hours`;
    },
  },

  methods: {
    monthsDiff(start: Date, end: Date): number {
      return (
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
      );
    },

    parseRangeArray(
      rangeStr: string,
      parseFunc: (value: string) => number
    ): number[] {
      return rangeStr
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v)
        .map((v) => parseFunc(v));
    },

    onStrategyChanged() {
      const strategy = this.strategies.find(
        (s) => s.type === this.formData.strategyType
      );
      if (strategy?.name === "IndicatorBased") {
        // Switch to indicator-based defaults
        this.formData.primaryIndicator = "RSI";
        this.paramRanges.indicatorPeriod = "10,14,21";
        this.paramRanges.indicatorThreshold = "20,25,30,35,40";
        this.paramRanges.lossCutRate = "-0.005,-0.01,-0.015,-0.02";
      } else {
        // Switch to pair-trading defaults
        this.paramRanges.analysisPeriod = "30,60,90,120,180";
        this.paramRanges.coefficientAllowed = "0.75,0.80,0.85,0.90";
        this.paramRanges.investTriggerRate = "0.01,0.02,0.03,0.05";
        this.paramRanges.lossCutRate = "-0.005,-0.01,-0.015,-0.02";
      }
    },

    onIndicatorChanged() {
      const selected = this.indicatorOptions.find(
        (ind) => ind.value === this.formData.primaryIndicator
      );
      if (selected) {
        this.paramRanges.indicatorThreshold = selected.defaultThresholds;
        // Update indicator period defaults based on indicator type
        if (selected.value === "RSI") {
          this.paramRanges.indicatorPeriod = "10,14,21";
        } else if (selected.value === "MACD") {
          this.paramRanges.indicatorPeriod = "20,26,30";
        } else if (selected.value === "BollingerBands") {
          this.paramRanges.indicatorPeriod = "15,20,25";
        }
      }
    },

    async createOptimization() {
      // Validation
      if (!this.formData.startDate || !this.formData.endDate) {
        this.$message.warning("Please select both start and end dates");
        return;
      }

      // WalkForward-specific validation
      if (this.formData.optimizationMethod === "WalkForward") {
        const totalMonths = this.monthsDiff(
          this.formData.startDate,
          this.formData.endDate
        );
        const requiredMonths =
          this.walkForwardConfig.trainingWindowMonths +
          this.walkForwardConfig.testingWindowMonths;

        if (totalMonths < requiredMonths) {
          this.$message.error(
            `Date range is too short for walk-forward analysis. ` +
              `Need at least ${requiredMonths} months ` +
              `(${this.walkForwardConfig.trainingWindowMonths} training + ` +
              `${this.walkForwardConfig.testingWindowMonths} testing), ` +
              `but selected range is only ${totalMonths} months.`
          );
          return;
        }
      }

      this.creating = true;

      try {
        // Get selected country name
        const selectedCountry = this.countries.find(
          (c) => c.value === this.formData.country
        );
        const countryName = selectedCountry ? selectedCountry.name : "ALL";

        const parameterRanges = this.isIndicatorMode
          ? {
              primaryIndicator: this.formData.primaryIndicator,
              indicatorPeriod: this.parseRangeArray(
                this.paramRanges.indicatorPeriod,
                parseInt
              ),
              analysisPeriod: this.parseRangeArray(
                this.paramRanges.indicatorPeriod,
                parseInt
              ),
              coefficientAllowed: [0],
              investTriggerRate: this.parseRangeArray(
                this.paramRanges.indicatorThreshold,
                parseFloat
              ),
              lossCutRate: this.parseRangeArray(
                this.paramRanges.lossCutRate,
                parseFloat
              ),
              portfolioNumber: this.parseRangeArray(
                this.paramRanges.portfolioNumber,
                parseInt
              ),
              tradeFee: this.parseRangeArray(
                this.paramRanges.tradeFee,
                parseFloat
              ),
              slippage: this.parseRangeArray(
                this.paramRanges.slippage,
                parseFloat
              ),
              useTrendFilter: [false],
              trendFilterThreshold: [0],
            }
          : {
              analysisPeriod: this.parseRangeArray(
                this.paramRanges.analysisPeriod,
                parseInt
              ),
              coefficientAllowed: this.parseRangeArray(
                this.paramRanges.coefficientAllowed,
                parseFloat
              ),
              investTriggerRate: this.parseRangeArray(
                this.paramRanges.investTriggerRate,
                parseFloat
              ),
              lossCutRate: this.parseRangeArray(
                this.paramRanges.lossCutRate,
                parseFloat
              ),
              portfolioNumber: this.parseRangeArray(
                this.paramRanges.portfolioNumber,
                parseInt
              ),
              tradeFee: this.parseRangeArray(
                this.paramRanges.tradeFee,
                parseFloat
              ),
              slippage: this.parseRangeArray(
                this.paramRanges.slippage,
                parseFloat
              ),
              useTrendFilter: this.parseRangeArray(
                this.paramRanges.useTrendFilter,
                (v: string) => v === "true"
              ),
              trendFilterThreshold: this.parseRangeArray(
                this.paramRanges.trendFilterThreshold,
                parseFloat
              ),
            };

        const payload = {
          strategyType: this.formData.strategyType,
          country: countryName,
          startDate: this.formData.startDate.toISOString(),
          endDate: this.formData.endDate.toISOString(),
          optimizationMethod: this.formData.optimizationMethod,
          parameterRanges,
          walkForwardConfig:
            this.formData.optimizationMethod === "WalkForward"
              ? this.walkForwardConfig
              : null,
          configurationOptions: this.configOptions,
        };

        // Call ABP backend API to create optimization job
        console.log("Creating optimization job:", payload);

        const response = await ApiService.vueInstance.axios.post(
          "/api/app/optimization-job",
          payload
        );

        const jobId = response.data.id;
        this.$message.success(
          `Optimization job created successfully! Job ID: ${jobId}`
        );
        this.router.push({ name: "optimizationMonitor" });
      } catch (error: any) {
        console.error("Failed to create optimization", error);
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.title ||
          error.message ||
          "Unknown error";
        this.$message.error(`Failed to create optimization: ${errorMsg}`);
      } finally {
        this.creating = false;
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

    resetForm() {
      this.formData = {
        strategyType: this.strategies[0]?.type || 0,
        country: 0,
        startDate: new Date(
          new Date().setFullYear(new Date().getFullYear() - 5)
        ),
        endDate: new Date(),
        optimizationMethod: "SmartGrid",
        primaryIndicator: "RSI",
      };
      this.paramRanges = {
        analysisPeriod: "30,60,90,120,180",
        coefficientAllowed: "0.75,0.80,0.85,0.90",
        investTriggerRate: "0.01,0.02,0.03,0.05",
        lossCutRate: "-0.005,-0.01,-0.015,-0.02",
        portfolioNumber: "1",
        tradeFee: "0.001",
        slippage: "0.001",
        useTrendFilter: "false,true",
        trendFilterThreshold: "0,0.5",
        indicatorPeriod: "10,14,21",
        indicatorThreshold: "20,25,30,35,40",
      };
      this.walkForwardConfig = {
        trainingWindowMonths: 6,
        testingWindowMonths: 3,
        stepSizeMonths: 3,
      };
      this.configOptions = {
        maxCombinations: 500,
        seedFromHistory: true,
        topPercentToRefine: 20,
        stockCodes: [],
      };
    },

    async loadStrategiesAndCountries() {
      try {
        const response = await axios.get(
          `${this.simulationApiUrl}/api/Simulation/strategies`
        );
        this.strategies = response.data.strategies || [];
        this.countries = response.data.countries || [];

        // Set first strategy as default if available
        if (this.strategies.length > 0) {
          this.formData.strategyType = this.strategies[0].type;
        }
      } catch (error) {
        console.error("Failed to load strategies and countries", error);
        this.$message.error("Failed to load configuration options from API");
      }
    },
  },

  mounted() {
    this.loadStrategiesAndCountries();
  },
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
  max-width: 1200px;
  margin: 0 auto;
}

.config-card {
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

.section-divider {
  margin: 2rem 0 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-subtle);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.section-hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
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

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border-subtle);
}

@media (max-width: 768px) {
  .page-container {
    padding: 1.5rem 1rem;
  }
}
</style>
