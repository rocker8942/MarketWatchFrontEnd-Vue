<template>
    <div class="stock-chart-page">
        <div class="page-header">
            <h1>Stock Chart</h1>
            <p class="subtitle">Analyze stock price movements with interactive charts</p>
        </div>

        <div class="content-wrapper">
            <!-- Stock Selection and Period Controls -->
            <div class="control-section">
                <div class="stock-selector">
                    <label class="control-label">Select Stock</label>
                    <div class="input-row">
                        <el-autocomplete
                            v-model="selectedStockCode"
                            :fetch-suggestions="querySearch"
                            placeholder="Select or enter stock code"
                            @select="handleStockSelect"
                            size="large"
                            class="stock-input"
                            clearable
                            :trigger-on-focus="true"
                            value-key="code">
                            <template #default="{ item }">
                                <div class="stock-option">
                                    <span class="stock-code">{{ item.code }}</span>
                                    <span class="stock-name">{{ item.name }}</span>
                                </div>
                            </template>
                        </el-autocomplete>
                        <el-button
                            type="primary"
                            @click="handleStockChange"
                            size="large"
                            class="load-btn"
                            :disabled="!selectedStockCode">
                            Load Chart
                        </el-button>
                    </div>
                </div>

                <div class="period-selector">
                    <label class="control-label">Time Period</label>
                    <el-radio-group v-model="selectedPeriod" @change="handlePeriodChange" size="large">
                        <el-radio-button label="1M">1 Month</el-radio-button>
                        <el-radio-button label="3M">3 Months</el-radio-button>
                        <el-radio-button label="6M">6 Months</el-radio-button>
                        <el-radio-button label="1Y">1 Year</el-radio-button>
                        <el-radio-button label="5Y">5 Years</el-radio-button>
                    </el-radio-group>
                </div>
            </div>

            <!-- Stock Info Summary -->
            <div v-if="selectedStockCode && latestPrice" class="stock-info-card">
                <div class="info-item">
                    <span class="info-label">Current Price</span>
                    <span class="info-value price">{{ formatCurrency(latestPrice.currentPrice) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Volume</span>
                    <span class="info-value">{{ formatNumber(latestPrice.volume) }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date</span>
                    <span class="info-value">{{ formatDate(latestPrice.date) }}</span>
                </div>
            </div>

            <!-- Chart Container -->
            <div class="chart-container">
                <div v-if="loading" class="loading-state">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    <span>Loading chart data...</span>
                </div>
                <div v-else-if="!selectedStockCode" class="empty-state">
                    <el-icon><TrendCharts /></el-icon>
                    <p>Select a stock to view the chart</p>
                </div>
                <div v-else-if="chartData.length === 0" class="empty-state">
                    <el-icon><Warning /></el-icon>
                    <p>No data available for this stock</p>
                </div>
                <GChart
                    v-else
                    type="LineChart"
                    :data="chartData"
                    :options="chartOptions"
                    class="google-chart"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { GChart } from "vue-google-charts";
import { Loading, TrendCharts, Warning } from '@element-plus/icons-vue';
import ApiService from "@/core/services/apiService";
import { StockPriceClient, StockPriceDto } from "@/core/services/marketWatchClient";
import moment from 'moment';

const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);

export default defineComponent({
    components: {
        GChart,
        Loading,
        TrendCharts,
        Warning
    },

    data() {
        return {
            selectedStockCode: '',
            selectedPeriod: '6M',
            loading: false,
            recentStocks: [] as Array<{ code: string, name: string }>,
            stockPrices: [] as StockPriceDto[],
            latestPrice: null as StockPriceDto | null,
        };
    },

    computed: {
        chartData(): any[] {
            if (this.stockPrices.length === 0) return [];

            const data = [['Date', 'Price', 'Volume']];

            // Sort by date ascending
            const sortedPrices = [...this.stockPrices].sort((a, b) =>
                new Date(a.date!).getTime() - new Date(b.date!).getTime()
            );

            sortedPrices.forEach(price => {
                data.push([
                    moment(price.date).format('MMM DD, YYYY'),
                    price.currentPrice,
                    price.volume
                ]);
            });

            return data;
        },

        chartOptions(): any {
            return {
                title: `${this.selectedStockCode} Stock Price`,
                titleTextStyle: {
                    fontSize: 18,
                    bold: true,
                    color: '#333'
                },
                hAxis: {
                    title: 'Date',
                    titleTextStyle: { italic: false, bold: true },
                    slantedText: true,
                    slantedTextAngle: 45
                },
                vAxes: {
                    0: {
                        title: 'Price ($)',
                        titleTextStyle: { italic: false, bold: true },
                        format: 'currency'
                    },
                    1: {
                        title: 'Volume',
                        titleTextStyle: { italic: false, bold: true }
                    }
                },
                series: {
                    0: { targetAxisIndex: 0, color: '#1976d2', lineWidth: 2 },
                    1: { targetAxisIndex: 1, color: '#90caf9', lineWidth: 1, lineDashStyle: [4, 4] }
                },
                legend: { position: 'top' },
                chartArea: { width: '80%', height: '70%' },
                height: 500,
                animation: {
                    startup: true,
                    duration: 1000,
                    easing: 'out'
                },
                backgroundColor: '#fafafa',
                pointSize: 3
            };
        }
    },

    methods: {
        async loadRecentStocks() {
            try {
                console.log('Loading recent stocks...');
                // Get a sample of recent stocks for the dropdown
                const response = await stockClient.stockPriceGetStockPriceWithDetails(
                    'date desc',
                    0,
                    50,
                    undefined
                );

                console.log('Stock response:', response);

                // Extract unique stock codes and names
                const uniqueStocks = new Map<string, string>();
                response.items?.forEach(item => {
                    if (item.stockCode && item.stockName && !uniqueStocks.has(item.stockCode)) {
                        uniqueStocks.set(item.stockCode, item.stockName);
                    }
                });

                this.recentStocks = Array.from(uniqueStocks.entries()).map(([code, name]) => ({
                    code,
                    name
                }));

                console.log('Recent stocks loaded:', this.recentStocks.length, this.recentStocks);
            } catch (error) {
                console.error('Error loading stocks:', error);
            }
        },

        async loadStockData() {
            if (!this.selectedStockCode) {
                console.log('No stock code selected');
                return;
            }

            console.log('Loading data for stock:', this.selectedStockCode);
            this.loading = true;
            try {
                const days = this.getPeriodDays();
                console.log('Period days:', days);

                // Fetch all data for the stock, then filter by date on frontend
                const response = await stockClient.stockPriceGetStockPriceWithDetails(
                    'date desc',
                    0,
                    1000, // Get more records to cover the period
                    this.selectedStockCode
                );

                console.log('Stock data response:', response);

                if (response.items && response.items.length > 0) {
                    const cutoffDate = moment().subtract(days, 'days');
                    this.stockPrices = response.items.filter(item =>
                        moment(item.date).isAfter(cutoffDate)
                    ) as StockPriceDto[];

                    this.latestPrice = response.items[0] as StockPriceDto;
                    console.log('Loaded prices:', this.stockPrices.length, 'Latest:', this.latestPrice);
                } else {
                    console.log('No items in response');
                    this.stockPrices = [];
                    this.latestPrice = null;
                }
            } catch (error) {
                console.error('Error loading stock data:', error);
                this.stockPrices = [];
                this.latestPrice = null;
            } finally {
                this.loading = false;
            }
        },

        getPeriodDays(): number {
            const periodMap: Record<string, number> = {
                '1M': 30,
                '3M': 90,
                '6M': 180,
                '1Y': 365,
                '5Y': 1825
            };
            return periodMap[this.selectedPeriod] || 180;
        },

        querySearch(queryString: string, cb: any) {
            const results = queryString
                ? this.recentStocks.filter(stock =>
                    stock.code.toLowerCase().includes(queryString.toLowerCase()) ||
                    stock.name.toLowerCase().includes(queryString.toLowerCase())
                )
                : this.recentStocks;
            cb(results);
        },

        handleStockSelect(item: any) {
            console.log('Stock selected:', item);
            this.selectedStockCode = item.code;
            this.loadStockData();
        },

        handleStockChange() {
            console.log('Stock changed to:', this.selectedStockCode);
            this.loadStockData();
        },

        handlePeriodChange() {
            console.log('Period changed to:', this.selectedPeriod);
            this.loadStockData();
        },

        formatCurrency(value: number | undefined): string {
            if (!value) return '$0.00';
            return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        },

        formatNumber(value: number | undefined): string {
            if (!value) return '0';
            return value.toLocaleString('en-US');
        },

        formatDate(date: Date | undefined): string {
            if (!date) return '';
            return moment(date).format('MMM DD, YYYY');
        }
    },

    mounted() {
        this.loadRecentStocks();
    }
});
</script>

<style scoped>
.stock-chart-page {
    padding: 2rem 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
}

.subtitle {
    font-size: 1rem;
    color: var(--color-text-secondary);
    margin: 0;
}

.content-wrapper {
    background: var(--color-background-card);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-sm);
}

/* Control Section */
.control-section {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.stock-selector,
.period-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stock-selector {
    flex: 1;
    min-width: 300px;
}

.input-row {
    display: flex;
    gap: 0.75rem;
}

.control-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.stock-input {
    flex: 1;
    max-width: 400px;
}

.load-btn {
    min-width: 120px;
}

.stock-option {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.stock-code {
    font-weight: 600;
    color: var(--color-primary);
    min-width: 80px;
}

.stock-name {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
}

/* Stock Info Card */
.stock-info-card {
    display: flex;
    gap: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    border-radius: 8px;
    margin-bottom: 2rem;
    color: white;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.9;
}

.info-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.info-value.price {
    font-size: 2rem;
}

/* Chart Container */
.chart-container {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.google-chart {
    width: 100%;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--color-text-secondary);
}

.loading-state .el-icon,
.empty-state .el-icon {
    font-size: 3rem;
}

.loading-state span,
.empty-state p {
    font-size: 1rem;
    margin: 0;
}

.is-loading {
    animation: rotating 2s linear infinite;
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .stock-chart-page {
        padding: 1.5rem 1rem;
    }

    .page-header h1 {
        font-size: 1.75rem;
    }

    .content-wrapper {
        padding: 1.5rem;
    }

    .control-section {
        flex-direction: column;
        gap: 1.5rem;
    }

    .stock-selector {
        min-width: 100%;
    }

    .input-row {
        flex-direction: column;
    }

    .stock-input {
        max-width: 100%;
    }

    .load-btn {
        width: 100%;
    }

    .stock-info-card {
        flex-direction: column;
        gap: 1rem;
    }

    .chart-container {
        padding: 1rem;
    }

    :deep(.google-chart svg) {
        width: 100% !important;
        height: auto !important;
    }
}

@media (min-width: 1024px) {
    .stock-chart-page {
        padding: 3rem 2rem;
    }
}

/* Element Plus customization */
:deep(.el-radio-button__inner) {
    padding: 0.5rem 1rem;
}

:deep(.el-select) {
    width: 100%;
}
</style>
