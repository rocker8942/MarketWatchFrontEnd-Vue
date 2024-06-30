<template>
  <div>Strategy</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import { StrategyClient, StrategyDto } from "@/core/services/marketWatchClient";

const strategyClient = new StrategyClient(ApiService.baseUrl, ApiService.vueInstance.axios);

// class  PageUserRequest extends PageRequest{
//         keyword:string;
//         isActive:boolean=null;//nullable
//         from:Date;
//         to:Date;
//     }

export default defineComponent({
  // pagerequest:PageUserRequest = new PageUserRequest();

  methods: {
    async getList() {
      try {
        
        const response = await strategyClient.strategyGet(1);
        const strategy = response as StrategyDto;
        console.log(strategy);

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
