<template>
    <div class="stock-price-page">
        <div class="page-header">
            <h1>Stock Prices</h1>
            <p class="subtitle">Browse and search stock prices with real-time data</p>
        </div>

        <div class="content-wrapper">
            <!-- Search Bar -->
            <div class="search-section">
                <el-autocomplete
                    v-model="searchQuery"
                    :fetch-suggestions="querySearch"
                    placeholder="Search by stock code or name"
                    clearable
                    @select="handleStockSelect"
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                    class="search-input"
                    size="large"
                    :trigger-on-focus="true"
                    value-key="code">
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                    <template #default="{ item }">
                        <div class="stock-option">
                            <span class="stock-code">{{ item.code }}</span>
                            <span class="stock-name">{{ item.name }}</span>
                        </div>
                    </template>
                </el-autocomplete>
                <el-button type="primary" @click="handleSearch" size="large" class="search-btn">Search</el-button>
            </div>

            <!-- Data Table -->
            <div class="table-container">
                <el-table
                    :data="formattedProducts"
                    style="width: 100%"
                    @sort-change="handleSortChange"
                    class="professional-table"
                    stripe
                    :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }">
                    <el-table-column prop="code" label="Code" width="120" fixed></el-table-column>
                    <el-table-column prop="name" label="Name" min-width="300" sortable="custom"></el-table-column>
                    <el-table-column prop="currentPrice" label="Price" width="140" align="right"></el-table-column>
                    <el-table-column prop="date" label="Date" width="140" sortable="custom"></el-table-column>
                    <el-table-column prop="volume" label="Volume" width="140" align="right"></el-table-column>
                </el-table>
            </div>

            <!-- Pagination -->
            <div class="pagination-wrapper">
                <el-pagination
                    background
                    layout="total, prev, pager, next, jumper"
                    :total="totalCount"
                    :page-size="pageSize"
                    v-model:current-page="currentPage"
                    @current-change="handlePageChange" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Search } from '@element-plus/icons-vue';
// import DataTable from 'datatables.net-vue3';
// import DataTablesLib from 'datatables.net';
import ApiService from "@/core/services/apiService";
import { StockPriceClient, PagedResultDtoOfStockPriceDto, StockInfoClient } from "@/core/services/marketWatchClient";
import moment from 'moment';

const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
const stockInfoClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);

//DataTable.use(DataTablesLib);

export default defineComponent({
    components: {
        Search
    },

    data() {
        return {
            pagedResultDtoOfstockPriceDto: new PagedResultDtoOfStockPriceDto(),
            products: null,
            pageSize: 10, // Items per page
            currentPage: 1,
            totalCount: 0,
            sortField: '',
            sortOrder: '',
            searchQuery: '',
            recentStocks: [] as Array<{ code: string, name: string }>,
        };
    },

    methods: {
        async getList() {
            try {

                // get stockPrice list
                const response = await stockClient.stockPriceGetStockPriceWithDetails(
                    `${this.sortField} ${this.sortOrder}`,
                    (this.currentPage - 1) * this.pageSize,
                    this.pageSize,
                    this.searchQuery || undefined,
                    undefined,
                    undefined
                );
                this.pagedResultDtoOfstockPriceDto = response as PagedResultDtoOfStockPriceDto;
                this.products = this.pagedResultDtoOfstockPriceDto.items;
                this.totalCount = this.pagedResultDtoOfstockPriceDto.totalCount;

            } catch (error) {
                console.error(error);
            }
        },
        onPageChange(event) {
            this.currentPage = event.page;
            this.rowsPerPage = event.rows;
            this.getList();
        },
        formatCurrency(value) {
            return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        },
        formatNumber(value) {
            return value ? value.toLocaleString('en-US') : '0';
        },
        handlePageChange(page) {
            this.currentPage = page;
            this.getList();
        },

        handleSortChange({ prop, order }) {
            this.sortField = prop;
            this.sortOrder = order === 'ascending' ? 'asc' : 'desc';
            this.getList();
        },

        handleSearch() {
            this.currentPage = 1; // Reset to first page when searching
            this.getList();
        },

        async loadRecentStocks() {
            try {
                console.log('Loading all stocks...');
                // Get all available stock codes from StockInfo
                const response = await stockInfoClient.stockInfoGetList(
                    'name asc',
                    0,
                    1000 // Get all stocks
                );

                console.log('Stock response:', response);

                // Map to autocomplete format with id as code and name
                this.recentStocks = response.items?.map(item => ({
                    code: item.id || '',
                    name: item.name || ''
                })) || [];

                console.log('All stocks loaded:', this.recentStocks.length, this.recentStocks);
            } catch (error) {
                console.error('Error loading stocks:', error);
            }
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
            this.searchQuery = item.code;
            this.handleSearch();
        },

    },

    computed: {
        formattedProducts() {
            return this.products ? this.products.map(product => ({
                ...product,
                date: moment(product.date).format('YYYY-MM-DD'),
                currentPrice: this.formatCurrency(product.currentPrice),
                volume: this.formatNumber(product.volume),
            })) : [];
        }
    },

    mounted() {
        this.loadRecentStocks();
        this.getList();
    },
});
</script>

<style scoped>
.stock-price-page {
    padding: var(--space-4xl) var(--space-xl);
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
}

.page-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
}

.subtitle {
    font-size: 1.0625rem;
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
}

.content-wrapper {
    background: var(--color-background-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    padding: var(--space-3xl);
    box-shadow: var(--shadow-subtle);
    transition: box-shadow 0.2s ease;
}

/* Search Section */
.search-section {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-2xl);
}

.search-input {
    max-width: 500px;
    flex: 1;
}

.search-btn {
    min-width: 120px;
}

/* Stock Autocomplete Option Styling */
.stock-option {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

.stock-code {
    font-weight: 500;
    color: #202124;
    min-width: 60px;
}

.stock-name {
    color: #5f6368;
    font-size: 0.875rem;
}

/* Table Container */
.table-container {
    background: var(--color-background);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
}

/* Professional Table Styling */
.professional-table {
    border-radius: 8px;
    overflow: hidden;
}

.professional-table :deep(.el-table__header) {
    font-weight: 600;
}

.professional-table :deep(.el-table__row) {
    transition: all 0.2s ease;
}

.professional-table :deep(.el-table__row:hover) {
    background: var(--color-surface-variant) !important;
}

.professional-table :deep(.el-table__cell) {
    padding: 1rem 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.5;
}

/* Pagination */
.pagination-wrapper {
    display: flex;
    justify-content: center;
    padding-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .stock-price-page {
        padding: 1.5rem 1rem;
    }

    .page-header h1 {
        font-size: 1.75rem;
    }

    .content-wrapper {
        padding: 1rem;
    }

    .search-section {
        flex-direction: column;
    }

    .search-input {
        max-width: 100%;
    }

    .search-btn {
        width: 100%;
    }
}

@media (min-width: 1024px) {
    .stock-price-page {
        padding: 3rem 2rem;
    }
}

/* Element Plus pagination customization */
:deep(.el-pagination) {
    --el-pagination-bg-color: var(--color-background);
    --el-pagination-text-color: var(--color-text);
    --el-pagination-button-bg-color: var(--color-background);
    --el-pagination-hover-color: var(--color-primary);
}
</style>
