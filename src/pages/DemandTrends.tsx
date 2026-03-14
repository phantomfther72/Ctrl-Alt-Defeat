import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  ComposedChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, BarChart3, DollarSign,
  MapPin, Calendar, Lightbulb, RefreshCw, AlertTriangle, Loader2,
  Newspaper,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrendAnalysis {
  demand_trend: { direction: string; growth_rate_pct: number; summary: string };
  revenue_trend: { direction: string; growth_rate_pct: number; total_revenue: number; summary: string };
  top_locations: { location: string; demand: number; revenue: number; return_rate_pct: number }[];
  high_return_locations: { location: string; return_rate_pct: number; total_returned: number; recommendation: string }[];
  seasonal_patterns: { pattern: string; impact: string; affected_months: string }[];
  recommendations: { title: string; description: string; priority: string; expected_impact: string }[];
}

interface MonthlyData {
  month: string;
  total_sales: number;
  total_returns: number;
  revenue: number;
  sell_through_pct: number;
  return_rate_pct: number;
  forecast_revenue: number;
}

interface LocationStat {
  location: string;
  sold: number;
  returned: number;
  revenue: number;
  months: number;
}

const CHART_COLORS = {
  primary: "hsl(243, 75%, 59%)",
  secondary: "hsl(167, 72%, 50%)",
  warning: "hsl(32, 95%, 55%)",
  danger: "hsl(340, 75%, 55%)",
  info: "hsl(200, 80%, 50%)",
};

const TrendIcon = ({ direction }: { direction: string }) => {
  if (direction === "growing") return <TrendingUp className="h-5 w-5 text-emerald-500" />;
  if (direction === "declining") return <TrendingDown className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-muted-foreground" />;
};

