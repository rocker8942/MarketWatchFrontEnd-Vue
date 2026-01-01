<template>
  <span :class="['status-badge', variant]">
    {{ label }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'StatusBadge',
  props: {
    status: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
      default: '',
      validator: (value: string) => {
        return ['', 'active', 'pending', 'cancelled', 'delay', 'success', 'error', 'info'].includes(value);
      }
    }
  },
  computed: {
    label(): string {
      // Capitalize first letter
      return this.status.charAt(0).toUpperCase() + this.status.slice(1);
    }
  }
});
</script>

<style scoped>
/* Status badges inherit from main.css global styles */
</style>
