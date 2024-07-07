<template>
  <div class="page-header">StockPrice</div>

  <DataTable :value="products" paginator :rows="10" tableStyle="min-width: 50rem">
    <Column field="code" header="Code"></Column>
    <Column field="date" header="Date" :sortable="true" ></Column>
    <Column field="adjClosePrice" header="Price">
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.adjClosePrice) }}
      </template>
    </Column>
    <Column field="volume" header="Volume"></Column>
  </DataTable>

</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { StockPriceClient, PagedResultDtoOfStockPriceDto } from "@/core/services/marketWatchClient";

const stockClient = new StockPriceClient (ApiService.baseUrl, ApiService.vueInstance.axios);

// class  PageUserRequest extends PageRequest{
//         keyword:string;
//         isActive:boolean=null;//nullable
//         from:Date;
//         to:Date;
//     }

export default defineComponent({
  
  data() {
    return {
      pagedResultDtoOfstockPriceDto: new PagedResultDtoOfStockPriceDto(),
      products: null
    };
  },

  methods: {
    async getList() {
      try {
        
        // get stockPrice list
        const response = await stockClient.stockPriceGetList("",0,50);
        this.pagedResultDtoOfstockPriceDto = response as PagedResultDtoOfStockPriceDto;
        this.products = this.pagedResultDtoOfstockPriceDto.items;

      } catch (error) {
        console.error(error);
      }
    },

    formatCurrency(value) {
      return value.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    }
  },
  
  mounted() {
    this.getList();
  },
});
</script>
