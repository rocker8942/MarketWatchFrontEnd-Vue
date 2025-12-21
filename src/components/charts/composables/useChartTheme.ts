import { computed } from 'vue';

export function useChartTheme() {
  const isDark = computed(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const colors = {
    primary: '#1976d2',
    success: '#4caf50',
    error: '#ef5350',
    text: isDark.value ? '#e3e8ef' : '#0f172a',
    textSecondary: isDark.value ? '#94a3b8' : '#475569',
    border: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(148, 163, 184, 0.2)',
    background: isDark.value ? '#132f4c' : '#ffffff',
    gridLine: isDark.value ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6',
  };

  const baseOptions = computed(() => ({
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13,
      color: colors.text,
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10%',
      bottom: '10%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? 'rgba(19, 47, 76, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderWidth: 1,
      borderColor: colors.border,
      textStyle: {
        color: colors.text,
        fontSize: 13,
      },
      padding: 12,
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: colors.border,
          type: 'dashed',
        },
      },
    },
    xAxis: {
      type: 'category',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: colors.textSecondary,
        fontSize: 12,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: colors.textSecondary,
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: colors.gridLine,
          type: 'dashed',
        },
      },
    },
  }));

  const lineSeriesDefaults = {
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 2,
    },
    itemStyle: {
      borderWidth: 2,
    },
    emphasis: {
      scale: true,
      scaleSize: 10,
    },
  };

  const areaSeriesDefaults = {
    type: 'line',
    smooth: true,
    symbol: 'none',
    lineStyle: {
      width: 2,
    },
    areaStyle: {
      opacity: 0.3,
    },
  };

  return {
    isDark,
    colors,
    baseOptions,
    lineSeriesDefaults,
    areaSeriesDefaults,
  };
}
