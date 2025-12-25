import { computed } from 'vue';

const chartTooltipNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatChartDateLabel(value: unknown): string {
  // ECharts category axis can provide Date objects (from our API DTOs) or strings.
  const date = value instanceof Date ? value : new Date(value as any);
  if (!Number.isFinite(date.getTime())) {
    return String(value ?? '');
  }

  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function formatChartTooltipDateLabel(value: unknown): string {
  const date = value instanceof Date ? value : new Date(value as any);
  if (!Number.isFinite(date.getTime())) {
    return String(value ?? '');
  }

  // Tooltip should be a simple date only (no time/timezone).
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

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
      formatter: (params: any) => {
        const items = Array.isArray(params) ? params : [params];
        if (!items.length) return '';

        const first = items[0];
        const dateLabel = formatChartTooltipDateLabel(first.axisValue ?? first.name);
        const rawValue = first.value;
        const value = Array.isArray(rawValue) ? rawValue[1] : rawValue;
        const valueLabel = typeof value === 'number'
          ? chartTooltipNumberFormatter.format(value)
          : String(value ?? '');

        return `<div style="display:flex;justify-content:space-between;gap:24px;min-width:180px">
          <span>${dateLabel}</span>
          <span style="font-weight:600">${valueLabel}</span>
        </div>`;
      },
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
        formatter: (value: unknown) => formatChartDateLabel(value),
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
        formatter: (value: unknown) => {
          const numericValue = typeof value === 'number'
            ? value
            : (typeof value === 'string' ? Number(value) : NaN);

          return Number.isFinite(numericValue)
            ? chartTooltipNumberFormatter.format(numericValue)
            : String(value ?? '');
        },
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
    // The dots are ECharts "symbols" drawn at each data point.
    // Disable by default to keep dashboard charts clean.
    showSymbol: false,
    symbol: 'none',
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
