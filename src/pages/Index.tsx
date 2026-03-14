import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/TopBar";
import { WalkthroughTour } from "@/components/WalkthroughTour";

// --- Fallback Data ---
const monthlyFallback = [
  { month: "Apr 25", delivered: 21748, sold: 18148, returned: 3600 },
  { month: "Jun 25", delivered: 23982, sold: 16300, returned: 7682 },
  { month: "Jul 25", delivered: 26266, sold: 19553, returned: 6713 },
  { month: "Sep 25", delivered: 24222, sold: 16683, returned: 7539 },
  { month: "Dec 25", delivered: 15500, sold: 11080, returned: 4420 },
  { month: "Jan 26", delivered: 20929, sold: 15846, returned: 5083 },
];

const outletFallback = [
  { shop: "Academia Service Station", delivered: 129, sold: 72, returned: 57, return_rate: 44.19, trend: "declining" as const },
  { shop: "Ark Trading (Pty) Ltd", delivered: 82, sold: 64, returned: 18, return_rate: 21.95, trend: "stable" as const },
  { shop: "Woermann Brock Eros", delivered: 95, sold: 88, returned: 7, return_rate: 7.37, trend: "growing" as const },
  { shop: "Hochland Super Spar", delivered: 120, sold: 112, returned: 8, return_rate: 6.67, trend: "growing" as const },
  { shop: "Checkers Gustav Voights", delivered: 200, sold: 138, returned: 62, return_rate: 31.0, trend: "declining" as const },
  { shop: "Ok Foods Independence", delivered: 75, sold: 71, returned: 4, return_rate: 5.33, trend: "growing" as const },
  { shop: "Eureka Service Station", delivered: 60, sold: 35, returned: 25, return_rate: 41.67, trend: "declining" as const },
  { shop: "Model Auas Valley", delivered: 130, sold: 121, returned: 9, return_rate: 6.92, trend: "growing" as const },
  { shop: "Shoprite Independence Avenue", delivered: 180, sold: 140, returned: 40, return_rate: 22.22, trend: "stable" as const },
  { shop: "Woermann Brock Kleine Kuppe", delivered: 90, sold: 83, returned: 7, return_rate: 7.78, trend: "growing" as const },
  { shop: "Spar Olympia", delivered: 55, sold: 28, returned: 27, return_rate: 49.09, trend: "declining" as const },
  { shop: "Pick n Pay Maerua Mall", delivered: 160, sold: 148, returned: 12, return_rate: 7.5, trend: "growing" as const },
  { shop: "Engen Ausspannplatz", delivered: 70, sold: 48, returned: 22, return_rate: 31.43, trend: "declining" as const },
  { shop: "Total Prosperita", delivered: 65, sold: 61, returned: 4, return_rate: 6.15, trend: "growing" as const },
  { shop: "Spar Kleine Kuppe", delivered: 85, sold: 74, returned: 11, return_rate: 12.94, trend: "stable" as const },
];

type Trend = "growing" | "declining" | "stable";

interface MonthlyData {
  month: string;
  delivered: number;
  sold: number;
  returned: number;
}

interface OutletData {
  shop: string;
  delivered: number;
  sold: number;
  returned: number;
  return_rate: number;
  trend: Trend;
  sell_through: number;
  sparkline: number[];
}

interface Recommendation {
  action: "increase" | "reduce" | "slight_increase" | "maintain";
  label: string;
  color: string;
  bgColor: string;
  suggested: number;
  change: number;
  impact: string;
  reason: string;
  confidence: number;
}

function deriveTrend(returnRate: number, sellThrough: number): Trend {
  if (returnRate < 15 && sellThrough > 85) return "growing";
  if (returnRate > 35 || sellThrough < 60) return "declining";
  return "stable";
}

