<template>
    <section class="analysis-update" aria-label="Shared analysis update">
        <div>
            <strong>Simulation analysis</strong>
            <p>Update analysis for all stocks before rerunning simulations. Suspicious or invalid rows are skipped and reported; ordinary warnings are kept.</p>
            <p v-if="status" role="status" aria-live="polite" class="job-status">
                <strong>{{ status.state }}:</strong> {{ status.message }}
            </p>
            <p v-if="error" role="alert" class="job-error">{{ error }}</p>
            <SkippedAnalysisRows v-if="status?.summary" :rows="status.summary.skippedRows" />
        </div>
        <el-button type="primary" plain :loading="starting || active" :disabled="disabled || checking || starting || active || accessDenied" @click="start">
            Update analysis (UpdateStats)
        </el-button>
    </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AxiosInstance } from 'axios';
import { ElMessageBox } from 'element-plus';
import { analysisUpdateActive, getAnalysisUpdate, startAnalysisUpdate } from '@/core/services/analysisUpdate';
import type { AnalysisUpdateStatus } from '@/core/services/analysisUpdate';
import SkippedAnalysisRows from './SkippedAnalysisRows.vue';

const props = defineProps<{ client: AxiosInstance; disabled?: boolean }>();
const emit = defineEmits<{ (event: 'busy-change', busy: boolean): void }>();
const status = ref<AnalysisUpdateStatus | null>(null);
const error = ref('');
const checking = ref(true);
const starting = ref(false);
const accessDenied = ref(false);
const active = computed(() => analysisUpdateActive(status.value));
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let requestVersion = 0;
const errorMessage = (reason: any): string => reason?.response?.data?.error?.message || reason?.message || 'Request failed.';
function authorizationFailure(reason: any): boolean {
    const code = reason?.response?.status;
    if (code !== 401 && code !== 403) return false;
    accessDenied.value = true;
    error.value = code === 403
        ? 'The server denied access to analysis. Sign in again; if this continues, contact an administrator.'
        : 'Sign in again, then reload this page to check analysis status.';
    return true;
}
watch(() => starting.value || active.value, value => emit('busy-change', value), { immediate: true });

function schedule() {
    clearTimeout(timer);
    if (!disposed) timer = setTimeout(loadStatus, 3000);
}

async function loadStatus() {
    const version = ++requestVersion;
    try {
        const current = await getAnalysisUpdate(props.client);
        if (disposed || version !== requestVersion) return;
        status.value = current;
        error.value = '';
        if (analysisUpdateActive(current)) schedule();
    } catch (reason) {
        if (disposed || version !== requestVersion) return;
        if (authorizationFailure(reason)) return;
        error.value = `Cannot check analysis status. An update may still be running. ${errorMessage(reason)}`;
        schedule();
    } finally {
        checking.value = false;
    }
}

async function start() {
    try {
        await ElMessageBox.confirm(
            'Update shared analysis for all stocks and recalculate coefficients? This can take several minutes. Raw price history and saved simulation results are preserved.',
            'Update analysis for all stocks', { confirmButtonText: 'Update analysis', cancelButtonText: 'Cancel', type: 'warning' });
    } catch { return; }
    starting.value = true;
    const version = ++requestVersion;
    error.value = '';
    clearTimeout(timer);
    try {
        const current = await startAnalysisUpdate(props.client);
        if (disposed || version !== requestVersion) return;
        status.value = current;
        if (analysisUpdateActive(current)) schedule();
    } catch (reason) {
        if (disposed || version !== requestVersion) return;
        if (authorizationFailure(reason)) return;
        error.value = `Could not confirm the update started. ${errorMessage(reason)}`;
        schedule();
    } finally {
        starting.value = false;
    }
}

onMounted(loadStatus);
onBeforeUnmount(() => { disposed = true; clearTimeout(timer); });
</script>

<style scoped>
.analysis-update { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; padding: 1rem; margin-bottom: 1rem; border: 1px solid var(--el-border-color); border-radius: var(--el-border-radius-base); }
.analysis-update > div { min-width: 0; max-width: 100%; }
.analysis-update p { margin: .4rem 0 0; max-width: 75ch; color: var(--el-text-color-secondary); }
.analysis-update .job-status { white-space: pre-wrap; overflow-wrap: anywhere; }
.analysis-update .job-error { color: var(--el-color-danger); overflow-wrap: anywhere; }
</style>
