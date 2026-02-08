import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import {
  LineChart,
  BarChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  ToolboxComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';

// Register the required components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  ToolboxComponent,
  TitleComponent,
  LegendComponent,
]);