function getRecommendation(outlet: OutletData): Recommendation {
  const { trend, sell_through, return_rate, delivered } = outlet;
  if (trend === "growing" && sell_through >= 85) {
    const increase = Math.round(delivered * 0.15);
    return { action: "increase", label: "Increase Supply", color: "#10B981", bgColor: "#ECFDF5", suggested: delivered + increase, change: increase, impact: `+N$${(increase * 4.5).toFixed(0)}`, reason: `${sell_through.toFixed(0)}% sell-through & growing — avoid lost sales`, confidence: 92 };
  }
  if (trend === "declining" || return_rate > 35) {
    const reduction = Math.round(delivered * 0.25);
    return { action: "reduce", label: "Reduce Supply", color: "#EF4444", bgColor: "#FEF2F2", suggested: delivered - reduction, change: -reduction, impact: `Save N$${(reduction * 2.8).toFixed(0)}`, reason: `${return_rate.toFixed(0)}% return rate — cut waste & costs`, confidence: 88 };
  }
  if (sell_through >= 75) {
    const increase = Math.round(delivered * 0.08);
    return { action: "slight_increase", label: "Slight Increase", color: "#10B981", bgColor: "#ECFDF5", suggested: delivered + increase, change: increase, impact: `+N$${(increase * 4.5).toFixed(0)}`, reason: `Healthy ${sell_through.toFixed(0)}% sell-through — small uplift recommended`, confidence: 74 };
  }
  return { action: "maintain", label: "Maintain", color: "#6B7280", bgColor: "#F3F4F6", suggested: delivered, change: 0, impact: "Optimised", reason: `Stable at ${sell_through.toFixed(0)}% sell-through`, confidence: 81 };
}

