<template>
  <div class="page-container">
    <div class="content-wrapper">
      <PageHeader
        title="Optimization Monitor"
        subtitle="Track and analyze running parameter optimization jobs"
      />

      <!-- Active Jobs -->
      <el-card class="jobs-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">Optimization Jobs</span>
            <el-button type="primary" size="small" @click="$router.push({ name: 'optimizationConfig' })">
              <el-icon><Plus /></el-icon>
              New Optimization
            </el-button>
          </div>
        </template>

        <el-table
          v-loading="loading"
          :data="jobs"
          class="jobs-table"
          @row-click="selectJob">
          <el-table-column label="ID" prop="id" width="80" />

          <el-table-column label="Strategy" min-width="150">
            <template #default="scope">
              {{ getStrategyName(scope.row.strategyType) }}
            </template>
          </el-table-column>

          <el-table-column label="Country" prop="country" width="100" />

          <el-table-column label="Method" prop="optimizationMethod" width="120" />

          <el-table-column label="Status" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Progress" width="180">
            <template #default="scope">
              <div class="progress-container">
                <el-progress
                  :percentage="scope.row.progressPercentage || 0"
                  :status="scope.row.status === 'Completed' ? 'success' : undefined" />
                <span class="progress-text">
                  {{ scope.row.completedSimulations + scope.row.failedSimulations }} / {{ scope.row.totalSimulations }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Best Return" width="120" align="right">
            <template #default="scope">
              <span
                v-if="scope.row.bestAnnualizedReturn"
                class="metric-value"
                :class="{
                  'return-positive': scope.row.bestAnnualizedReturn > 0,
                  'return-negative': scope.row.bestAnnualizedReturn < 0
                }">
                {{ formatPercentage(scope.row.bestAnnualizedReturn) }}
              </span>
              <span v-else class="empty-value">—</span>
            </template>
          </el-table-column>

          <el-table-column label="Best Sharpe" width="120" align="right">
            <template #default="scope">
              <span v-if="scope.row.bestSharpeRatio" class="metric-value">
                {{ formatNumber(scope.row.bestSharpeRatio) }}
              </span>
              <span v-else class="empty-value">—</span>
            </template>
          </el-table-column>

          <el-table-column label="Created" width="140">
            <template #default="scope">
              {{ formatDateTime(scope.row.creationTime) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120" fixed="right">
            <template #default="scope">
              <div class="action-buttons">
                <el-button
                  v-if="canStartJob(scope.row)"
                  type="primary"
                  size="small"
                  @click.stop="startJob(scope.row.id)">
                  Start
                </el-button>
                <el-button
                  v-if="scope.row.status === 'Running'"
                  type="warning"
                  size="small"
                  @click.stop="cancelJob(scope.row.id)">
                  Cancel
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click.stop="deleteJob(scope.row.id)">
                  Delete
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 25, 50]"
            :total="totalJobs"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="loadJobs"
            @size-change="loadJobs" />
        </div>
      </el-card>

      <!-- Job Details -->
      <el-card v-if="selectedJob" class="details-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">Job Details - ID: {{ selectedJob.id }}</span>
            <el-button size="small" @click="selectedJob = null">Close</el-button>
          </div>
        </template>

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
              <el-tag :type="getStatusType(selectedJob.status)">{{ selectedJob.status }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Top Performers -->
        <div class="section-title" style="margin-top: 2rem;">Top 10 Performers</div>
        <el-table
          v-loading="loadingTopPerformers"
          :data="topPerformers"
          class="performers-table"
          :default-sort="{ prop: 'sharpeRatio', order: 'descending' }">

          <el-table-column type="expand">
            <template #default="props">
              <div class="expanded-content">
                <pre>{{ formatJson(props.row.parameters) }}</pre>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Rank" type="index" width="60" :index="(index) => index + 1" />

          <el-table-column label="Sharpe Ratio" prop="sharpeRatio" width="130" sortable>
            <template #default="scope">
              {{ formatNumber(scope.row.sharpeRatio) }}
            </template>
          </el-table-column>

          <el-table-column label="Annual Return" prop="annualizedReturn" width="140" sortable>
            <template #default="scope">
              {{ formatPercentage(scope.row.annualizedReturn) }}
            </template>
          </el-table-column>

          <el-table-column label="Total Return" prop="totalReturn" width="130" sortable>
            <template #default="scope">
              {{ formatPercentage(scope.row.totalReturn) }}
            </template>
          </el-table-column>

          <el-table-column label="Status" prop="status" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Completed" width="140">
            <template #default="scope">
              {{ formatDateTime(scope.row.completedAt) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="useParameters(scope.row.parameters)">
                Use These
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Best Parameters Display -->
        <div v-if="selectedJob.bestParameters" class="section-title" style="margin-top: 2rem;">
          Best Parameters Found
        </div>
        <el-alert
          v-if="selectedJob.bestParameters"
          type="success"
          :closable="false"
          style="margin-top: 1rem;">
          <template #default>
            <pre class="parameters-display">{{ formatJson(selectedJob.bestParameters) }}</pre>
          </template>
        </el-alert>
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
      this.selectedJob = job;
      await this.loadTopPerformers(job.id);
    },

    async loadTopPerformers(jobId: number) {
      this.loadingTopPerformers = true;
      try {
        const res = await ApiService.vueInstance.axios.get(
          `/api/app/optimization-job/${jobId}/top-performers?count=10`
        );

        const data = res.data;
        if (Array.isArray(data)) {
          this.topPerformers = data;
        } else {
          this.topPerformers = [];
        }

      } catch (error) {
        console.error("Failed to load top performers", error);
      } finally {
        this.loadingTopPerformers = false;
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
      if (value === null || value === undefined) return "—";
      return value.toFixed(2);
    },

    formatPercentage(value: number | null | undefined): string {
      if (value === null || value === undefined) return "—";
      return `${(value * 100).toFixed(2)}%`;
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
.page-container {
  padding: 2rem 3rem;
  max-width: 100%;
  background: var(--color-background);
  min-height: 100vh;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
}

.jobs-card,
.details-card {
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
}

.jobs-table {
  margin-bottom: 1rem;
}

.jobs-table :deep(.el-table__row) {
  cursor: pointer;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.metric-value {
  font-weight: 500;
}

.metric-value.return-positive {
  color: #e74c3c;
}

.metric-value.return-negative {
  color: #3498db;
}

.empty-value {
  color: var(--color-text-secondary);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface-variant);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--color-border-subtle);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
}

.stat-value.success {
  color: #27ae60;
}

.stat-value.danger {
  color: #e74c3c;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.performers-table {
  margin-top: 1rem;
}

.expanded-content {
  padding: 1rem;
  background: var(--color-surface-variant);
}

.expanded-content pre {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text);
}

.parameters-display {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1.5rem 1rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>
