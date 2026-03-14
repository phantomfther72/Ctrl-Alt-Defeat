import { useState, useMemo } from "react";
import {
  MapPin, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown,
  BarChart3, Brain, Shield, Rocket, AlertTriangle, CheckCircle,
  Activity, Target, Zap, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRegionalAI, type RegionAnalysis } from "@/hooks/useRegionalAI";

type SortKey = "demand_score" | "efficiency_score" | "ai_confidence";

const SUPPLY_COLORS: Record<string, string> = {
  "over-supplied": "hsl(0 72% 55%)",
  "balanced": "hsl(152 60% 42%)",
  "under-supplied": "hsl(32 95% 55%)",
};
const DEMAND_COLORS: Record<string, string> = {
  high: "hsl(152 60% 42%)",
  medium: "hsl(32 95% 55%)",
  low: "hsl(0 72% 55%)",
};
const ACTION_COLORS: Record<string, string> = {
  increase_supply: "hsl(200 80% 50%)",
  maintain: "hsl(152 60% 42%)",
  reduce_supply: "hsl(0 72% 55%)",
  investigate: "hsl(32 95% 55%)",
};
const RISK_COLORS: Record<string, string> = {
  high: "hsl(0 72% 55%)",
  medium: "hsl(32 95% 55%)",
  low: "hsl(152 60% 42%)",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-elevated text-xs">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="my-0.5">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

export default function Regional() {
  const { analysis, locationStats, loading, hasRun, runAnalysis } = useRegionalAI();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("demand_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Derived data from AI analysis
  const regions = analysis?.region_analyses || [];

  const actionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    regions.forEach((r) => { counts[r.recommended_action] = (counts[r.recommended_action] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: ACTION_COLORS[name] || "hsl(220 10% 46%)",
    }));
  }, [regions]);

  const supplyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    regions.forEach((r) => { counts[r.supply_status] = (counts[r.supply_status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: SUPPLY_COLORS[name] || "hsl(220 10% 46%)",
    }));
  }, [regions]);

  const scatterData = useMemo(() =>
    regions.map((r) => ({
      name: r.location.length > 15 ? r.location.slice(0, 13) + "…" : r.location,
      x: r.demand_score,
      y: r.efficiency_score,
      z: r.ai_confidence,
      action: r.recommended_action,
    })), [regions]);

  const top5Radar = useMemo(() =>
    [...regions].sort((a, b) => b.demand_score - a.demand_score).slice(0, 5).map((r) => ({
      location: r.location.length > 12 ? r.location.slice(0, 10) + "…" : r.location,
      Demand: r.demand_score,
      Efficiency: r.efficiency_score,
      Confidence: r.ai_confidence,
    })), [regions]);

  const filteredRegions = useMemo(() => {
    let list = regions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.location.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
  }, [regions, search, sortBy, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const oa = analysis?.overall_assessment;

  return (
    <AppLayout>
      <div className="font-[family-name:var(--font-body)]">
        {/* Header */}
        <div className="rounded-xl p-6 mb-6 bg-sidebar-background">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center">
              <Brain size={22} className="text-primary-foreground" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-0.5">AI-Powered</div>
              <h1 className="text-xl font-bold text-sidebar-primary-foreground m-0">Regional Demand & Supply Intelligence</h1>
            </div>
          </div>
          <p className="text-sidebar-foreground text-sm mb-4 max-w-2xl">
            AI analyses each outlet's demand patterns, supply efficiency, and return rates to classify regions and recommend optimized distribution activities.
          </p>
          <Button
            onClick={runAnalysis}
            disabled={loading}
            className="gradient-primary text-primary-foreground border-none"
          >
            <Brain size={16} className="mr-2" />
            {loading ? "Analyzing Regions…" : hasRun ? "Re-run AI Analysis" : "Run AI Regional Analysis"}
          </Button>
        </div>

        {!hasRun && !loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Click "Run AI Regional Analysis" to generate demand/supply intelligence for all outlets.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="mx-auto mb-4 h-12 w-12 text-primary animate-pulse" />
              <p className="text-muted-foreground text-sm">AI is analyzing {locationStats.length || "all"} outlets across all months…</p>
              <p className="text-muted-foreground text-xs mt-1">This typically takes 10-20 seconds</p>
            </CardContent>
          </Card>
        ) : analysis ? (
          <>
            {/* Overall Assessment KPI Strip */}
            {oa && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Network Health</div>
                    <div className="text-2xl font-bold text-primary">{oa.network_health_score}<span className="text-sm font-normal">/100</span></div>
                    <Progress value={oa.network_health_score} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Balance Status</div>
                    <Badge variant={oa.balance_status === "balanced" ? "default" : "destructive"} className="text-sm mt-1">
                      {oa.balance_status.replace(/-/g, " ").toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Waste Rate</div>
                    <div className="text-2xl font-bold text-destructive">{oa.total_waste_pct.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">Outlets Analyzed</div>
                    <div className="text-2xl font-bold text-foreground">{regions.length}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Summary */}
            {oa && (
              <Card className="mb-6 shadow-card border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Eye size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-1">AI Assessment Summary</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{oa.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-5 mb-6">
              {/* Supply Distribution Pie */}
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Supply Balance Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={supplyDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {supplyDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Action Distribution Pie */}
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Actions</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={actionDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {actionDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top 5 Radar */}
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Top 5 Performance Radar</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={top5Radar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="location" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis tick={{ fontSize: 8 }} />
                      <Radar name="Demand" dataKey="Demand" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} />
                      <Radar name="Efficiency" dataKey="Efficiency" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.15} />
                      <Radar name="Confidence" dataKey="Confidence" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.15} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Demand vs Efficiency Scatter */}
            <Card className="mb-6 shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Demand Score vs Supply Efficiency (bubble = AI confidence)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" name="Demand" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Demand Score", position: "bottom", fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" name="Efficiency" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Efficiency", angle: -90, position: "insideLeft", fontSize: 11 }} />
                    <ZAxis type="number" dataKey="z" range={[40, 400]} name="Confidence" />
                    <Tooltip content={<ChartTooltip />} />
                    <Scatter data={scatterData} fill="hsl(var(--primary))" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Decision Factors */}
            {analysis.ai_decision_factors?.length > 0 && (
              <Card className="mb-6 shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap size={16} className="text-chart-3" /> How AI Determines Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.ai_decision_factors.map((f, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground">{f.factor_name}</span>
                          <Badge variant={f.weight === "high" ? "default" : "secondary"} className="text-[10px]">
                            {f.weight} weight
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{f.description}</p>
                        <div className="text-[10px] font-mono text-primary bg-primary/5 rounded px-2 py-0.5 inline-block">
                          Threshold: {f.threshold}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk & Opportunities Row */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              {/* Risk Regions */}
              {analysis.risk_regions?.length > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle size={16} className="text-destructive" /> Risk Regions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.risk_regions.map((r, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground">{r.location}</span>
                          <Badge variant={r.urgency === "immediate" ? "destructive" : "secondary"} className="text-[10px]">
                            {r.urgency}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">{r.risk_type}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Growth Opportunities */}
              {analysis.growth_opportunities?.length > 0 && (
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Rocket size={16} className="text-accent" /> Growth Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.growth_opportunities.map((g, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="text-sm font-semibold text-foreground mb-0.5">{g.location}</div>
                        <div className="text-xs text-accent font-medium">{g.opportunity_type}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.potential_impact}</p>
                        <p className="text-[10px] text-primary mt-1">💡 {g.recommended_investment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Outlet Table with AI Classifications */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-sm">AI-Classified Outlet Breakdown</CardTitle>
                  <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 max-w-xs">
                    <Search size={14} className="text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search outlets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-none outline-none bg-transparent text-xs text-foreground w-full font-[family-name:var(--font-body)]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left p-2.5 text-muted-foreground font-semibold">Outlet</th>
                        <th className="text-center p-2.5 text-muted-foreground font-semibold">Demand</th>
                        <th className="text-center p-2.5 text-muted-foreground font-semibold">Supply</th>
                        <th className="text-center p-2.5 text-muted-foreground font-semibold">Action</th>
                        {(["demand_score", "efficiency_score", "ai_confidence"] as SortKey[]).map((key) => (
                          <th
                            key={key}
                            onClick={() => handleSort(key)}
                            className="text-right p-2.5 text-muted-foreground font-semibold cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                          >
                            <span className="inline-flex items-center gap-1">
                              {key === "demand_score" ? "Demand %" : key === "efficiency_score" ? "Efficiency %" : "AI Conf %"}
                              <ArrowUpDown size={10} />
                            </span>
                          </th>
                        ))}
                        <th className="text-center p-2.5 text-muted-foreground font-semibold">Risk</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegions.map((r, i) => (
                        <>
                          <tr
                            key={r.location}
                            className={`border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                            onClick={() => setExpandedRow(expandedRow === r.location ? null : r.location)}
                          >
                            <td className="p-2.5 font-semibold text-foreground max-w-[180px] truncate">{r.location}</td>
                            <td className="text-center p-2.5">
                              <Badge variant="outline" className="text-[10px]" style={{ borderColor: DEMAND_COLORS[r.demand_level], color: DEMAND_COLORS[r.demand_level] }}>
                                {r.demand_level}
                              </Badge>
                            </td>
                            <td className="text-center p-2.5">
                              <Badge variant="outline" className="text-[10px]" style={{ borderColor: SUPPLY_COLORS[r.supply_status], color: SUPPLY_COLORS[r.supply_status] }}>
                                {r.supply_status.replace(/-/g, " ")}
                              </Badge>
                            </td>
                            <td className="text-center p-2.5">
                              <Badge className="text-[10px]" style={{ backgroundColor: ACTION_COLORS[r.recommended_action], color: "#fff" }}>
                                {r.recommended_action.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="text-right p-2.5 font-semibold" style={{ color: DEMAND_COLORS[r.demand_level] }}>{r.demand_score}</td>
                            <td className="text-right p-2.5 font-semibold" style={{ color: r.efficiency_score >= 70 ? DEMAND_COLORS.high : r.efficiency_score >= 40 ? DEMAND_COLORS.medium : DEMAND_COLORS.low }}>
                              {r.efficiency_score}
                            </td>
                            <td className="text-right p-2.5 font-semibold text-primary">{r.ai_confidence}</td>
                            <td className="text-center p-2.5">
                              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLORS[r.risk_level] }} />
                            </td>
                            <td className="p-2.5 text-center">
                              {expandedRow === r.location ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                            </td>
                          </tr>
                          {expandedRow === r.location && (
                            <tr key={`${r.location}-detail`} className="bg-primary/5">
                              <td colSpan={9} className="p-4">
                                <div className="flex items-start gap-2">
                                  <Brain size={14} className="text-primary mt-0.5 shrink-0" />
                                  <div>
                                    <div className="text-xs font-semibold text-foreground mb-1">AI Reasoning</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{r.reasoning}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing {filteredRegions.length} of {regions.length} outlets • Click a row to see AI reasoning
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