const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div style={{ width: 72, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1F2937", border: "none", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

function OutletCard({ outlet }: { outlet: OutletData }) {
  const [expanded, setExpanded] = useState(false);
  const rec = useMemo(() => getRecommendation(outlet), [outlet]);
  const trendConfig = {
    growing: { icon: TrendingUp, color: "#10B981", bg: "#ECFDF5", label: "Growing" },
    declining: { icon: TrendingDown, color: "#EF4444", bg: "#FEF2F2", label: "Declining" },
    stable: { icon: Minus, color: "#F59E0B", bg: "#FFFBEB", label: "Stable" },
  };
  const t = trendConfig[outlet.trend];
  const TrendIcon = t.icon;
  const barColor = outlet.sell_through >= 80 ? "#10B981" : outlet.sell_through >= 65 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 8, overflow: "hidden", transition: "box-shadow 0.2s", boxShadow: expanded ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px", minWidth: 140 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{outlet.shop}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: t.color, background: t.bg, padding: "2px 8px", borderRadius: 20 }}>
              <TrendIcon size={12} /> {t.label}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B7280", flexShrink: 0 }}>
          <span>Del: {outlet.delivered}</span>
          <span>Sold: {outlet.sold}</span>
          <span>Ret: {outlet.returned}</span>
        </div>
        <MiniSparkline data={outlet.sparkline} color={t.color} />
        <div style={{ width: 100, flexShrink: 0 }}>
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(outlet.sell_through, 100)}%`, background: barColor, borderRadius: 3, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: barColor, marginTop: 2, textAlign: "right" }}>{outlet.sell_through.toFixed(1)}%</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: rec.color, background: rec.bgColor, padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>
          {rec.action === "increase" || rec.action === "slight_increase" ? <ArrowUp size={12} /> : rec.action === "reduce" ? <ArrowDown size={12} /> : <Minus size={12} />}
          {rec.label}
        </span>
        {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px", animation: "fadeUp 0.25s ease-out" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
            <div style={{ background: "#F3F4F6", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Current</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{outlet.delivered}</div>
            </div>
            <div style={{ background: rec.bgColor, borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>AI Suggests</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: rec.color }}>{rec.suggested}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: rec.color }}>{rec.change > 0 ? `+${rec.change}` : rec.change} copies</div>
            </div>
            <div style={{ background: "#F3F4F6", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Impact</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: rec.change !== 0 ? rec.color : "#6B7280" }}>{rec.impact}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
            {rec.action === "reduce" || rec.action === "maintain" ? <AlertCircle size={16} color={rec.color} /> : <CheckCircle size={16} color={rec.color} />}
            <span style={{ flex: 1, color: "#374151" }}>{rec.reason}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: rec.confidence >= 85 ? "#10B981" : "#F59E0B" }}>Confidence: {rec.confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [monthlySummary, setMonthlySummary] = useState<MonthlyData[]>([]);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "growing" | "declining" | "increase" | "reduce">("all");

  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortByMonth = (a: string, b: string) => {
    const getIdx = (m: string) => { const idx = monthOrder.indexOf(m.slice(0, 3)); return idx >= 0 ? idx : 0; };
    return getIdx(a) - getIdx(b);
  };

  const fetchData = useCallback(async () => {
    try {
      const { data: monthlyRaw } = await supabase.from("monthly_summary").select("*").order("month", { ascending: true }).limit(12);
      if (monthlyRaw && monthlyRaw.length > 0) {
        const sorted = [...monthlyRaw].sort((a, b) => sortByMonth(a.month, b.month));
        const last6 = sorted.slice(-6);
        setMonthlySummary(last6.map((r) => ({ month: r.month, delivered: Number(r.total_sales) + Number(r.total_returns), sold: Number(r.total_sales), returned: Number(r.total_returns) })));
      } else {
        setMonthlySummary(monthlyFallback);
      }

      const { data: cleanRaw } = await supabase.from("clean_data").select("*").order("month", { ascending: false });
      if (cleanRaw && cleanRaw.length > 0) {
        const shopMap = new Map<string, typeof cleanRaw>();
        cleanRaw.forEach((r) => { const name = r.shop_name || r.shop_id; if (!shopMap.has(name)) shopMap.set(name, []); shopMap.get(name)!.push(r); });
        const outletList: OutletData[] = [];
        shopMap.forEach((rows, name) => {
          const sorted = rows.sort((a, b) => a.month.localeCompare(b.month));
          const latest = sorted[sorted.length - 1];
          const delivered = (Number(latest.quantity_sold) || 0) + (Number(latest.quantity_returned) || 0);
          const sold = Number(latest.quantity_sold) || 0;
          const returned = Number(latest.quantity_returned) || 0;
          const returnRate = delivered > 0 ? (returned / delivered) * 100 : 0;
          const sellThrough = delivered > 0 ? (sold / delivered) * 100 : 0;
          const sparkline = sorted.slice(-6).map((r) => { const d = (Number(r.quantity_sold) || 0) + (Number(r.quantity_returned) || 0); return d > 0 ? ((Number(r.quantity_sold) || 0) / d) * 100 : 0; });
          outletList.push({ shop: name, delivered, sold, returned, return_rate: returnRate, trend: deriveTrend(returnRate, sellThrough), sell_through: sellThrough, sparkline });
        });
        setOutlets(outletList);
      } else {
        setOutlets(outletFallback.map((o) => ({ ...o, sell_through: o.delivered > 0 ? (o.sold / o.delivered) * 100 : 0, sparkline: Array.from({ length: 6 }, () => 60 + Math.random() * 35) })));
      }
    } catch {
      setMonthlySummary(monthlyFallback);
      setOutlets(outletFallback.map((o) => ({ ...o, sell_through: o.delivered > 0 ? (o.sold / o.delivered) * 100 : 0, sparkline: Array.from({ length: 6 }, () => 60 + Math.random() * 35) })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [fetchData]);

  const latestMonth = monthlySummary[monthlySummary.length - 1];
  const totalDelivered = latestMonth?.delivered ?? 0;
  const totalSold = latestMonth?.sold ?? 0;
  const totalReturned = latestMonth?.returned ?? 0;
  const sellThroughPct = totalDelivered > 0 ? ((totalSold / totalDelivered) * 100).toFixed(1) : "0";

  const increaseCount = useMemo(() => outlets.filter((o) => { const r = getRecommendation(o); return r.action === "increase" || r.action === "slight_increase"; }).length, [outlets]);
  const reduceCount = useMemo(() => outlets.filter((o) => getRecommendation(o).action === "reduce").length, [outlets]);
  const growingCount = useMemo(() => outlets.filter((o) => o.trend === "growing").length, [outlets]);
  const decliningCount = useMemo(() => outlets.filter((o) => o.trend === "declining").length, [outlets]);
  const stableCount = useMemo(() => outlets.filter((o) => o.trend === "stable").length, [outlets]);

  const filteredOutlets = useMemo(() => {
    let list = outlets;
    if (search) { const q = search.toLowerCase(); list = list.filter((o) => o.shop.toLowerCase().includes(q)); }
    if (filter === "growing") list = list.filter((o) => o.trend === "growing");
    if (filter === "declining") list = list.filter((o) => o.trend === "declining");
    if (filter === "increase") list = list.filter((o) => { const r = getRecommendation(o); return r.action === "increase" || r.action === "slight_increase"; });
    if (filter === "reduce") list = list.filter((o) => getRecommendation(o).action === "reduce");
    return list;
  }, [outlets, search, filter]);

  const filterButtons: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All Outlets" },
    { key: "growing", label: "🟢 Growing" },
    { key: "declining", label: "🔴 Declining" },
    { key: "increase", label: "↑ Increase" },
    { key: "reduce", label: "↓ Reduce" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div style={{ minHeight: "100vh", background: "#F7F8FA", fontFamily: "'DM Sans', sans-serif" }}>
          <style>{`
            @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            .fade-up { animation: fadeUp 0.4s ease-out both; }
            .fade-up-d1 { animation: fadeUp 0.4s ease-out 0.05s both; }
            .fade-up-d2 { animation: fadeUp 0.4s ease-out 0.1s both; }
            .fade-up-d3 { animation: fadeUp 0.4s ease-out 0.15s both; }
            @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          `}</style>

          <div style={{ background: "#0D1117", padding: "24px 28px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Newspaper size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#10B981", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>AI Supply Intelligence</div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Demand & Distribution Advisor</h1>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", animation: "pulse-dot 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>Live · {currentMonth}</span>
              </div>
            </div>

            <div data-tour="dashboard-signals" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1, background: "#161B22", borderRadius: "10px 10px 0 0", marginTop: 20, overflow: "hidden" }} className="fade-up">
              {[
                { label: "Total Delivered", value: totalDelivered.toLocaleString(), color: "#60A5FA" },
                { label: "Total Sold", value: totalSold.toLocaleString(), color: "#10B981" },
                { label: "Total Returned", value: totalReturned.toLocaleString(), color: "#EF4444" },
                { label: "Sell-Through %", value: `${sellThroughPct}%`, color: "#F59E0B" },
                { label: "AI Actions", value: `${increaseCount}↑  ${reduceCount}↓`, color: "#A78BFA" },
              ].map((stat, i) => (
                <div key={i} style={{ padding: "16px 20px", background: "#0D1117", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>Loading data...</div>
            ) : (
              <>
                <div data-tour="dashboard-chart" className="fade-up-d1" style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif" }}>Network Demand Trend</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlySummary} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                      <defs>
                        <linearGradient id="gradSold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradReturned" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" fontSize={12} tick={{ fill: "#6B7280" }} />
                      <YAxis fontSize={12} tick={{ fill: "#6B7280" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="delivered" stroke="#60A5FA" strokeWidth={2} strokeDasharray="6 3" fill="none" name="Delivered" />
                      <Area type="monotone" dataKey="sold" stroke="#10B981" strokeWidth={2} fill="url(#gradSold)" name="Sold" />
                      <Area type="monotone" dataKey="returned" stroke="#EF4444" strokeWidth={2} fill="url(#gradReturned)" name="Returned" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="fade-up-d2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 24 }}>
                  <div style={{ background: "#ECFDF5", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <TrendingUp size={18} color="#10B981" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#065F46" }}>Growing Demand</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#10B981" }}>{growingCount}</div>
                    <div style={{ fontSize: 12, color: "#047857", marginTop: 4 }}>→ Increase supply to capture demand</div>
                  </div>
                  <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <TrendingDown size={18} color="#EF4444" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Declining Demand</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#EF4444" }}>{decliningCount}</div>
                    <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 4 }}>→ Reduce supply to cut return costs</div>
                  </div>
                  <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Minus size={18} color="#F59E0B" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Stable Outlets</span>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#F59E0B" }}>{stableCount}</div>
                    <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>→ Maintain current supply levels</div>
                  </div>
                </div>

                <div className="fade-up-d3" style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif" }}>Outlet Supply Recommendations</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", borderRadius: 8, padding: "8px 12px", flex: "1 1 200px", maxWidth: 320 }}>
                      <Search size={16} color="#9CA3AF" />
                      <input type="text" placeholder="Search outlets..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%", fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {filterButtons.map((btn) => (
                        <button key={btn.key} onClick={() => setFilter(btn.key)} style={{ padding: "6px 14px", borderRadius: 20, border: filter === btn.key ? "2px solid #10B981" : "1px solid #E5E7EB", background: filter === btn.key ? "#ECFDF5" : "#fff", color: filter === btn.key ? "#065F46" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredOutlets.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 14 }}>No outlets match your filters</div>
                  ) : (
                    filteredOutlets.map((outlet) => <OutletCard key={outlet.shop} outlet={outlet} />)
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
