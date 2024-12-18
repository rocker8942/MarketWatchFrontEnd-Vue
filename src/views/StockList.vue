<template>
    <div class="page-header">
    
        StockList</div>
    
    <div>
    
        <el-table :data="formattedProducts" style="width: 100%" @sort-change="handleSortChange">
    
            <el-table-column prop="id" label="Id" width="100"></el-table-column>
    
            <el-table-column prop="name" label="Name" width="300" sortable="custom"></el-table-column>
    
            <el-table-column prop="country" label="Country" width="300" sortable="custom"></el-table-column>
    
        </el-table>
    
        <!-- Pagination -->
    
        <div style="display: flex; justify-content: center; margin-top: 20px;">
            <el-pagination background layout="prev, pager, next" :total="totalCount" :page-size="pageSize" v-model:current-page="currentPage" @current-change="handlePageChange" />
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

const stockClient = new StockInfoClient(ApiService.baseUrl, ApiService.vueInstance.axios);

DataTable.use(DataTablesLib);

export default defineComponent({

    data() {
        return {
            pagedResultDtoOfstockPriceDto: new PagedResultDtoOfStockInfoDto(),
            products: undefined,
            pageSize: 20, // Items per page
            currentPage: 1,
            totalCount: 0,
            sortField: '',
            sortOrder: '',
        };
    },

    methods: {
        async getList() {
            try {

                // get stockPrice list
                const response = await stockClient.stockInfoGetList(`${this.sortField} ${this.sortOrder}`, (this.currentPage - 1) * this.pageSize, this.pageSize);
                // this.pagedResultDtoOfstockPriceDto = response as PagedResultDtoOfStockInfoDto;
                this.products = response.items;
                this.totalCount = response.totalCount;

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
.page-header {
    font-size: 24px;
    font-weight: bold;
}
</style>