export default function DemandTrends() {
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const { toast } = useToast();

  const checkData = useCallback(async () => {
    const { count } = await supabase.from("clean_data").select("*", { count: "exact", head: true });
    setHasData((count || 0) > 0);
  }, []);

  const loadExistingAnalysis = useCallback(async () => {
    // Load monthly summary for charts
    const { data: monthly } = await supabase
      .from("monthly_summary")
      .select("*")
      .order("month", { ascending: true });
    if (monthly && monthly.length > 0) {
      setMonthlyData(monthly.map((m: any) => ({
        month: m.month,
        total_sales: Number(m.total_sales),
        total_returns: Number(m.total_returns),
        revenue: Number(m.revenue),
        sell_through_pct: Number(m.sell_through_pct),
        return_rate_pct: Number(m.return_rate_pct),
        forecast_revenue: Number(m.forecast_revenue),
      })));
    }

    // Load trend analysis from DB
    const { data: trends } = await supabase
      .from("trend_analysis")
      .select("*")
      .order("created_at", { ascending: false });

    if (trends && trends.length > 0) {
      // Reconstruct analysis from stored rows
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

    // Load clean_data for location stats
    const { data: cleanData } = await supabase.from("clean_data").select("shop_name, shop_id, quantity_sold, quantity_returned, revenue");
    if (cleanData && cleanData.length > 0) {
      const agg: Record<string, LocationStat> = {};
      for (const r of cleanData) {
        const loc = r.shop_name || r.shop_id;
        if (!agg[loc]) agg[loc] = { location: loc, sold: 0, returned: 0, revenue: 0, months: 0 };
        agg[loc].sold += r.quantity_sold || 0;
        agg[loc].returned += r.quantity_returned || 0;
        agg[loc].revenue += Number(r.revenue || 0);
        agg[loc].months += 1;
      }
      setLocationStats(Object.values(agg).sort((a, b) => b.sold - a.sold));
    }
  }, []);

  useEffect(() => {
    checkData();
    loadExistingAnalysis();
  }, [checkData, loadExistingAnalysis]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-trends");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      if (data.monthly_data) {
        setMonthlyData(data.monthly_data.map((m: any) => ({
          month: m.month,
          total_sales: Number(m.total_sales),
          total_returns: Number(m.total_returns),
          revenue: Number(m.revenue),
          sell_through_pct: Number(m.sell_through_pct),
          return_rate_pct: Number(m.return_rate_pct),
          forecast_revenue: Number(m.forecast_revenue),
        })));
      }
      if (data.location_stats) {
        setLocationStats((data.location_stats as LocationStat[]).sort((a, b) => b.sold - a.sold));
      }

      toast({ title: "Analysis Complete", description: "Demand & revenue trends have been updated." });
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const demandData = monthlyData.map((m) => ({
    month: m.month,
    demand: m.total_sales - m.total_returns,
    distributed: m.total_sales,
    returned: m.total_returns,
  }));

  const revenueData = monthlyData.map((m) => ({
    month: m.month,
    revenue: m.revenue,
    forecast: m.forecast_revenue,
  }));

  const returnRateData = monthlyData.map((m) => ({
    month: m.month,
    return_rate: m.return_rate_pct,
    sell_through: m.sell_through_pct,
  }));

  const topLocationData = locationStats.slice(0, 10).map((l) => ({
    location: l.location.length > 15 ? l.location.slice(0, 15) + "…" : l.location,
    fullName: l.location,
    demand: l.sold - l.returned,
    return_rate: l.sold > 0 ? ((l.returned / l.sold) * 100).toFixed(1) : 0,
    revenue: l.revenue,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Demand & Revenue Trend Analysis
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze newspaper distribution demand patterns, revenue growth, and optimize supply allocation.
            </p>
          </div>
          <Button onClick={runAnalysis} disabled={loading || hasData === false} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Analyzing…" : "Run AI Analysis"}
          </Button>
        </div>

        {hasData === false && (
          <Card className="border-dashed border-2 border-warning/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-warning mb-3" />
              <h3 className="font-heading font-semibold text-foreground">No Data Available</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Upload a dataset via the Data Ingestion page to begin analyzing demand and revenue trends.
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPI Summary Cards */}
        {analysis && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demand Trend</p>
                  <TrendIcon direction={analysis.demand_trend.direction} />
                </div>
                <p className="text-2xl font-bold font-heading text-foreground mt-2">
                  {analysis.demand_trend.growth_rate_pct > 0 ? "+" : ""}
                  {analysis.demand_trend.growth_rate_pct.toFixed(1)}%
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
                  {analysis.revenue_trend.growth_rate_pct > 0 ? "+" : ""}
                  {analysis.revenue_trend.growth_rate_pct.toFixed(1)}%
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
                <p className="text-2xl font-bold font-heading text-foreground mt-2">{locationStats.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Distribution points</p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Return Sites</p>
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold font-heading text-foreground mt-2">
                  {analysis.high_return_locations.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {monthlyData.length > 0 && (
          <Tabs defaultValue="demand" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="demand">Demand</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>

            <TabsContent value="demand">
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Demand Trend Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={demandData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                      <Legend />
                      <Area type="monotone" dataKey="demand" fill={CHART_COLORS.primary} fillOpacity={0.15} stroke={CHART_COLORS.primary} strokeWidth={2} name="Net Demand" />
                      <Bar dataKey="distributed" fill={CHART_COLORS.secondary} radius={[3, 3, 0, 0]} name="Distributed" opacity={0.7} />
                      <Bar dataKey="returned" fill={CHART_COLORS.danger} radius={[3, 3, 0, 0]} name="Returned" opacity={0.7} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Revenue Growth Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" fill={CHART_COLORS.primary} fillOpacity={0.2} stroke={CHART_COLORS.primary} strokeWidth={2} name="Actual Revenue" />
                      <Area type="monotone" dataKey="forecast" fill={CHART_COLORS.secondary} fillOpacity={0.1} stroke={CHART_COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" name="Forecast Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="returns">
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Return Rate & Sell-Through Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={returnRateData}>
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
                    <BarChart data={topLocationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="location" type="category" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                      <Bar dataKey="demand" radius={[0, 4, 4, 0]} name="Net Demand">
                        {topLocationData.map((_, i) => (
                          <Cell key={i} fill={i < 3 ? CHART_COLORS.primary : CHART_COLORS.info} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* AI Insights Panels */}
        {analysis && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* High Return Locations */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  High Return Rate Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.high_return_locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No high-return locations identified.</p>
                ) : (
                  analysis.high_return_locations.map((loc, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{loc.location}</span>
                        <Badge variant="destructive">{loc.return_rate_pct.toFixed(1)}% returns</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{loc.recommendation}</p>
                      <Progress value={Math.min(loc.return_rate_pct, 100)} className="h-1.5" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Seasonal Patterns */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.seasonal_patterns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Add distribution events to identify seasonal patterns.</p>
                ) : (
                  analysis.seasonal_patterns.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{p.affected_months}</Badge>
                        <span className="font-medium text-sm text-foreground">{p.pattern}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.impact}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="shadow-card border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  AI Recommendations for Distribution Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border/50 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-foreground">{rec.title}</h4>
                        <Badge
                          variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                      {rec.expected_impact && (
                        <p className="text-xs font-medium text-primary">
                          Expected: {rec.expected_impact}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
      </div>
    </AppLayout>
  );
}
