<template>
  <div class="filter-bar">
    <slot name="left">
      <el-dropdown v-if="showAllFilter" class="filter-dropdown">
        <button class="filter-btn">
          All <el-icon class="ml-1"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>All</el-dropdown-item>
            <slot name="dropdown-items"></slot>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </slot>

    <div class="flex-1"></div>

    <slot name="right">
      <button v-if="showDateRange" class="filter-btn">
        <el-icon><Calendar /></el-icon>
        Date Range
      </button>

      <button v-if="showFilter" class="filter-btn">
        <el-icon><Filter /></el-icon>
        Filter
      </button>

      <button v-if="showAddColumn" class="filter-btn">
        <el-icon><Plus /></el-icon>
        Add new column
      </button>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ArrowDown, Calendar, Filter, Plus } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'FilterBar',
  components: {
    ArrowDown,
    Calendar,
    Filter,
    Plus
  },
  props: {
    showAllFilter: {
      type: Boolean,
      default: true
    },
    showDateRange: {
      type: Boolean,
      default: true
    },
    showFilter: {
      type: Boolean,
      default: true
    },
    showAddColumn: {
      type: Boolean,
      default: true
    }
  }
});
</script>

<style scoped>
.ml-1 {
  margin-left: 0.25rem;
}

.flex-1 {
  flex: 1;
}

.filter-dropdown {
  background: transparent;
  border: none;
}
</style>
