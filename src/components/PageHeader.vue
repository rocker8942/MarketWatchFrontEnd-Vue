<template>
  <div class="page-header-wrapper">
    <div class="page-header-content">
      <div class="page-header-left">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>

      <div class="page-header-right">
        <el-input
          v-if="showSearch"
          v-model="searchQuery"
          class="header-search"
          :placeholder="searchPlaceholder"
          clearable
          @input="handleSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <slot name="actions">
          <el-button
            v-if="showNewButton"
            type="primary"
            class="new-button"
            @click="handleNew">
            {{ newButtonText }}
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'PageHeader',
  components: {
    Search
  },
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    showSearch: {
      type: Boolean,
      default: false
    },
    searchPlaceholder: {
      type: String,
      default: 'Search'
    },
    showNewButton: {
      type: Boolean,
      default: false
    },
    newButtonText: {
      type: String,
      default: 'New'
    }
  },
  emits: ['search', 'new'],
  setup(props, { emit }) {
    const searchQuery = ref('');

    const handleSearch = () => {
      emit('search', searchQuery.value);
    };

    const handleNew = () => {
      emit('new');
    };

    return {
      searchQuery,
      handleSearch,
      handleNew
    };
  }
});
</script>

<style scoped>
.page-header-wrapper {
  margin-bottom: 2rem;
}

.page-header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}

.page-header-left {
  flex: 1;
}

.page-header-left h1 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-search {
  width: 280px;
}

.header-search :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.header-search :deep(.el-input__wrapper:hover) {
  box-shadow: var(--shadow-sm);
}

.new-button {
  background: var(--color-heading);
  border-color: var(--color-heading);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  padding: 0.625rem 1.25rem;
}

.new-button:hover {
  background: var(--color-text);
  border-color: var(--color-text);
}

@media (max-width: 768px) {
  .page-header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .header-search {
    width: 100%;
  }

  .page-header-left h1 {
    font-size: 1.75rem;
  }
}
</style>
