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
import { formatStockPrice, currencyLabel } from '@/core/services/stockCurrency';
import VChart from 'vue-echarts';
import {
  formatChartAxisDateLabel,
  formatChartCalendarDate,
  isMultiYearSeries,
  shouldShowYearTick,
  useChartTheme,
} from './composables/useChartTheme';

interface Props {
  data: any[];
  title?: string;
  height?: number;
  showDataZoom?: boolean;
  color?: string;
  priceCurrency?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 400,
  showDataZoom: true,
  color: '#1976d2',
});

const { baseOptions, areaSeriesDefaults, colors, isDark } = useChartTheme();

const chartOption = computed(() => {
  if (!props.data || props.data.length < 2) {
    return {};
  }

  const headers = props.data[0];
  const dataPoints = props.data.slice(1);

  const dates = dataPoints.map(row => formatChartCalendarDate(row[0]));
  const values = dataPoints.map(row => row[1]);
  const showYearLabels = isMultiYearSeries(dates);
  const movingAverageColor = isDark.value ? '#c4b5fd' : '#6d28d9';

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
    legend: headers.length > 2 ? { top: 0, textStyle: { color: colors.text } } : undefined,
    tooltip: {
      ...baseOptions.value.tooltip,
      formatter: headers.length > 2 || props.priceCurrency !== undefined ? undefined : baseOptions.value.tooltip.formatter,
      valueFormatter: (value: unknown) => props.priceCurrency !== undefined ? formatStockPrice(value, props.priceCurrency) : typeof value === 'number' && Number.isFinite(value)
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
    },
    xAxis: {
      ...baseOptions.value.xAxis,
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: {
        ...baseOptions.value.xAxis.axisLabel,
        formatter: (value: unknown) => formatChartAxisDateLabel(value, showYearLabels),
        interval: showYearLabels ? (index: number) => shouldShowYearTick(dates, index) : 'auto',
        hideOverlap: true,
      },
    },
    yAxis: {
      ...baseOptions.value.yAxis,
      name: props.priceCurrency !== undefined ? currencyLabel(props.priceCurrency) : undefined,
      scale: true,
    },
    series: [
      {
        ...areaSeriesDefaults,
        name: headers[1],
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
      ...headers.slice(2).map((name: string, index: number) => ({
        type: 'line',
        name,
        data: dataPoints.map(row => row[index + 2]),
        smooth: false,
        showSymbol: false,
        connectNulls: false,
        lineStyle: { width: 2, color: movingAverageColor, type: 'dashed' },
        itemStyle: { color: movingAverageColor },
      })),
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
