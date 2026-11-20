<template>
  <div class="data-workspace">
    <PageHeader title="Optimization Monitor">
      <template #actions>
        <el-button type="primary" @click="$router.push({ name: 'optimizationConfig' })">
          <el-icon><Plus /></el-icon>
          New Optimization
        </el-button>
      </template>
    </PageHeader>
    <div class="monitor-grid" :class="{ 'show-details': selectedJob }">

      <!-- Active Jobs -->
      <el-card class="jobs-card">
        <el-table
          v-loading="loading"
          :data="jobs"
          class="jobs-table compact-table"
          row-key="id"
          highlight-current-row
          :current-row-key="selectedJob?.id"
          @row-click="selectJob">
          <el-table-column label="Job" min-width="92">
            <template #default="scope">
              <button
                type="button"
                class="job-link"
                :data-job-id="scope.row.id"
                :title="getStrategyName(scope.row.strategyType)"
                :aria-label="'View job ' + scope.row.id + ', ' + getStrategyName(scope.row.strategyType)"
                :aria-expanded="selectedJob?.id === scope.row.id"
                :aria-controls="selectedJob?.id === scope.row.id ? 'optimization-job-details' : undefined"
                @click.stop="selectJob(scope.row)"
              >
                #{{ scope.row.id }} <span>{{ getStrategyName(scope.row.strategyType) }}</span>
              </button>
            </template>
          </el-table-column>

          <el-table-column label="Status" min-width="82">
            <template #default="scope">
              <el-tag size="small" :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Progress" min-width="73" align="right">
            <template #default="scope">
              <div class="progress-container">
                <el-progress
                  :percentage="scope.row.progressPercentage || 0"
                  :show-text="false"
                  :stroke-width="3"
                  :status="scope.row.status === 'Completed' ? 'success' : undefined" />
                <span class="progress-text">
                  {{ (scope.row.completedSimulations ?? 0) + (scope.row.failedSimulations ?? 0) }}/{{ scope.row.totalSimulations }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Best return" min-width="87" align="right">
            <template #default="scope">
              <span
                class="metric-value"
                :class="{
                  'return-positive': scope.row.bestAnnualizedReturn > 0,
                  'return-negative': scope.row.bestAnnualizedReturn < 0
                }">
                {{ formatPercentage(scope.row.bestAnnualizedReturn) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Sharpe" min-width="71" align="right">
            <template #default="scope">
              <span class="metric-value">
                {{ formatNumber(scope.row.bestSharpeRatio) }}
              </span>
            </template>
          </el-table-column>

        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 25, 50]"
            :total="totalJobs"
            layout="prev, pager, next, sizes, total"
            :pager-count="5"
            size="small"
            background
            @current-change="loadJobs"
            @size-change="loadJobs" />
        </div>
      </el-card>

      <!-- Job Details -->
      <el-card v-if="selectedJob" id="optimization-job-details" class="details-card">
        <template #header>
          <div class="card-header">
            <h2 ref="detailsHeading" class="card-title" tabindex="-1">Job #{{ selectedJob.id }}</h2>
            <el-button size="small" @click="closeJob">Back to jobs</el-button>
          </div>
        </template>

        <div class="job-context">
          <span>{{ getStrategyName(selectedJob.strategyType) }}</span>
          <span>{{ selectedJob.country }}</span>
          <span>{{ selectedJob.optimizationMethod }}</span>
          <span>{{ formatDateTime(selectedJob.creationTime) }}</span>
        </div>
        <div class="action-buttons">
          <el-button
            v-if="canStartJob(selectedJob)"
            type="primary"
            size="small"
            @click="startJob(selectedJob.id)"
          >Start</el-button>
          <el-button
            v-if="selectedJob.status === 'Running'"
            type="warning"
            size="small"
            @click="cancelJob(selectedJob.id)"
          >Cancel</el-button>
          <el-button type="danger" plain size="small" @click="deleteJob(selectedJob.id)">Delete</el-button>
        </div>

        <!-- Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Simulations</div>
            <div class="stat-value">{{ selectedJob.totalSimulations }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Completed</div>
            <div class="stat-value success">{{ selectedJob.completedSimulations }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Failed</div>
            <div class="stat-value danger">{{ selectedJob.failedSimulations }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Best Sharpe Ratio</div>
            <div class="stat-value">{{ formatNumber(selectedJob.bestSharpeRatio) }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Best Annual Return</div>
            <div class="stat-value">{{ formatPercentage(selectedJob.bestAnnualizedReturn) }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Status</div>
            <div class="stat-value">
              <el-tag size="small" :type="getStatusType(selectedJob.status)">{{ selectedJob.status }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Top Performers -->
        <h3 class="section-title">Top Performers</h3>
        <el-table
          v-loading="loadingTopPerformers"
          :data="topPerformers"
          class="performers-table compact-table"
          :default-sort="{ prop: 'sharpeRatio', order: 'descending' }">

          <el-table-column type="expand" width="32">
            <template #default="props">
              <div class="expanded-content">
                <pre>{{ formatJson(props.row.parameters) }}</pre>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="#" type="index" width="32" :index="(index) => index + 1" />

          <el-table-column label="Sharpe" prop="sharpeRatio" min-width="76" align="right" sortable>
            <template #default="scope">
              {{ formatNumber(scope.row.sharpeRatio) }}
            </template>
          </el-table-column>

          <el-table-column label="Annual return" prop="annualizedReturn" min-width="114" align="right" sortable>
            <template #default="scope">
              {{ formatPercentage(scope.row.annualizedReturn) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" min-width="92">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="useParameters(scope.row.parameters)">
                Use settings
              </el-button>
            </template>
          </el-table-column>

          <el-table-column label="Total return" prop="totalReturn" min-width="100" align="right" sortable>
            <template #default="scope">
              {{ formatPercentage(scope.row.totalReturn) }}
            </template>
          </el-table-column>

          <el-table-column label="Status" prop="status" min-width="90">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Completed" min-width="166" show-overflow-tooltip>
            <template #default="scope">
              {{ formatDateTime(scope.row.completedAt) }}
            </template>
          </el-table-column>

        </el-table>

        <!-- Best Parameters Display -->
        <details v-if="selectedJob.bestParameters" class="best-parameters">
          <summary>Best parameters</summary>
          <pre class="parameters-display">{{ formatJson(selectedJob.bestParameters) }}</pre>
        </details>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import { Plus } from '@element-plus/icons-vue';
import ApiService from "@/core/services/apiService";

const signedPercentage = new Intl.NumberFormat(undefined, {
  style: "percent",
  signDisplay: "exceptZero",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

interface OptimizationJob {
  id: number;
  strategyType: number;
  country: string;
  optimizationMethod: string;
  status: string;
  totalSimulations: number;
  completedSimulations: number;
  failedSimulations: number;
  progressPercentage: number;
  bestSharpeRatio: number | null;
  bestAnnualizedReturn: number | null;
  bestParameters: string | null;
  creationTime: string;
  completedAt: string | null;
}

interface TopPerformer {
  id: number;
  status: string;
  sharpeRatio: number;
  annualizedReturn: number;
  totalReturn: number;
  parameters: string;
  completedAt: string;
}

export default defineComponent({
  components: {
    PageHeader,
    Plus
  },

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      loading: false,
      loadingTopPerformers: false,
      jobs: [] as OptimizationJob[],
      selectedJob: null as OptimizationJob | null,
      topPerformers: [] as TopPerformer[],
      performerRequest: 0,
      currentPage: 1,
      pageSize: 10,
      totalJobs: 0,
      refreshTimer: null as number | null
    };
  },

  mounted() {
    this.loadJobs();
    // Auto-refresh every 10 seconds
    this.refreshTimer = window.setInterval(() => {
      this.loadJobs();
      if (this.selectedJob) {
        this.loadTopPerformers(this.selectedJob.id);
      }
    }, 10000);
  },

  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },

  methods: {
    async loadJobs() {
      this.loading = true;
      try {
        const res = await ApiService.vueInstance.axios.get(
          `/api/app/optimization-job?SkipCount=${(this.currentPage - 1) * this.pageSize}&MaxResultCount=${this.pageSize}`
        );

        const data = res.data;
        if (data.items && Array.isArray(data.items)) {
          this.jobs = data.items;
          this.totalJobs = data.totalCount || data.items.length;
          if (this.selectedJob) {
            this.selectedJob = this.jobs.find(job => job.id === this.selectedJob?.id) ?? this.selectedJob;
          }
        } else {
          this.jobs = [];
          this.totalJobs = 0;
        }

      } catch (error) {
        console.error("Failed to load optimization jobs", error);
        this.$message.error("Failed to load optimization jobs");
      } finally {
        this.loading = false;
      }
    },

    async selectJob(job: OptimizationJob) {
      if (this.selectedJob?.id !== job.id) this.topPerformers = [];
      this.selectedJob = job;
      await this.$nextTick();
      (this.$refs.detailsHeading as HTMLElement | undefined)?.focus();
      await this.loadTopPerformers(job.id);
    },

    async closeJob() {
      const selectedId = this.selectedJob?.id;
      this.selectedJob = null;
      await this.$nextTick();
      (this.$el as HTMLElement).querySelector<HTMLElement>(`[data-job-id="${selectedId}"]`)?.focus();
    },

    async loadTopPerformers(jobId: number) {
      const request = ++this.performerRequest;
      this.loadingTopPerformers = true;
      try {
        const res = await ApiService.vueInstance.axios.get(
          `/api/app/optimization-job/${jobId}/top-performers?count=10`
        );

        if (request !== this.performerRequest || this.selectedJob?.id !== jobId) return;
        const data = res.data;
        if (Array.isArray(data)) {
          this.topPerformers = data;
        } else {
          this.topPerformers = [];
        }

      } catch (error) {
        console.error("Failed to load top performers", error);
      } finally {
        if (request === this.performerRequest) this.loadingTopPerformers = false;
      }
    },

    async startJob(jobId: number) {
      try {
        await ApiService.vueInstance.axios.post(`/api/app/optimization-job/${jobId}/start`);
        this.$message.success("Optimization job started");
        await this.loadJobs();
      } catch (error) {
        console.error("Failed to start job", error);
        this.$message.error("Failed to start optimization job");
      }
    },

    async cancelJob(jobId: number) {
      try {
        await this.$confirm("Are you sure you want to cancel this optimization job?", "Cancel Job", {
          confirmButtonText: "Cancel Job",
          cancelButtonText: "Keep Running",
          type: "warning"
        });

        await ApiService.vueInstance.axios.post(`/api/app/optimization-job/${jobId}/cancel`);
        this.$message.success("Optimization job cancelled");
        await this.loadJobs();
      } catch (error) {
        if (error !== 'cancel') {
          console.error("Failed to cancel job", error);
          this.$message.error("Failed to cancel optimization job");
        }
      }
    },

    async deleteJob(jobId: number) {
      try {
        await this.$confirm(
          "This will permanently delete the optimization job and all its simulation results. Continue?",
          "Delete Job",
          {
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            type: "warning"
          }
        );

        await ApiService.vueInstance.axios.delete(`/api/app/optimization-job/${jobId}`);
        this.$message.success("Optimization job deleted");

        // If the deleted job was selected, clear it
        if (this.selectedJob && this.selectedJob.id === jobId) {
          this.selectedJob = null;
        }

        await this.loadJobs();
      } catch (error) {
        if (error !== 'cancel') {
          console.error("Failed to delete job", error);
          this.$message.error("Failed to delete optimization job");
        }
      }
    },

    useParameters(parametersJson: string) {
      try {
        const params = JSON.parse(parametersJson);

        // Navigate to Run Simulation with these parameters
        this.$router.push({
          name: 'simulateRun',
          query: {
            analysisPeriod: params.analysisPeriod?.toString(),
            coefficientAllowed: params.coefficientAllowed?.toString(),
            investTriggerRate: params.investTriggerRate?.toString(),
            lossCutRate: params.lossCutRate?.toString(),
            portfolioNumber: params.portfolioNumber?.toString(),
            tradeFee: params.tradeFee?.toString() || '0.001',
            slippage: params.slippage?.toString() || '0.001',
            useTrendFilter: params.useTrendFilter?.toString() || 'false',
            trendFilterThreshold: params.trendFilterThreshold?.toString() || '0'
          }
        });
      } catch (error) {
        console.error("Failed to parse parameters", error);
        this.$message.error("Failed to parse parameters");
      }
    },

    canStartJob(job: OptimizationJob): boolean {
      // Only show Start button if:
      // 1. Status is Pending AND
      // 2. No simulations have been processed yet (completedSimulations and failedSimulations are both 0)
      return job.status === 'Pending' && job.completedSimulations === 0 && job.failedSimulations === 0;
    },

    getStrategyName(typeId: number): string {
      const strategies: { [key: number]: string } = {
        0: 'Pairs Trading',
        1: 'Mean Reversion',
        2: 'Momentum'
      };
      return strategies[typeId] || `Strategy ${typeId}`;
    },

    getStatusType(status: string): string {
      const types: { [key: string]: string } = {
        'Pending': 'info',
        'Running': 'warning',
        'Completed': 'success',
        'Failed': 'danger',
        'Cancelled': ''
      };
      return types[status] || '';
    },

    formatNumber(value: number | null | undefined): string {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(2);
    },

    formatPercentage(value: number | null | undefined): string {
      if (value == null || !Number.isFinite(value)) return "—";
      return signedPercentage.format(value);
    },

    formatDateTime(dateStr: string | null | undefined): string {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleString();
    },

    formatJson(jsonStr: string | null | undefined): string {
      if (!jsonStr) return "—";
      try {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
      } catch {
        return jsonStr;
      }
    }
  }
});
</script>

<style scoped>
.monitor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.monitor-grid.show-details {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.jobs-card,
.details-card {
  min-width: 0;
  --el-card-padding: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.jobs-table {
  margin-bottom: 8px;
}

.jobs-table :deep(.cell),
.performers-table :deep(.el-table__cell .cell) {
  padding-inline: 5px;
}

.jobs-table :deep(th .cell),
.performers-table :deep(.el-table__cell .cell) {
  white-space: nowrap;
}

.job-link {
  display: block;
  max-width: 100%;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.job-link span {
  margin-left: 3px;
  color: var(--color-text);
  font-weight: 400;
}

.job-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.jobs-table :deep(.el-table__row) {
  cursor: pointer;
}

.progress-container {
  display: grid;
  grid-template-columns: minmax(12px, 1fr) auto;
  align-items: center;
  gap: 4px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.metric-value {
  font-weight: 500;
}

.metric-value.return-positive {
  color: var(--market-gain);
}

.metric-value.return-negative {
  color: var(--market-loss);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.job-context {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 4px;
}

.pagination-wrapper :deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(94px, 1fr));
  gap: 1px;
  margin-bottom: 12px;
  background: var(--color-border);
  border: 1px solid var(--color-border);
}

.stat-card {
  background: var(--color-surface-variant);
  padding: 5px 8px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-heading);
}

.stat-value.success {
  color: var(--market-gain);
}

.stat-value.danger {
  color: var(--market-loss);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 4px;
}

.expanded-content {
  padding: 8px;
  background: var(--color-surface-variant);
}

.best-parameters {
  margin-top: 8px;
  font-size: 0.875rem;
}

.best-parameters summary {
  cursor: pointer;
}

.expanded-content pre,
.parameters-display {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 960px) {
  .monitor-grid.show-details {
    grid-template-columns: minmax(0, 1fr);
  }

  .show-details .jobs-card {
    display: none;
  }
}
</style>
