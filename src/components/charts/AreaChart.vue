<template>
  <div class="area-chart-container">
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
  title?: string;
  height?: number;
  showDataZoom?: boolean;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 400,
  showDataZoom: true,
  color: '#1976d2',
});

const { baseOptions, areaSeriesDefaults, colors } = useChartTheme();

const chartOption = computed(() => {
  if (!props.data || props.data.length < 2) {
    return {};
  }

  const headers = props.data[0];
  const dataPoints = props.data.slice(1);

  const dates = dataPoints.map(row => row[0]);
  const values = dataPoints.map(row => row[1]);

  return {
    ...baseOptions.value,
    title: props.title ? {
      text: props.title,
      left: 'center',
      textStyle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 500,
      },
    } : undefined,
    grid: {
      ...baseOptions.value.grid,
      bottom: props.showDataZoom ? '15%' : '10%',
    },
    xAxis: {
      ...baseOptions.value.xAxis,
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      ...baseOptions.value.yAxis,
      scale: true,
    },
    series: [
      {
        ...areaSeriesDefaults,
        data: values,
        color: props.color,
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
                color: props.color,
              },
              {
                offset: 1,
                color: 'rgba(25, 118, 210, 0.05)',
              },
            ],
          },
        },
      },
    ],
    dataZoom: props.showDataZoom ? [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 24,
        bottom: 10,
        borderColor: colors.border,
        fillerColor: 'rgba(25, 118, 210, 0.1)',
        handleStyle: {
          color: colors.primary,
        },
        textStyle: {
          color: colors.textSecondary,
          fontSize: 11,
        },
        dataBackground: {
          lineStyle: {
            color: colors.border,
          },
          areaStyle: {
            color: 'rgba(25, 118, 210, 0.05)',
          },
        },
      },
    ] : undefined,
  };
});
</script>

<style scoped>
.area-chart-container {
  width: 100%;
  min-height: 300px;
}
</style>
