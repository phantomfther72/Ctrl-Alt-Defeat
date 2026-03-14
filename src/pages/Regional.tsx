import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Trend = "growing" | "declining" | "stable";
type SortKey = "sold" | "returned" | "revenue" | "returnRate" | "sellThrough";

interface RegionStat {
  location: string;
  sold: number;
  returned: number;
  delivered: number;
  revenue: number;
  returnRate: number;
  sellThrough: number;
  trend: Trend;
  months: string[];
  monthlyBreakdown: { month: string; sold: number; returned: number; revenue: number }[];
}

function deriveTrend(returnRate: number, sellThrough: number): Trend {
  if (returnRate < 15 && sellThrough > 85) return "growing";
  if (returnRate > 35 || sellThrough < 60) return "declining";
  return "stable";
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1F2937", border: "none", borderRadius: 8, padding: "10px 14px", color: "#F9FAFB", fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Regional() {
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("sold");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cleanRaw } = await supabase
        .from("clean_data")
        .select("shop_name, shop_id, quantity_sold, quantity_returned, revenue, month");

      if (cleanRaw && cleanRaw.length > 0) {
        const agg: Record<string, RegionStat> = {};
        for (const r of cleanRaw) {
          const loc = r.shop_name || r.shop_id;
          if (!agg[loc]) {
            agg[loc] = {
              location: loc,
              sold: 0,
              returned: 0,
              delivered: 0,
              revenue: 0,
              returnRate: 0,
              sellThrough: 0,
              trend: "stable",
              months: [],
              monthlyBreakdown: [],
            };
          }
          agg[loc].sold += r.quantity_sold || 0;
          agg[loc].returned += r.quantity_returned || 0;
          agg[loc].revenue += Number(r.revenue || 0);
          if (r.month && !agg[loc].months.includes(r.month)) {
            agg[loc].months.push(r.month);
          }
        }

        // Build monthly breakdown per location
        const monthlyMap: Record<string, Record<string, { sold: number; returned: number; revenue: number }>> = {};
        for (const r of cleanRaw) {
          const loc = r.shop_name || r.shop_id;
          if (!monthlyMap[loc]) monthlyMap[loc] = {};
          if (!monthlyMap[loc][r.month]) monthlyMap[loc][r.month] = { sold: 0, returned: 0, revenue: 0 };
          monthlyMap[loc][r.month].sold += r.quantity_sold || 0;
          monthlyMap[loc][r.month].returned += r.quantity_returned || 0;
          monthlyMap[loc][r.month].revenue += Number(r.revenue || 0);
        }

        const stats = Object.values(agg).map((l) => {
          l.delivered = l.sold + l.returned;
          l.returnRate = l.delivered > 0 ? (l.returned / l.delivered) * 100 : 0;
          l.sellThrough = l.delivered > 0 ? (l.sold / l.delivered) * 100 : 0;
          l.trend = deriveTrend(l.returnRate, l.sellThrough);
          l.monthlyBreakdown = Object.entries(monthlyMap[l.location] || {})
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
          return l;
        });
        setRegions(stats);
      }
    } catch (e) {
      console.error("Regional fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregated KPIs
  const totalSold = regions.reduce((s, r) => s + r.sold, 0);
  const totalReturned = regions.reduce((s, r) => s + r.returned, 0);
  const totalRevenue = regions.reduce((s, r) => s + r.revenue, 0);
  const totalDelivered = totalSold + totalReturned;
  const avgSellThrough = totalDelivered > 0 ? (totalSold / totalDelivered) * 100 : 0;
  const growingCount = regions.filter((r) => r.trend === "growing").length;
  const decliningCount = regions.filter((r) => r.trend === "declining").length;
  const stableCount = regions.filter((r) => r.trend === "stable").length;

  // Top 10 by sold for bar chart
  const top10 = useMemo(() =>
    [...regions].sort((a, b) => b.sold - a.sold).slice(0, 10).map((r) => ({
      name: r.location.length > 20 ? r.location.slice(0, 18) + "…" : r.location,
      Sold: r.sold,
      Returned: r.returned,
    })),
    [regions]
  );

  // Pie chart data for trend distribution
  const trendPie = useMemo(() => [
    { name: "Growing", value: growingCount, color: "#10B981" },
    { name: "Declining", value: decliningCount, color: "#EF4444" },
    { name: "Stable", value: stableCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0), [growingCount, decliningCount, stableCount]);

  // Top 5 for radar
  const radarData = useMemo(() =>
    [...regions].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((r) => ({
      location: r.location.length > 15 ? r.location.slice(0, 13) + "…" : r.location,
      "Sell-Through": Math.round(r.sellThrough),
      "Revenue Share": totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 100) : 0,
      "Volume Share": totalSold > 0 ? Math.round((r.sold / totalSold) * 100) : 0,
    })),
    [regions, totalRevenue, totalSold]
  );

  // Filtered & sorted table
  const filteredRegions = useMemo(() => {
    let list = regions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.location.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      return sortAsc ? av - bv : bv - av;
    });
  }, [regions, search, sortBy, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const trendBadge = (trend: Trend) => {
    const config = {
      growing: { icon: TrendingUp, color: "#10B981", bg: "#ECFDF5", label: "Growing" },
      declining: { icon: TrendingDown, color: "#EF4444", bg: "#FEF2F2", label: "Declining" },
      stable: { icon: Minus, color: "#F59E0B", bg: "#FFFBEB", label: "Stable" },
    };
    const t = config[trend];
    const Icon = t.icon;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: t.color, background: t.bg, padding: "3px 10px", borderRadius: 20 }}>
        <Icon size={12} /> {t.label}
      </span>
    );
  };

  return (
    <AppLayout>
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ background: "#0D1117", borderRadius: 12, padding: "24px 28px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>Regional Intelligence</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB", margin: 0 }}>Regional Data Analytics</h1>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 1, background: "#161B22", borderRadius: 10, overflow: "hidden" }}>
            {[
              { label: "Total Outlets", value: regions.length.toString(), color: "#60A5FA" },
              { label: "Total Sold", value: totalSold.toLocaleString(), color: "#10B981" },
              { label: "Total Returned", value: totalReturned.toLocaleString(), color: "#EF4444" },
              { label: "Total Revenue", value: `N$${(totalRevenue / 1000).toFixed(1)}k`, color: "#F59E0B" },
              { label: "Avg Sell-Through", value: `${avgSellThrough.toFixed(1)}%`, color: "#A78BFA" },
            ].map((stat, i) => (
              <div key={i} style={{ padding: "16px 20px", background: "#0D1117", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>Loading regional data...</div>
        ) : regions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No data available. Upload a dataset first.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Top 10 Bar Chart */}
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Top 10 Outlets by Volume</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={top10} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" fontSize={11} tick={{ fill: "#6B7280" }} />
                    <YAxis type="category" dataKey="name" fontSize={11} tick={{ fill: "#374151" }} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Sold" fill="#10B981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Returned" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Trend Distribution + Radar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flex: 1 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Outlet Trend Distribution</h2>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={trendPie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={4}>
                        {trendPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flex: 1 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Top 5 Performance Radar</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="location" tick={{ fontSize: 10, fill: "#6B7280" }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} />
                      <Radar name="Sell-Through" dataKey="Sell-Through" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                      <Radar name="Revenue Share" dataKey="Revenue Share" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                      <Radar name="Volume Share" dataKey="Volume Share" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Full Table */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>All Outlets Breakdown</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F3F4F6", borderRadius: 8, padding: "8px 12px", maxWidth: 300 }}>
                  <Search size={16} color="#9CA3AF" />
                  <input
                    type="text"
                    placeholder="Search outlets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #E5E7EB" }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: "#6B7280", fontWeight: 600, fontSize: 12 }}>Outlet</th>
                      {([
                        ["sold", "Sold"],
                        ["returned", "Returned"],
                        ["revenue", "Revenue"],
                        ["returnRate", "Return %"],
                        ["sellThrough", "Sell-Through %"],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          style={{ textAlign: "right", padding: "10px 12px", color: sortBy === key ? "#111827" : "#6B7280", fontWeight: 600, fontSize: 12, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {label} <ArrowUpDown size={12} />
                          </span>
                        </th>
                      ))}
                      <th style={{ textAlign: "center", padding: "10px 12px", color: "#6B7280", fontWeight: 600, fontSize: 12 }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegions.map((r, i) => {
                      const barColor = r.sellThrough >= 80 ? "#10B981" : r.sellThrough >= 65 ? "#F59E0B" : "#EF4444";
                      return (
                        <tr key={r.location} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111827", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.location}</td>
                          <td style={{ textAlign: "right", padding: "10px 12px", color: "#10B981", fontWeight: 600 }}>{r.sold.toLocaleString()}</td>
                          <td style={{ textAlign: "right", padding: "10px 12px", color: "#EF4444", fontWeight: 600 }}>{r.returned.toLocaleString()}</td>
                          <td style={{ textAlign: "right", padding: "10px 12px", color: "#374151", fontWeight: 600 }}>N${r.revenue.toLocaleString()}</td>
                          <td style={{ textAlign: "right", padding: "10px 12px", color: r.returnRate > 30 ? "#EF4444" : "#6B7280", fontWeight: 600 }}>{r.returnRate.toFixed(1)}%</td>
                          <td style={{ textAlign: "right", padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              <div style={{ width: 60, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(r.sellThrough, 100)}%`, background: barColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 600, color: barColor, fontSize: 12 }}>{r.sellThrough.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", padding: "10px 12px" }}>{trendBadge(r.trend)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
                Showing {filteredRegions.length} of {regions.length} outlets
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
