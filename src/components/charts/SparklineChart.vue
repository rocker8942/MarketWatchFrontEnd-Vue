<template>
  <div class="sparkline-chart-container">
    <v-chart
      :option="chartOption"
      :style="{ height: height + 'px', width: '100%' }"
      autoresize
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { useChartTheme } from './composables/useChartTheme';

interface Props {
  data: any[];
  height?: number;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 60,
  color: '#1976d2',
});

const { colors } = useChartTheme();

const chartOption = computed(() => {
  if (!props.data || props.data.length < 2) {
    return {};
  }

  const dataPoints = props.data.slice(1);
  const values = dataPoints.map(row => row[1]);

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      show: false,
      scale: true,
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: props.color,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: props.color + '40',
              },
              {
                offset: 1,
                color: props.color + '00',
              },
            ],
          },
        },
      },
    ],
  };
});
</script>

<style scoped>
.sparkline-chart-container {
  width: 100%;
}
</style>
