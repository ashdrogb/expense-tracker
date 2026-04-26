import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { Header, PageWrapper } from "./components/layout";
import { StatCard } from "./components/ui";
import { MonthlyBarChart, CategoryPieChart, NetLineChart } from "./components/charts";
import { TransactionList, TransactionForm } from "./components/transactions";
import { CSVImport } from "./components/csv";
import { AuthPage } from "./components/auth";
import { useFinancials } from "./hooks";
import type { ActiveView } from "./types";

type ExtendedView = ActiveView | "import";

const DashboardView = ({ onNavigateToAdd }: { onNavigateToAdd: () => void }) => {
  const { summary, monthlySummaries, expenseBreakdown } = useFinancials();
  return (
    <PageWrapper title="Dashboard" subtitle="Your financial snapshot">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:24 }}>
        <StatCard label="Total Income"   value={summary.totalIncome}  icon="📈" color="#22c55e"/>
        <StatCard label="Total Expenses" value={summary.totalExpense} icon="📉" color="#f43f5e"/>
        <StatCard label="Net Balance"    value={summary.balance}      icon="💰" color={summary.balance>=0?"#6366f1":"#f43f5e"}/>
        <StatCard label="Savings Rate"   value={summary.savingsRate}  icon="🎯" color="#eab308" formatter={n=>`${n}%`}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14 }}>
        <MonthlyBarChart data={monthlySummaries}/>
        <CategoryPieChart data={expenseBreakdown} title="🍩 Expense Split"/>
      </div>
      <div style={{ marginBottom:24 }}><NetLineChart data={monthlySummaries}/></div>
      <div style={{ background:"#1a1f2e", borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", borderBottom:"1px solid #1e293b" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#94a3b8" }}>🕐 Recent Transactions</div>
          <button onClick={onNavigateToAdd} style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:12 }}>➕ Add New</button>
        </div>
        <TransactionList limit={5} onNavigateToAdd={onNavigateToAdd}/>
      </div>
    </PageWrapper>
  );
};

const AddView    = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
  <PageWrapper title="New Transaction" subtitle="Record an income or expense">
    <TransactionForm onSuccess={onSuccess} onCancel={onCancel}/>
  </PageWrapper>
);

const HistoryView = ({ onNavigateToAdd }: { onNavigateToAdd: () => void }) => (
  <PageWrapper title="Transaction History" subtitle="Search, filter and sort all your records">
    <TransactionList onNavigateToAdd={onNavigateToAdd}/>
  </PageWrapper>
);

const ImportView = ({ onDone }: { onDone: () => void }) => (
  <PageWrapper title="Import Bank CSV" subtitle="Bulk import transactions from your bank statement">
    <CSVImport onDone={onDone}/>
  </PageWrapper>
);

const AppShell = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ExtendedView>("dashboard");

  return (
    <AppProvider isLoggedIn={!!user}>
      <div style={{ minHeight:"100vh", background:"#0f172a", color:"#f1f5f9", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
        <Header
          activeView={activeView}
          onNavigate={setActiveView}
          userEmail={user?.email}
          onLogout={logout}
        />
        {activeView==="dashboard" && <DashboardView onNavigateToAdd={()=>setActiveView("add")}/>}
        {activeView==="add"       && <AddView onSuccess={()=>setActiveView("dashboard")} onCancel={()=>setActiveView("dashboard")}/>}
        {activeView==="history"   && <HistoryView onNavigateToAdd={()=>setActiveView("add")}/>}
        {activeView==="import"    && <ImportView onDone={()=>setActiveView("dashboard")}/>}
      </div>
    </AppProvider>
  );
};

const Root = () => {
  const { user } = useAuth();
  return user ? <AppShell /> : <AuthPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
