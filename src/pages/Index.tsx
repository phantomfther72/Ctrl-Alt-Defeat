import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Newspaper, Package, Undo2, DollarSign, TrendingUp, TrendingDown, Minus,
  MapPin, Calendar, AlertTriangle, ArrowRight, Loader2, RefreshCw, Lightbulb,
  BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line, LineChart,
} from "recharts";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useDistributionData, type MonthlyStat } from "@/hooks/useDistributionData";

// --- AI Trend Analysis Types ---
interface TrendAnalysis {
  demand_trend: { direction: string; growth_rate_pct: number; summary: string };
  revenue_trend: { direction: string; growth_rate_pct: number; total_revenue: number; summary: string };
  top_locations: { location: string; demand: number; revenue: number; return_rate_pct: number }[];
  high_return_locations: { location: string; return_rate_pct: number; total_returned: number; recommendation: string }[];
  seasonal_patterns: { pattern: string; impact: string; affected_months: string }[];
  recommendations: { title: string; description: string; priority: string; expected_impact: string }[];
}

interface DistEvent {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

const CHART_COLORS = {
  sold: "hsl(var(--chart-1))",
  returned: "hsl(var(--chart-4))",
  demand: "hsl(var(--chart-2))",
  revenue: "hsl(var(--chart-1))",
  sellThrough: "hsl(var(--chart-2))",
  returnRate: "hsl(var(--chart-4))",
  primary: "hsl(243, 75%, 59%)",
  secondary: "hsl(167, 72%, 50%)",
  warning: "hsl(32, 95%, 55%)",
  danger: "hsl(340, 75%, 55%)",
  info: "hsl(200, 80%, 50%)",
};

const eventTypeBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  holiday: "default",
  school_event: "secondary",
  festive_season: "outline",
  campaign: "default",
  breaking_news: "destructive",
};

const TrendIcon = ({ direction }: { direction: string }) => {
  if (direction === "growing") return <TrendingUp className="h-5 w-5 text-emerald-500" />;
  if (direction === "declining") return <TrendingDown className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
};

