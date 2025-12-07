<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-200 py-12 px-4">
    <div class="w-full max-w-2xl p-8 rounded-3xl shadow-2xl border border-white/40 bg-white/60 backdrop-blur-md animate-fade-in">
      <div class="text-4xl font-extrabold mb-10 text-indigo-800 tracking-wide text-center drop-shadow-sm">Strategy</div>
      <div class="overflow-x-auto rounded-2xl">
        <table class="w-full border-separate rounded-2xl overflow-hidden shadow bg-white/80">
          <thead class="sticky top-0 z-10">
            <tr>
              <th class="py-4 px-5 bg-indigo-100/80 text-left font-bold border-b border-indigo-200 text-indigo-800 text-lg">ID</th>
              <th class="py-4 px-5 bg-indigo-100/80 text-left font-bold border-b border-indigo-200 text-indigo-800 text-lg">Country to Invest</th>
              <th class="py-4 px-5 bg-indigo-100/80 text-left font-bold border-b border-indigo-200 text-indigo-800 text-lg">Rate / Period</th>
              <th class="py-4 px-5 bg-indigo-100/80 text-left font-bold border-b border-indigo-200 text-indigo-800 text-lg">Rate / Year</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="strategy in pagedResultDtoOfStrategyDto.items" :key="strategy.id"
                class="even:bg-indigo-50/60 hover:bg-indigo-200/60 transition-all duration-200 focus-within:bg-indigo-300/60 cursor-pointer rounded-xl group transform hover:scale-[1.01]">
              <td class="py-3 px-5 border-b border-gray-100 group-hover:text-indigo-900 transition-colors">{{ strategy.id }}</td>
              <td class="py-3 px-5 border-b border-gray-100 group-hover:text-indigo-900 transition-colors">{{ strategy.countryToInvest }}</td>
              <td class="py-3 px-5 border-b border-gray-100 group-hover:text-indigo-900 transition-colors">{{ strategy.ratePerInvesmentPeriod }}</td>
              <td class="py-3 px-5 border-b border-gray-100 group-hover:text-indigo-900 transition-colors">{{ strategy.ratePerYear }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.7s cubic-bezier(0.4,0,0.2,1) both;
}
</style>

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
        // get strategy list with simple defaults
        const response2 = await strategyClient.strategyGetList(undefined, 0, 10);
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
