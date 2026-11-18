import { describe, expect, it, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
vi.mock("@/core/services/apiService", () => ({ default: {} }));
import History from "./SimulateBacktestHistory.vue";

function renderSummary(details: Record<string, unknown>) {
  return shallowMount({ ...History, mounted() {} }, {
    data: () => ({ selectedStrategyId: 25997, selectedStrategyDetails: details, rows: [{}, {}] }),
    global: {
      stubs: {
        "el-card": { template: "<div><slot /></div>" },
        "el-table": true, "el-table-column": true, "el-select": true, "el-option": true,
        "el-button": true, "el-pagination": true, PageHeader: true,
      },
      directives: { loading: () => {} },
    },
  });
}

describe("backtest performance summary", () => {
  it("displays saved portfolio metrics without compounding overlapping trades", () => {
    const wrapper = renderSummary({
      strategyType: 6, ratePerInvesmentPeriod: 32.642, ratePerYear: 0.18,
      sharpeRatio: 0.64, maxDrawdown: 0.66, winRate: 0.43, std: 0.3057,
    });
    const text = wrapper.text();
    for (const value of ["3264.20%", "18.00%", "0.64", "66.00%", "43.00%", "30.57%", "Annualized Volatility"]) {
      expect(text).toContain(value);
    }
    wrapper.unmount();
  });

  it("preserves zero metrics and distinguishes trade volatility", () => {
    const wrapper = renderSummary({
      StrategyType: 1, RatePerInvesmentPeriod: 0, SharpeRatio: 0,
      MaxDrawdown: 0, WinRate: 0, Std: 0,
    });
    expect(wrapper.text()).toContain("Trade Return Volatility");
    expect(wrapper.text()).toContain("0.00%");
    expect(wrapper.text()).not.toContain("undefined");
    wrapper.unmount();
  });

  it("shows missing metrics as unavailable", () => {
    const wrapper = renderSummary({ strategyType: 6 });
    const values = wrapper.findAll(".metric-value").map(value => value.text());
    expect(values.slice(1, 7)).toEqual(["—", "—", "—", "—", "—", "—"]);
    wrapper.unmount();
  });
});