const Index = () => {
  const {
    monthly, locations, loading, totalSold, totalReturned, totalRevenue,
    avgSellThrough, calcChange, hasData,
  } = useDistributionData();

  const [events, setEvents] = useState<DistEvent[]>([]);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load events and existing analysis
  useEffect(() => {
    const loadExtras = async () => {
      const [eventsRes, trendsRes] = await Promise.all([
        supabase.from("distribution_events").select("*").order("start_date", { ascending: false }).limit(10),
        supabase.from("trend_analysis").select("*").order("created_at", { ascending: false }),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data as DistEvent[]);

      // Reconstruct analysis from stored trend_analysis rows
      if (trendsRes.data && trendsRes.data.length > 0) {
        const trends = trendsRes.data;
        const demandRow = trends.find((t: any) => t.analysis_type === "demand" && t.metric_name === "overall_trend");
        const revenueRow = trends.find((t: any) => t.analysis_type === "revenue" && t.metric_name === "overall_trend");
        const totalRevRow = trends.find((t: any) => t.analysis_type === "revenue" && t.metric_name === "total_revenue");
        const topLocs = trends.filter((t: any) => t.analysis_type === "location_demand");
        const highRet = trends.filter((t: any) => t.analysis_type === "location_returns");
        const seasonal = trends.filter((t: any) => t.analysis_type === "seasonal");
        const recs = trends.filter((t: any) => t.analysis_type === "recommendation");

        if (demandRow && revenueRow) {
          setAnalysis({
            demand_trend: {
              direction: demandRow.trend_direction || "stable",
              growth_rate_pct: Number(demandRow.metric_value),
              summary: demandRow.insight || "",
            },
            revenue_trend: {
              direction: revenueRow.trend_direction || "stable",
              growth_rate_pct: Number(revenueRow.metric_value),
              total_revenue: totalRevRow ? Number(totalRevRow.metric_value) : 0,
              summary: revenueRow.insight || "",
            },
            top_locations: topLocs.map((l: any) => ({
              location: l.location || "",
              demand: Number(l.metric_value),
              revenue: 0,
              return_rate_pct: 0,
            })),
            high_return_locations: highRet.map((l: any) => ({
              location: l.location || "",
              return_rate_pct: Number(l.metric_value),
              total_returned: 0,
              recommendation: l.insight || "",
            })),
            seasonal_patterns: seasonal.map((s: any) => ({
              pattern: s.metric_name,
              impact: s.insight || "",
              affected_months: s.period || "",
            })),
            recommendations: recs.map((r: any) => {
              const parts = (r.insight || "").split(" | Expected impact: ");
              return {
                title: r.metric_name,
                description: parts[0] || "",
                priority: r.trend_direction || "medium",
                expected_impact: parts[1] || "",
              };
            }),
          });
        }
      }
    };
    loadExtras();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast({ title: "Analysis Complete", description: "Demand & revenue trends have been updated." });
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Chart data
  const salesReturnsData = monthly.map((m) => ({
    month: m.month,
    sold: m.total_sales,
    returned: m.total_returns,
    demand: m.total_sales - m.total_returns,
  }));

  const efficiencyData = monthly.map((m) => ({
    month: m.month,
    sell_through: m.sell_through_pct,
    return_rate: m.return_rate_pct,
    revenue: m.revenue,
    forecast: m.forecast_revenue,
  }));

  const topLocations = locations.slice(0, 8).map((l) => ({
    name: l.location.length > 18 ? l.location.slice(0, 18) + "…" : l.location,
    fullName: l.location,
    demand: l.sold - l.returned,
    returnRate: l.returnRate,
  }));

  const highReturnLocations = [...locations]
    .filter((l) => l.returnRate > 15)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Distribution Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sales, returns, AI trend analysis, and distribution insights.
            </p>
          </div>
          <div className="flex gap-2">
            {hasData && (
              <Button variant="outline" size="sm" onClick={runAnalysis} disabled={analyzing} className="gap-2">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {analyzing ? "Analyzing…" : "Run AI Analysis"}
              </Button>
            )}
            {!hasData && !loading && (
              <Button onClick={() => navigate("/data-ingestion")} className="gap-2">
                <ArrowRight className="h-4 w-4" /> Upload Data
              </Button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty */}
        {!loading && !hasData && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-heading font-semibold text-foreground text-lg">No Distribution Data Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Upload your historical sales and returns dataset to populate the dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && hasData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Copies Sold" value={formatNum(totalSold)} change={Number(calcChange("total_sales").toFixed(1))} icon={Package} />
              <KpiCard title="Copies Returned" value={formatNum(totalReturned)} change={Number(calcChange("total_returns").toFixed(1))} icon={Undo2} />
              <KpiCard title="Total Revenue" value={`N$${formatNum(totalRevenue)}`} change={Number(calcChange("revenue").toFixed(1))} icon={DollarSign} />
              <KpiCard title="Sell-Through Rate" value={`${avgSellThrough.toFixed(1)}%`} change={Number(calcChange("sell_through_pct").toFixed(1))} icon={TrendingUp} />
            </div>

            {/* AI Trend Summary */}
            {analysis && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demand Trend</p>
                      <TrendIcon direction={analysis.demand_trend.direction} />
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground mt-2">
                      {analysis.demand_trend.growth_rate_pct > 0 ? "+" : ""}{analysis.demand_trend.growth_rate_pct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{analysis.demand_trend.direction}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Trend</p>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground mt-2">
                      {analysis.revenue_trend.growth_rate_pct > 0 ? "+" : ""}{analysis.revenue_trend.growth_rate_pct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: N${analysis.revenue_trend.total_revenue.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Locations</p>
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground mt-2">{locations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Distribution points</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Return Sites</p>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-2xl font-bold font-heading text-foreground mt-2">{analysis.high_return_locations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabbed Charts */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <Card className="shadow-card border-border/50 lg:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-heading text-base">Sales vs Returns Over Time</CardTitle>
                      <CardDescription className="text-xs">Monthly distributed, returned, and net demand</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={salesReturnsData}>
                          <defs>
                            <linearGradient id="gradDemand" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.demand} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={CHART_COLORS.demand} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                          <Legend />
                          <Bar dataKey="sold" fill={CHART_COLORS.sold} radius={[3, 3, 0, 0]} name="Sold" opacity={0.7} />
                          <Bar dataKey="returned" fill={CHART_COLORS.returned} radius={[3, 3, 0, 0]} name="Returned" opacity={0.7} />
                          <Area type="monotone" dataKey="demand" fill="url(#gradDemand)" stroke={CHART_COLORS.demand} strokeWidth={2} name="Net Demand" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Top Locations
                      </CardTitle>
                      <CardDescription className="text-xs">By net demand</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topLocations} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                          <Bar dataKey="demand" radius={[0, 4, 4, 0]} name="Net Demand">
                            {topLocations.map((_, i) => (
                              <Cell key={i} fill={i < 3 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="revenue">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Revenue vs Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={efficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: number) => `N$${v.toLocaleString()}`} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" fill={CHART_COLORS.primary} fillOpacity={0.15} stroke={CHART_COLORS.primary} strokeWidth={2} name="Actual Revenue" />
                        <Area type="monotone" dataKey="forecast" fill={CHART_COLORS.secondary} fillOpacity={0.1} stroke={CHART_COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" name="Forecast Revenue" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="efficiency">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-base">Sell-Through & Return Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={efficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="sell_through" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} name="Sell-Through %" />
                        <Line type="monotone" dataKey="return_rate" stroke={CHART_COLORS.danger} strokeWidth={2} dot={{ r: 3 }} name="Return Rate %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="locations">
                <Card className="shadow-card border-border/50">
                  <CardHeader>
                    <CardTitle className="font-heading text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Demand by Location (Top 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={locations.slice(0, 10).map((l) => ({
                        location: l.location.length > 15 ? l.location.slice(0, 15) + "…" : l.location,
                        demand: l.sold - l.returned,
                      }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="location" type="category" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                        <Bar dataKey="demand" radius={[0, 4, 4, 0]} name="Net Demand">
                          {locations.slice(0, 10).map((_, i) => (
                            <Cell key={i} fill={i < 3 ? CHART_COLORS.primary : CHART_COLORS.info} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Bottom Row: Events + Alerts + AI Insights */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Distribution Events */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Distribution Events
                  </CardTitle>
                  <CardDescription className="text-xs">Holidays, campaigns & breaking news</CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[280px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Event</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((ev) => (
                            <TableRow key={ev.id}>
                              <TableCell className="text-sm font-medium py-2">{ev.event_name}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant={eventTypeBadge[ev.event_type] || "secondary"} className="text-[10px] capitalize">
                                  {ev.event_type.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground py-2">
                                {new Date(ev.start_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                {ev.start_date !== ev.end_date && ` – ${new Date(ev.end_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* High Return Locations */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Over-Distribution Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">Locations with return rates above 15%</CardDescription>
                </CardHeader>
                <CardContent>
                  {highReturnLocations.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">All locations within healthy return rates.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[280px] overflow-auto">
                      {highReturnLocations.map((loc) => (
                        <div key={loc.location} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{loc.location}</p>
                              <p className="text-xs text-muted-foreground">
                                {loc.returned.toLocaleString()} returned of {(loc.sold + loc.returned).toLocaleString()} distributed
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0 ml-2">
                            {loc.returnRate.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Analysis Panels */}
            {analysis && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* AI High Return Locations */}
                {analysis.high_return_locations.length > 0 && (
                  <Card className="shadow-card border-border/50">
                    <CardHeader>
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        AI: High Return Rate Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.high_return_locations.map((loc, i) => (
                        <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground">{loc.location}</span>
                            <Badge variant="destructive">{loc.return_rate_pct.toFixed(1)}% returns</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{loc.recommendation}</p>
                          <Progress value={Math.min(loc.return_rate_pct, 100)} className="h-1.5" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Seasonal Patterns */}
                {analysis.seasonal_patterns.length > 0 && (
                  <Card className="shadow-card border-border/50">
                    <CardHeader>
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Seasonal Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.seasonal_patterns.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{p.affected_months}</Badge>
                            <span className="font-medium text-sm text-foreground">{p.pattern}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.impact}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* AI Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <Card className="shadow-card border-border/50 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="font-heading text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {analysis.recommendations.map((rec, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/50 bg-card space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-foreground">{rec.title}</h4>
                              <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{rec.description}</p>
                            {rec.expected_impact && (
                              <p className="text-xs font-medium text-primary">Expected: {rec.expected_impact}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* AI Summary */}
            {analysis && (
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-base">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Demand</p>
                    <p className="text-sm text-foreground">{analysis.demand_trend.summary}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-sm text-foreground">{analysis.revenue_trend.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/forecasting")} className="gap-2 text-xs">
                <Newspaper className="h-3.5 w-3.5" /> Forecasting
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/insights")} className="gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5" /> AI Insights
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/supply-ai")} className="gap-2 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Supply AI
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
