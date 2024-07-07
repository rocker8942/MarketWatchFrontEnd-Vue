<template>
  <div class="page-header">Strategy</div>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Country to Invest</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="strategy in pagedResultDtoOfStrategyDto.items" :key="strategy.id">
        <td>{{ strategy.id }}</td>
        <td>{{ strategy.countryToInvest }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { PagedResultDtoOfStrategyDto, StrategyClient } from "@/core/services/marketWatchClient";

const strategyClient = new StrategyClient(ApiService.baseUrl, ApiService.vueInstance.axios);

// class  PageUserRequest extends PageRequest{
//         keyword:string;
//         isActive:boolean=null;//nullable
//         from:Date;
//         to:Date;
//     }

export default defineComponent({
  
  data() {
    return {
      pagedResultDtoOfStrategyDto: new PagedResultDtoOfStrategyDto(),
    };
  },

  methods: {
    async getList() {
      try {
        
        // get strategy list
        const response2 = await strategyClient.strategyGetList();
        this.pagedResultDtoOfStrategyDto = response2 as PagedResultDtoOfStrategyDto;

      } catch (error) {
        console.error(error);
      }
    },
  },
  
  mounted() {
    this.getList();
  },
});
</script>
