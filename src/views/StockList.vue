<template>
    <div class="stock-list-container">
        <PageHeader
            title="Securities Directory"
            subtitle="Browse and search our comprehensive database of securities"
            :show-search="true"
            search-placeholder="Search"
            @search="handleHeaderSearch"
        />

        <div class="filter-bar">
            <div class="filter-bar-left">
                <el-dropdown class="filter-dropdown">
                    <button class="filter-btn">
                        All <el-icon class="ml-1"><ArrowDown /></el-icon>
                    </button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item>All Securities</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>

            <div class="flex-1"></div>

            <div class="filter-bar-right">
                <el-input
                    v-model="stockCode"
                    class="search-input"
                    placeholder="Search by stock code or name..."
                    clearable
                    @keyup.enter="handleSearch">
                    <template #prefix>
                        <el-icon class="search-icon"><Search /></el-icon>
                    </template>
                </el-input>
                <el-button @click="handleSearch" type="primary" class="search-btn">
                    Search
                </el-button>
            </div>
        </div>

        <div class="table-section">
            <div class="table-header">
                <div class="results-info">
                    <span class="result-count">{{ totalCount }}</span> securities found
                </div>
            </div>

            <el-table
                :data="formattedProducts"
                class="professional-table"
                stripe
                @sort-change="handleSortChange"
                :header-cell-style="{ background: 'var(--color-surface-variant)', color: 'var(--color-heading)', fontWeight: '600' }">

                <el-table-column prop="id" label="ID" width="100" align="center">
                    <template #default="scope">
                        <span class="id-badge">{{ scope.row.id }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="Security Name" min-width="300" sortable="custom">
                    <template #default="scope">
                        <div class="security-name">
                            <span class="name-text">{{ scope.row.name }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="country" label="Country" width="200" sortable="custom">
                    <template #default="scope">
                        <span class="country-tag">{{ scope.row.country }}</span>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                    background
                    layout="total, prev, pager, next, jumper"
                    :total="totalCount"
                    :page-size="pageSize"
                    v-model:current-page="currentPage"
                    @current-change="handlePageChange"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import DataTable from 'datatables.net-vue3';
import DataTablesLib from 'datatables.net';
import ApiService from "@/core/services/apiService";
import { StockInfoClient, PagedResultDtoOfStockInfoDto } from "@/core/services/marketWatchClient";
import moment from 'moment';
import { Search, ArrowDown } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue';

DataTable.use(DataTablesLib);

const stockClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);

export default defineComponent({
    components: {
        Search,
        ArrowDown,
        PageHeader
    },

    data() {
        return {
            pagedResultDtoOfstockPriceDto: new PagedResultDtoOfStockInfoDto(),
            products: undefined,
            pageSize: 20, // Items per page
            currentPage: 1,
            totalCount: 0,
            sortField: '',
            sortOrder: '',
            stockCode: '',
        };
    },

    methods: {
        async getList() {
            try {

                // get stockPrice list
                const response = await stockClient.stockInfoGetStockInfoList(`${this.sortField} ${this.sortOrder}`,
                 (this.currentPage - 1) * this.pageSize,
                 this.pageSize,
                 this.stockCode
                );
                // this.pagedResultDtoOfstockPriceDto = response as PagedResultDtoOfStockInfoDto;
                this.products = response.items;
                this.totalCount = response.totalCount;

            } catch (error) {
                console.error(error);
            }
        },
        handleSearch() {
            this.getList();
        },
        handleHeaderSearch(query: string) {
            this.stockCode = query;
            this.getList();
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

    },

    computed: {
        formattedProducts() {
            return this.products ? this.products.map(product => ({
                ...product,
                date: moment(product.date).format('YYYY-MM-DD'),
            })) : [];
        }
    },

    mounted() {
        this.getList();
    },
});
</script>

<style scoped>
.stock-list-container {
    padding: var(--space-4xl) var(--space-xl);
    max-width: 1400px;
    margin: 0 auto;
}

/* Filter Bar */
.filter-bar-left {
    display: flex;
    align-items: center;
}

.filter-bar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.flex-1 {
    flex: 1;
}

.ml-1 {
    margin-left: 0.25rem;
}

.filter-dropdown {
    background: transparent;
    border: none;
}

.search-input {
    width: 320px;
    font-size: 1rem;
}

.search-input :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
    border-color: var(--color-border-strong);
}

.search-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.search-icon {
    color: var(--color-text-secondary);
}

.search-btn {
    font-weight: 500;
    border-radius: 8px;
}

/* Table Section - Minimalist */
.table-section {
    background: var(--color-background-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    padding: var(--space-2xl);
    box-shadow: var(--shadow-subtle);
}

.table-header {
    margin-bottom: var(--space-xl);
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--color-border-subtle);
}

.results-info {
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
}

.result-count {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--color-primary);
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
    padding: 1.25rem 1rem;
}

.id-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    background: var(--finance-blue);
    color: white;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
}

.security-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.name-text {
    font-weight: 500;
    color: var(--color-heading);
    font-size: 0.9375rem;
}

.country-tag {
    display: inline-block;
    padding: 0.375rem 0.875rem;
    background: var(--color-surface-variant);
    color: var(--color-text);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
}

/* Pagination */
.pagination-wrapper {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
}

.pagination-wrapper :deep(.el-pagination) {
    gap: 0.5rem;
}

.pagination-wrapper :deep(.el-pager li) {
    border-radius: 6px;
    font-weight: 500;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
    background: var(--color-primary);
    color: white;
}

/* Responsive */
@media (max-width: 768px) {
    .stock-list-container {
        padding: 1.5rem 1rem;
    }

    .page-header h1 {
        font-size: 2rem;
    }

    .page-subtitle {
        font-size: 0.9375rem;
    }

    .search-wrapper {
        max-width: 100%;
    }

    .table-section {
        padding: 1rem;
        border-radius: 8px;
    }

    .professional-table :deep(.el-table__cell) {
        padding: 0.75rem 0.5rem;
    }

    .pagination-wrapper :deep(.el-pagination) {
        flex-wrap: wrap;
    }
}

@media (min-width: 1024px) {
    .stock-list-container {
        padding: 3rem 2rem;
    }
}
</style>
