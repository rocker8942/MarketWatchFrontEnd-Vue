<template>
  <div class="data-workspace fund-workspace">
    <PageHeader title="Fund Strategy" />

    <dl class="fund-summary" aria-label="Fund strategy summary">
      <div>
        <dt>Strategies</dt>
        <dd>{{ pagedResultDtoOfStrategyDto.totalCount || 0 }}</dd>
      </div>
      <div>
        <dt>Average annual return</dt>
        <dd :class="getRateClass(averageAnnualReturn)">{{ formatReturn(averageAnnualReturn) }}</dd>
      </div>
      <div>
        <dt>Best annual performer</dt>
        <dd>{{ bestPerformer }}</dd>
      </div>
      <div>
        <dt>Top period return</dt>
        <dd :class="getRateClass(maxPeriodReturn)">{{ formatReturn(maxPeriodReturn) }}</dd>
      </div>
    </dl>

    <el-table
      :data="pagedResultDtoOfStrategyDto.items"
      row-key="id"
      class="compact-table"
      stripe
      size="small">
      <el-table-column width="42" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            title="Strategy details"
            :aria-label="'Details for ' + (row.name || row.id)"
            @click="openDetails(row)">…</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Strategy" min-width="170" show-overflow-tooltip />
      <el-table-column prop="ratePerYear" label="Annual return" min-width="112" align="right" sortable>
        <template #default="{ row }">
          <span :class="getRateClass(row.ratePerYear)">{{ formatReturn(row.ratePerYear) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ratePerInvesmentPeriod" label="Period return" min-width="112" align="right" sortable>
        <template #default="{ row }">
          <span :class="getRateClass(row.ratePerInvesmentPeriod)">{{ formatReturn(row.ratePerInvesmentPeriod) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="countryToInvest" label="Market" min-width="82" />
      <el-table-column prop="daysToTest" label="Test period" min-width="95" align="right">
        <template #default="{ row }">{{ row.daysToTest == null ? '—' : row.daysToTest + ' days' }}</template>
      </el-table-column>
      <el-table-column label="Status" min-width="92">
        <template #default="{ row }">
          {{ row.disabled ? 'Disabled' : row.inUse ? 'In use' : 'Idle' }}
        </template>
      </el-table-column>
      <el-table-column label="Edit" width="60" align="center">
        <template #default="{ row }">
          <el-button type="primary" link :aria-label="'Edit ' + (row.name || row.id)" @click="openEditDialog(row)">Edit</el-button>
        </template>
      </el-table-column>
    </el-table>

    <details class="fund-disclaimer">
      <summary>Investment disclaimer</summary>
      <p>Past performance is not indicative of future results. All investments carry risk, and investors should carefully consider their investment objectives and risk tolerance before making any investment decisions. The data presented is for informational purposes only and should not be considered as investment advice.</p>
    </details>

    <el-dialog v-model="detailsVisible" title="Fund strategy details" width="min(600px, calc(100vw - 24px))">
      <dl v-if="detailStrategy" class="fund-details">
        <div v-for="[label, value] in strategyDetails(detailStrategy)" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value ?? '—' }}</dd>
        </div>
      </dl>
    </el-dialog>

    <!-- Edit Strategy Dialog -->
    <el-dialog v-model="editDialogVisible" title="Edit Strategy" width="min(600px, calc(100vw - 24px))">
      <el-form :model="editForm" label-width="160px" label-position="left">
        <el-form-item label="Name">
          <el-input v-model="editForm.name" placeholder="Strategy name" />
        </el-form-item>
        <el-form-item label="Country">
          <el-input v-model="editForm.countryToInvest" placeholder="Country to invest" />
        </el-form-item>
        <el-form-item label="Trigger Rate">
          <el-input-number v-model="editForm.investTriggerRate" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="Analysis Period">
          <el-input-number v-model="editForm.analysisPeriod" :min="1" />
        </el-form-item>
        <el-form-item label="Portfolio Number">
          <el-input-number v-model="editForm.portfolioNumber" :min="1" />
        </el-form-item>
        <el-form-item label="Price To Use">
          <el-select v-model="editForm.priceToUse" placeholder="Select price type">
            <el-option :value="0" label="Close to Close" />
            <el-option :value="1" label="Open to Open" />
            <el-option :value="2" label="High to High" />
            <el-option :value="3" label="Low to Low" />
            <el-option :value="4" label="Open to Close" />
            <el-option :value="5" label="Close to Open" />
          </el-select>
        </el-form-item>
        <el-form-item label="Loss Cut Rate">
          <el-input-number v-model="editForm.lossCutRate" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="Days To Test">
          <el-input-number v-model="editForm.daysToTest" :min="1" />
        </el-form-item>
        <el-form-item label="Coefficient Allowed">
          <el-input-number v-model="editForm.coefficientAllowed" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="In Use">
          <el-input-number v-model="editForm.inUse" :min="0" :max="1" />
        </el-form-item>
        <el-form-item label="Disabled">
          <el-switch v-model="editForm.disabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveStrategy">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.fund-workspace {
  min-width: 0;
}

.fund-summary,
.fund-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0 0 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-variant);
  border-radius: 6px;
}

.fund-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 128px), 1fr));
  margin: 0;
  border: 0;
  border-radius: 0;
}

