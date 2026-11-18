<template>
    <details v-if="rows.length" class="skipped-analysis">
        <summary>{{ rows.length.toLocaleString() }} skipped price rows — view symbols and dates</summary>
        <p>These dates were excluded from analysis. Raw prices and unresolved findings are preserved; ordinary warning rows are kept.</p>
        <div class="report-table">
            <table>
                <caption>Skipped analysis prices</caption>
                <thead><tr><th scope="col">Symbol</th><th scope="col">Date</th><th scope="col">Reason</th></tr></thead>
                <tbody><tr v-for="row in visible" :key="`${row.stockCode}-${row.tradeDate}`">
                    <td>{{ row.stockCode }}</td><td>{{ row.tradeDate.slice(0, 10) }}</td><td>{{ row.reason }}</td>
                </tr></tbody>
            </table>
        </div>
        <nav aria-label="Skipped price rows pages">
            <button type="button" :disabled="page === 0" @click="page--">Previous</button>
            <span role="status">Page {{ page + 1 }} of {{ pages }}</span>
            <button type="button" :disabled="page + 1 >= pages" @click="page++">Next</button>
        </nav>
    </details>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { SkippedAnalysisRow } from '@/core/services/analysisUpdate';
const props = defineProps<{ rows: SkippedAnalysisRow[] }>();
const page = ref(0);
const pages = computed(() => Math.max(1, Math.ceil(props.rows.length / 50)));
const visible = computed(() => props.rows.slice(page.value * 50, (page.value + 1) * 50));
watch(() => props.rows, () => { page.value = 0; });
</script>
<style scoped>
.skipped-analysis { margin-top: .75rem; max-width: 100%; }
summary { cursor: pointer; font-weight: 600; }
p { max-width: 75ch; }
.report-table { overflow-x: auto; margin: .75rem 0; }
table { border-collapse: collapse; width: 100%; font-size: .875rem; }
caption { text-align: left; padding-bottom: .5rem; }
th, td { padding: .5rem; border-bottom: 1px solid var(--el-border-color); text-align: left; vertical-align: top; }
td:first-child, td:nth-child(2) { white-space: nowrap; }
td:last-child { min-width: 12rem; overflow-wrap: anywhere; }
nav { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
button { padding: .4rem .75rem; cursor: pointer; }
button:disabled { cursor: default; }
</style>
