import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import type { MonthlySummary, CategoryBreakdown } from "../../types";
import { CHART_COLORS } from "../../constants";
import { fmt } from "../../utils";

// ─── Shared Tooltip Style ─────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    background: "#0f172a", border: "1px solid #334155",
    borderRadius: 10, fontSize: 13, color: "#f1f5f9",
  },
};

// ─── MonthlyBarChart ──────────────────────────────────────────────────────────

interface MonthlyBarChartProps {
  data: MonthlySummary[];
  height?: number;
}

export const MonthlyBarChart = ({ data, height = 240 }: MonthlyBarChartProps) => (
  <div style={{ background: "#1a1f2e", borderRadius: 16, padding: "20px 16px 8px" }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 16, paddingLeft: 4 }}>
      📅 Monthly Overview
    </div>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <XAxis dataKey="label" stroke="#334155" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
        <Bar dataKey="income"  fill="#22c55e" radius={[6,6,0,0]} name="Income" />
        <Bar dataKey="expense" fill="#f43f5e" radius={[6,6,0,0]} name="Expense" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ─── NetLineChart ─────────────────────────────────────────────────────────────

interface NetLineChartProps {
  data: MonthlySummary[];
  height?: number;
}

export const NetLineChart = ({ data, height = 180 }: NetLineChartProps) => (
  <div style={{ background: "#1a1f2e", borderRadius: 16, padding: "20px 16px 8px" }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 16, paddingLeft: 4 }}>
      📈 Net Savings Trend
    </div>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
        <XAxis dataKey="label" stroke="#334155" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#334155" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => fmt(v)} />
        <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

// ─── CategoryPieChart ─────────────────────────────────────────────────────────

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
  title?: string;
  height?: number;
}

const renderLabel = ({ name, percent }: { name: string; percent: number }) =>
  percent > 0.06 ? `${name} ${Math.round(percent * 100)}%` : "";

export const CategoryPieChart = ({ data, title = "🍩 By Category", height = 240 }: CategoryPieChartProps) => (
  <div style={{ background: "#1a1f2e", borderRadius: 16, padding: "20px 16px 8px" }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 16, paddingLeft: 4 }}>
      {title}
    </div>
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
            dataKey="total" nameKey="category"
            label={renderLabel} labelLine={false}
          >
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number, _: string, props: any) =>
              [`${fmt(v)} (${props.payload.percentage}%)`, props.payload.category]
            }
          />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>No data</div>
    )}
  </div>
);
