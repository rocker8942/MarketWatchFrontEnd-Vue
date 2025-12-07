<template>
    <div class="page-header">
        StockPrice</div>

    <div>
        <!-- Search Input -->
        <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <el-input
                v-model="searchQuery"
                placeholder="Search by stock code or name"
                clearable
                @keyup.enter="handleSearch"
                @clear="handleSearch"
                style="max-width: 400px;">
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">Search</el-button>
        </div>

        <el-table :data="formattedProducts" style="width: 100%" @sort-change="handleSortChange">
            <el-table-column prop="code" label="Code" width="100"></el-table-column>
            <el-table-column prop="name" label="Name" width="300" sortable="custom"></el-table-column>
            <el-table-column prop="currentPrice" label="Price" width="100"></el-table-column>
            <el-table-column prop="date" label="Date" width="180" sortable="custom"></el-table-column>
            <el-table-column prop="volume" label="Volume" width="100"></el-table-column>
    
        </el-table>
    
        <!-- Pagination -->
        <div style="display: flex; justify-content: center; margin-top: 20px;">
            <el-pagination background layout="prev, pager, next" :total="totalCount" :page-size="pageSize" v-model:current-page="currentPage" @current-change="handlePageChange" />
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
.page-header {
    font-size: 24px;
    font-weight: bold;
}
</style>