.fund-summary dt,
.fund-details dt {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.fund-summary dd,
.fund-details dd {
  margin: 0;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.fund-summary dd {
  font-weight: 600;
}

.fund-workspace .positive {
  color: var(--data-gain, var(--finance-green));
}

.fund-workspace .negative {
  color: var(--data-loss, var(--finance-red));
}

.fund-disclaimer {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.fund-disclaimer summary {
  cursor: pointer;
}

.fund-disclaimer p {
  max-width: 74ch;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import ApiService from "@/core/services/apiService";
import PageHeader from "@/components/PageHeader.vue";

export default defineComponent({
  components: {
    PageHeader
  },

  data() {
    return {
      // Backend: tblFundStrategy
      pagedResultDtoOfStrategyDto: { items: [], totalCount: 0 } as any,
      detailStrategy: null as any,
      detailsVisible: false,
      editDialogVisible: false,
      editForm: {
        id: 0,
        name: '',
        countryToInvest: '',
        investTriggerRate: 0,
        analysisPeriod: 0,
        portfolioNumber: 0,
        priceToUse: 0,
        lossCutRate: 0,
        daysToTest: 0,
        coefficientAllowed: 0,
        inUse: 0,
        disabled: false,
      } as any,
    };
  },

  computed: {
    rankedAnnualStrategies(): any[] {
      return (this.pagedResultDtoOfStrategyDto.items || [])
        .filter(item => Number.isFinite(item.ratePerYear))
        .sort((a, b) => b.ratePerYear - a.ratePerYear);
    },

    averageAnnualReturn(): number | undefined {
      const rates = this.rankedAnnualStrategies;
      if (!rates.length) return undefined;
      return rates.reduce((sum, item) => sum + item.ratePerYear, 0) / rates.length;
    },

    bestPerformer(): string {
      const best = this.rankedAnnualStrategies[0];
      return best?.name || best?.countryToInvest || '—';
    },

    maxPeriodReturn(): number | undefined {
      const rates = (this.pagedResultDtoOfStrategyDto.items || [])
        .map(item => item.ratePerInvesmentPeriod)
        .filter(Number.isFinite);
      return rates.length ? Math.max(...rates) : undefined;
    }
  },

  methods: {
    async getList() {
      try {
        const res = await ApiService.vueInstance.axios.get(
          `/api/app/fund-strategy?SkipCount=0&MaxResultCount=100`
        );

        const data = res.data;
        // ABP list responses are usually { items, totalCount }
        if (Array.isArray(data)) {
          this.pagedResultDtoOfStrategyDto = { items: data, totalCount: data.length };
        } else {
          this.pagedResultDtoOfStrategyDto = data;
          if (!this.pagedResultDtoOfStrategyDto.items && Array.isArray(data?.result)) {
            this.pagedResultDtoOfStrategyDto = { items: data.result, totalCount: data.result.length };
          }
        }
      } catch (error) {
        console.error("Failed to load tblFundStrategy", error);
        this.pagedResultDtoOfStrategyDto = { items: [], totalCount: 0 };
      }
    },

    formatReturn(rate: number | undefined): string {
      if (rate === undefined || !Number.isFinite(rate)) return '—';
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero',
      }).format(rate) + '%';
    },

    openDetails(row: any) {
      this.detailStrategy = row;
      this.detailsVisible = true;
    },

    strategyDetails(row: any): Array<[string, string | number | undefined]> {
      return [
        ['Strategy', row.name],
        ['Strategy ID', row.id],
        ['Market', row.countryToInvest],
        ['In use', row.inUse == null ? undefined : row.inUse ? 'Yes' : 'No'],
        ['Disabled', row.disabled == null ? undefined : row.disabled ? 'Yes' : 'No'],
        ['Trigger rate', row.investTriggerRate],
        ['Analysis period', row.analysisPeriod == null ? undefined : row.analysisPeriod + ' days'],
        ['Portfolio size', row.portfolioNumber],
        ['Price basis', this.getPriceTypeName(row.priceToUse)],
        ['Loss cut', row.lossCutRate],
        ['Invest date', this.formatDate(row.investDate)],
        ['Start date', this.formatDate(row.investStartDate)],
        ['Standard deviation', row.std],
        ['Coefficient threshold', row.coefficientAllowed],
        ['Created', this.formatDate(row.createdAt)],
      ];
    },

    formatDate(value: Date | string | undefined): string {
      if (!value) return '—';
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleString();
    },

    getRateClass(rate: number | undefined): string {
      if (!rate) return '';
      return rate >= 0 ? 'positive' : 'negative';
    },

    getPriceTypeName(priceType: number | undefined): string {
      if (priceType === undefined || priceType === null) return '—';
      const priceTypes: Record<number, string> = {
        0: 'Close to Close',
        1: 'Open to Open',
        2: 'High to High',
        3: 'Low to Low',
        4: 'Open to Close',
        5: 'Close to Open'
      };
      return priceTypes[priceType] || String(priceType);
    },

    openEditDialog(row: any) {
      // Deep copy the row data to the edit form
      this.editForm = { ...row };
      this.editDialogVisible = true;
    },

    async saveStrategy() {
      try {
        // Call the backend API to update the strategy
        await ApiService.vueInstance.axios.put(
          `/api/app/fund-strategy/${this.editForm.id}`,
          this.editForm
        );

        // Refresh the list after saving
        await this.getList();

        // Close the dialog
        this.editDialogVisible = false;

        // Show success message
        (this as any).$message.success('Strategy updated successfully');
      } catch (error) {
        console.error("Failed to update strategy", error);
        (this as any).$message.error('Failed to update strategy');
      }
    }
  },

  mounted() {
    this.getList();
  },
});
</script>
