// src/components/statements/index.tsx
// Balance Sheet, Cash Flow Statement, P&L — all derived from transactions

import { useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { computeMonthlySummaries } from "../../utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const fmt  = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtS = (n: number) => `${n >= 0 ? "+" : "−"}₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const TT = { contentStyle: { background:"#0f172a", border:"1px solid #334155", borderRadius:10, fontSize:13, color:"#f1f5f9" } };

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background:"#1a1f2e", borderRadius:16, padding:24, marginBottom:20 }}>
    <div style={{ fontWeight:800, fontSize:16, color:"#f1f5f9", marginBottom:20, paddingBottom:12, borderBottom:"1px solid #1e293b" }}>{title}</div>
    {children}
  </div>
);

const Row = ({ label, value, color, bold, indent }: { label: string; value: number; color?: string; bold?: boolean; indent?: boolean }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #0f172a" }}>
    <span style={{ fontSize:14, color: bold ? "#f1f5f9" : "#94a3b8", fontWeight: bold ? 700 : 400, paddingLeft: indent ? 16 : 0 }}>{label}</span>
    <span style={{ fontSize:14, fontWeight: bold ? 800 : 600, color: color ?? (value >= 0 ? "#22c55e" : "#f43f5e") }}>{fmt(value)}</span>
  </div>
);

const Divider = () => <div style={{ borderTop:"2px solid #334155", margin:"8px 0" }}/>;

// ─── Balance Sheet ────────────────────────────────────────────────────────────
// Assets = total cash received (income) - total spent (expenses) = net balance
// Investments = money sent to Zerodha/brokers (classified as Investment expense)

