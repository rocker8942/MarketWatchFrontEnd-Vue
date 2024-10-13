<template>

  <el-row>
      <el-col :span="8"><GoogleChart :data="data" :width="400" :height="300" :title="'S&P 500'" /></el-col>
      <el-col :span="8"><GoogleChart :data="ftse" :width="400" :height="300" :title="'FTSE 100'" /></el-col>
      <el-col :span="8"><GoogleChart :data="china" :width="400" :height="300" :title="'China'" /></el-col>
  </el-row>

  <el-row>
      <el-col :span="8"><GoogleChart :data="korea" :width="400" :height="300" :title="'Korea'" /></el-col>
      <el-col :span="8"><GoogleChart :data="australia" :width="400" :height="300" :title="'Australia'" /></el-col>
      <el-col :span="8"><GoogleChart :data="dollar" :width="400" :height="300" :title="'US Dollar'" /></el-col>
  </el-row>

  <el-row>
      <el-col :span="8"><GoogleChart :data="gold" :width="400" :height="300" :title="'Gold'" /></el-col>
      <el-col :span="8"><GoogleChart :data="tbond" :width="400" :height="300" :title="'T-bond 30years'" /></el-col>
      <el-col :span="8"></el-col>
  </el-row>

</template>

<script lang="ts">
import GoogleChart from "../components/GoogleChart";
import ApiService from "@/core/services/apiService";
import { StockPriceClient, PagedResultDtoOfStockPriceDto, StockChartDto } from "@/core/services/marketWatchClient";

export default {
  name: "App",
  components: {
    GoogleChart,
  },
  data() {
    return {
      data: null,
      ftse: null,
      china: null,
      korea: null,
      australia: null,
      dollar: null,
      gold: null,
      tbond: null,
    };
  },

  async mounted() {
    this.data = await this.getData("^GSPC");
    this.ftse = await this.getData("^FTSE");
    this.china = await this.getData("FXI");
    this.korea = await this.getData("EWY");
    this.australia = await this.getData("EWA");
    this.dollar = await this.getData("UUP");
    this.gold = await this.getData("GLD");
    this.tbond = await this.getData("^TYX");
  },

  methods: {
    async getData(code: string) {
      // get stockPrice list
      const stockClient = new StockPriceClient(ApiService.baseUrl, ApiService.vueInstance.axios);
      const response = await stockClient.stockPriceGetStockPriceByCode(`date desc`, 1, 1000, code);
      const prices = response as StockChartDto[];

      if (!prices || prices.length === 0) {
        return;
      }

      return [
        ...[["Date", "Price"]],
        ...prices.map((item) => [item.date, item.adjClosePrice])
      ];
    }
  },
};

</script>
