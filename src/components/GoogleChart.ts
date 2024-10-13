import { defineComponent, h, type PropType } from "vue";
import { GChart } from "vue-google-charts";

export const type = "LineChart";

export default defineComponent({
  name: "GoogleChart",
  components: {
    GChart,
  },
  props: {
    data: {
      type: Array as PropType<Array<Array<string | number>>>,
      required: true,
    },
    width: Number,
    height: Number,
    title: String,
  },
  setup(props) { 

    const options = {
      title: props.title,
      curveType: "function",
      legend: { position: "bottom" },
      width: props.width,
      height: props.height,
    };

    return () =>
      h(GChart, {
      data: props.data,
      options,
      type,
      });
  },
});
