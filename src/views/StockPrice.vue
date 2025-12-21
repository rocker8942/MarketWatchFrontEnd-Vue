<template>
    <div class="stock-price-page">
        <div class="page-header">
            <h1>Stock Prices</h1>
            <p class="subtitle">Browse and search stock prices with real-time data</p>
        </div>

        <div class="content-wrapper">
            <!-- Search Bar -->
            <div class="search-section">
                <el-input
                    v-model="searchQuery"
                    placeholder="Search by stock code or name"
                    clearable
                    @keyup.enter="handleSearch"
                    @clear="handleSearch"
                    class="search-input"
                    size="large">
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                </el-input>
                <el-button type="primary" @click="handleSearch" size="large" class="search-btn">Search</el-button>
            </div>

            <!-- Data Table -->
            <div class="table-container">
                <el-table
                    :data="formattedProducts"
                    style="width: 100%"
                    @sort-change="handleSortChange"
                    stripe>
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
import { StockPriceClient, PagedResultDtoOfStockPriceDto } from "@/core/services/marketWatchClient";
import moment from 'moment';

const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);

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
                    this.searchQuery || undefined
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

    },

    computed: {
        formattedProducts() {
            return this.products ? this.products.map(product => ({
                ...product,
                date: moment(product.date).format('YYYY-MM-DD'),
                currentPrice: this.formatCurrency(product.currentPrice),
            })) : [];
        }
    },

    mounted() {
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
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    padding: var(--space-2xl);
    box-shadow: var(--shadow-subtle);
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

/* Table Container */
.table-container {
    background: var(--color-background);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1.5rem;
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

/* Element Plus table customization */
:deep(.el-table) {
    --el-table-border-color: var(--color-border);
    --el-table-bg-color: var(--color-background);
    --el-table-tr-bg-color: var(--color-background);
    --el-table-header-bg-color: var(--color-surface-variant);
    --el-table-header-text-color: var(--color-heading);
    --el-table-text-color: var(--color-text);
    --el-table-row-hover-bg-color: var(--color-surface-variant);
}

:deep(.el-table th.el-table__cell) {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

:deep(.el-table td.el-table__cell) {
    font-size: 0.9375rem;
}

/* Element Plus pagination customization */
:deep(.el-pagination) {
    --el-pagination-bg-color: var(--color-background);
    --el-pagination-text-color: var(--color-text);
    --el-pagination-button-bg-color: var(--color-background);
    --el-pagination-hover-color: var(--color-primary);
}
</style>