const BalanceSheet = () => {
  const { transactions } = useAppContext();

  const { cashBalance, totalInvested, totalIncome, totalExpense, latestBalance } = useMemo(() => {
    const totalIncome  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const totalInvested = transactions.filter(t => t.type === "expense" && t.category === "Investment").reduce((s, t) => s + t.amount, 0);
    const cashBalance  = totalIncome - totalExpense;
    // Latest balance = cash on hand (non-investment expenses subtracted)
    const nonInvestExpense = totalExpense - totalInvested;
    const latestBalance = totalIncome - nonInvestExpense;
    return { cashBalance, totalInvested, totalIncome, totalExpense, latestBalance };
  }, [transactions]);

  return (
    <Card title="📊 Balance Sheet">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Assets */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Assets</div>
          <Row label="Cash & Bank Balance" value={latestBalance} color="#22c55e"/>
          <Row label="Investments (Zerodha etc.)" value={totalInvested} color="#6366f1"/>
          <Divider/>
          <Row label="Total Assets" value={latestBalance + totalInvested} bold color="#22c55e"/>
        </div>
        {/* Summary */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#f43f5e", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Summary</div>
          <Row label="Total Income Received" value={totalIncome} color="#22c55e"/>
          <Row label="Total Spent" value={totalExpense} color="#f43f5e"/>
          <Divider/>
          <Row label="Net Position" value={cashBalance} bold/>
        </div>
      </div>
    </Card>
  );
};

// ─── P&L Statement ────────────────────────────────────────────────────────────
// Shows income vs expense by category, and net profit/loss per month

const PnL = () => {
  const { transactions } = useAppContext();

  const { byCategory, monthlySummaries, netPnL } = useMemo(() => {
    // Group income by category
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === "income") {
        incomeMap.set(t.category, (incomeMap.get(t.category) ?? 0) + t.amount);
        totalIncome += t.amount;
      } else {
        expenseMap.set(t.category, (expenseMap.get(t.category) ?? 0) + t.amount);
        totalExpense += t.amount;
      }
    }

    const byCategory = {
      income:  Array.from(incomeMap.entries()).sort((a,b) => b[1]-a[1]).map(([cat, val]) => ({ cat, val })),
      expense: Array.from(expenseMap.entries()).sort((a,b) => b[1]-a[1]).map(([cat, val]) => ({ cat, val })),
      totalIncome, totalExpense,
    };

    const monthlySummaries = computeMonthlySummaries(transactions).map(m => ({
      ...m, pnl: m.income - m.expense
    }));

    return { byCategory, monthlySummaries, netPnL: totalIncome - totalExpense };
  }, [transactions]);

  return (
    <Card title="📈 Profit & Loss Statement">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        {/* Income breakdown */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#22c55e", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Income Sources</div>
          {byCategory.income.map(({ cat, val }) => (
            <Row key={cat} label={cat} value={val} color="#22c55e" indent/>
          ))}
          <Divider/>
          <Row label="Total Income" value={byCategory.totalIncome} bold color="#22c55e"/>
        </div>
        {/* Expense breakdown */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#f43f5e", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Expenses</div>
          {byCategory.expense.map(({ cat, val }) => (
            <Row key={cat} label={cat} value={val} color="#f43f5e" indent/>
          ))}
          <Divider/>
          <Row label="Total Expenses" value={byCategory.totalExpense} bold color="#f43f5e"/>
        </div>
      </div>

      <Divider/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0" }}>
        <span style={{ fontSize:16, fontWeight:800, color:"#f1f5f9" }}>Net P&L</span>
        <span style={{ fontSize:20, fontWeight:800, color: netPnL >= 0 ? "#22c55e" : "#f43f5e" }}>{fmtS(netPnL)}</span>
      </div>

      {/* Monthly P&L Chart */}
      <div style={{ marginTop:24 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:12 }}>Monthly Net P&L</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlySummaries}>
            <XAxis dataKey="label" stroke="#334155" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis stroke="#334155" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`}/>
            <Tooltip {...TT} formatter={(v: number) => fmt(v)}/>
            <Bar dataKey="pnl" name="Net P&L" radius={[6,6,0,0]}
              fill="#6366f1"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// ─── Cash Flow Statement ──────────────────────────────────────────────────────
// Operating: day-to-day income/expenses (excluding investments)
// Investing:  money moved to/from investments

const CashFlow = () => {
  const { transactions } = useAppContext();

  const { operating, investing, monthlyCashFlow, netCashFlow } = useMemo(() => {
    const operatingIncome  = transactions.filter(t => t.type === "income" && t.category !== "Investment").reduce((s,t) => s+t.amount, 0);
    const operatingExpense = transactions.filter(t => t.type === "expense" && t.category !== "Investment").reduce((s,t) => s+t.amount, 0);
    const investingOut     = transactions.filter(t => t.type === "expense" && t.category === "Investment").reduce((s,t) => s+t.amount, 0);
    const investingIn      = transactions.filter(t => t.type === "income"  && t.category === "Investment").reduce((s,t) => s+t.amount, 0);

    const operating = { income: operatingIncome, expense: operatingExpense, net: operatingIncome - operatingExpense };
    const investing = { inflow: investingIn, outflow: investingOut, net: investingIn - investingOut };

    const monthlyCashFlow = computeMonthlySummaries(transactions).map(m => ({
      ...m,
      cumulative: 0, // filled below
    }));

    // Cumulative running balance — prefix sum algorithm O(n)
    let running = 0;
    for (const m of monthlyCashFlow) {
      running += m.net;
      m.cumulative = running;
    }

    return { operating, investing, monthlyCashFlow, netCashFlow: operating.net + investing.net };
  }, [transactions]);

  return (
    <Card title="💸 Cash Flow Statement">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        {/* Operating */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#14b8a6", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Operating Activities</div>
          <Row label="Income (non-investment)" value={operating.income}  color="#22c55e" indent/>
          <Row label="Expenses (non-investment)" value={operating.expense} color="#f43f5e" indent/>
          <Divider/>
          <Row label="Net Operating Cash Flow" value={operating.net} bold/>
        </div>
        {/* Investing */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Investing Activities</div>
          <Row label="Investment Returns" value={investing.inflow}  color="#22c55e" indent/>
          <Row label="Invested (Zerodha etc.)" value={investing.outflow} color="#f43f5e" indent/>
          <Divider/>
          <Row label="Net Investing Cash Flow" value={investing.net} bold/>
        </div>
      </div>

      <Divider/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", marginBottom:20 }}>
        <span style={{ fontSize:16, fontWeight:800, color:"#f1f5f9" }}>Net Cash Flow</span>
        <span style={{ fontSize:20, fontWeight:800, color: netCashFlow >= 0 ? "#22c55e" : "#f43f5e" }}>{fmtS(netCashFlow)}</span>
      </div>

      {/* Cumulative balance line chart */}
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:12 }}>Cumulative Balance Over Time</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={monthlyCashFlow}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="4 4"/>
            <XAxis dataKey="label" stroke="#334155" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis stroke="#334155" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`}/>
            <Tooltip {...TT} formatter={(v: number) => fmt(v)}/>
            <Line type="monotone" dataKey="cumulative" stroke="#14b8a6" strokeWidth={2.5} dot={{ fill:"#14b8a6", r:4 }} name="Balance"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// ─── Statements Page ──────────────────────────────────────────────────────────
export const StatementsPage = () => (
  <div>
    <BalanceSheet/>
    <PnL/>
    <CashFlow/>
  </div>
);
