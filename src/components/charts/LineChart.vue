<template>
  <div class="line-chart-container">
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
  smooth?: boolean;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 320,
  showDataZoom: false,
  smooth: true,
  color: '#1976d2',
});

const { baseOptions, lineSeriesDefaults, colors } = useChartTheme();

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
    xAxis: {
      ...baseOptions.value.xAxis,
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      ...baseOptions.value.yAxis,
      scale: true,
      min: (value: any) => {
        const range = value.max - value.min;
        return value.min - range * 0.05;
      },
      max: (value: any) => {
        const range = value.max - value.min;
        return value.max + range * 0.05;
      },
    },
    series: [
      {
        ...lineSeriesDefaults,
        data: values,
        smooth: props.smooth,
        color: props.color,
        lineStyle: {
          width: 2,
          color: props.color,
        },
        itemStyle: {
          color: props.color,
          borderColor: props.color,
        },
        areaStyle: undefined,
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
        height: 20,
        bottom: 10,
        borderColor: colors.border,
        fillerColor: 'rgba(25, 118, 210, 0.1)',
        handleStyle: {
          color: colors.primary,
        },
        textStyle: {
          color: colors.textSecondary,
        },
      },
    ] : undefined,
  };
});
</script>

<style scoped>
.line-chart-container {
  width: 100%;
  min-height: 300px;
}
</style>
