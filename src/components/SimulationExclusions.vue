<template>
  <section v-if="exclusions?.length" class="exclusions" role="status" aria-label="Skipped price rows">
    <h3>Price rows skipped across {{ stockCount }} {{ stockCount === 1 ? 'stock' : 'stocks' }}</h3>
    <p>The dates below were excluded from price history because of unresolved quality findings. Other valid dates for these stocks remain eligible.</p>
    <div class="exclusions-scroll">
      <table>
        <thead><tr><th>Stock</th><th>Date</th><th>Severity</th><th>Rule</th><th>Reason</th></tr></thead>
        <tbody>
          <tr v-for="(finding, index) in exclusions" :key="index">
            <td>{{ finding.stockCode }}</td><td>{{ finding.tradeDate.slice(0, 10) }}</td>
            <td>{{ finding.severity }}</td><td>{{ finding.ruleId }}</td><td>{{ finding.reason }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export interface SimulationStockExclusion {
  stockCode: string;
  tradeDate: string;
  ruleId: string;
  severity: string;
  reason: string;
}

export default defineComponent({
  props: {
    exclusions: { type: Array as PropType<SimulationStockExclusion[]>, default: () => [] },
  },
  computed: {
    stockCount(): number {
      return new Set(this.exclusions.map(item => item.stockCode.toUpperCase())).size;
    },
  },
});
</script>

<style scoped>
.exclusions { margin: 1rem 0; padding: 1rem; border: 1px solid #e6a23c; border-radius: 8px; background: #fdf6ec; color: #664411; }
h3 { margin: 0 0 0.5rem; font-weight: 600; }
p { margin: 0 0 0.75rem; }
.exclusions-scroll { overflow-x: auto; max-height: 24rem; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 0.5rem; border-bottom: 1px solid #e8d9be; vertical-align: top; }
</style>
