import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, Area, ComposedChart, Legend,
} from "recharts";
import {
  Brain, RefreshCw, Activity, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Lightbulb, BarChart3, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───
interface Prediction {
  shop_id: string;
  shop_name: string | null;
  month: string;
  predicted_sales: number;
  actual_sales: number | null;
  predicted_returns: number | null;
  actual_returns: number | null;
}

interface MonthlySummary {
  month: string;
  total_sales: number;
  total_returns: number;
  sell_through_pct: number;
  return_rate_pct: number;
  revenue: number;
  forecast_revenue: number;
}

interface ModelMetric {
  metric_name: string;
  metric_value: number;
  evaluated_at: string;
}

// ─── Helpers ───
function pct(a: number, b: number) {
  if (b === 0) return 0;
  return Math.round((a / b) * 1000) / 10;
}

function variancePct(predicted: number, actual: number) {
  if (predicted === 0) return 0;
  return Math.round(((actual - predicted) / predicted) * 1000) / 10;
}

// ─── Component ───
export default function AiMonitor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetric[]>([]);
  const [dataPointCount, setDataPointCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [predRes, summRes, metricRes, countRes] = await Promise.all([
        supabase.from("predictions").select("*").order("month"),
        supabase.from("monthly_summary").select("*").order("month"),
        supabase.from("model_metrics").select("*").order("evaluated_at", { ascending: false }),
        supabase.from("clean_data").select("id", { count: "exact", head: true }),
      ]);

      if (predRes.data) setPredictions(predRes.data as Prediction[]);
      if (summRes.data) setMonthlySummary(summRes.data as MonthlySummary[]);
      if (metricRes.data) setModelMetrics(metricRes.data as ModelMetric[]);
      setDataPointCount(countRes.count ?? 0);
      setLastUpdated(new Date());
    } catch {
      toast({ title: "Error", description: "Failed to fetch AI monitor data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Derived KPIs ───
  const forecastAccuracy = (() => {
    const metr = modelMetrics.find((m) => m.metric_name === "forecast_accuracy");
    if (metr) return metr.metric_value;
    const withActuals = predictions.filter((p) => p.actual_sales != null);
    if (withActuals.length === 0) return 0;
    const errors = withActuals.map((p) => Math.abs((p.actual_sales! - p.predicted_sales) / (p.predicted_sales || 1)));
    return Math.round((1 - errors.reduce((a, b) => a + b, 0) / errors.length) * 1000) / 10;
  })();

  const avgSellThrough = monthlySummary.length
    ? Math.round((monthlySummary.reduce((s, m) => s + m.sell_through_pct, 0) / monthlySummary.length) * 10) / 10
    : 0;

  const avgReturnRate = monthlySummary.length
    ? Math.round((monthlySummary.reduce((s, m) => s + m.return_rate_pct, 0) / monthlySummary.length) * 10) / 10
    : 0;

  const revenuePredictionGap = (() => {
    const total = monthlySummary.reduce((s, m) => s + m.revenue, 0);
    const totalForecast = monthlySummary.reduce((s, m) => s + m.forecast_revenue, 0);
    if (totalForecast === 0) return 0;
    return Math.round(((total - totalForecast) / totalForecast) * 1000) / 10;
  })();

  // ─── Chart Data ───
  const forecastVsActual = monthlySummary.map((m) => ({
    month: m.month,
    forecast: m.forecast_revenue,
    actual: m.revenue,
  }));

  const sellThroughBars = monthlySummary.map((m) => ({
    month: m.month,
    value: m.sell_through_pct,
  }));

  // ─── Anomaly Alerts ───
  const anomalies = monthlySummary
    .filter((m) => m.return_rate_pct > 5)
    .sort((a, b) => b.return_rate_pct - a.return_rate_pct)
    .slice(0, 5)
    .map((m) => ({
      month: m.month,
      rate: m.return_rate_pct,
      severity: m.return_rate_pct > 15 ? "critical" : m.return_rate_pct > 10 ? "warning" : "info",
    }));

  // ─── Shop Performance ───
  const shopPerformance = (() => {
    const grouped: Record<string, { predicted: number; actual: number; name: string }> = {};
    predictions.forEach((p) => {
      if (!grouped[p.shop_id]) grouped[p.shop_id] = { predicted: 0, actual: 0, name: p.shop_name || p.shop_id };
      grouped[p.shop_id].predicted += p.predicted_sales;
      grouped[p.shop_id].actual += p.actual_sales ?? 0;
    });
    return Object.entries(grouped).map(([id, d]) => ({
      shop_id: id,
      shop_name: d.name,
      predicted: d.predicted,
      actual: d.actual,
      variance: variancePct(d.predicted, d.actual),
      status: d.actual > d.predicted * 1.05 ? "Outperforming" : d.actual < d.predicted * 0.95 ? "Underperforming" : "On Track",
    }));
  })();

  // ─── AI Insights ───
  const insights: string[] = [];
  if (forecastAccuracy > 85) insights.push(`Model accuracy is strong at ${forecastAccuracy}%. Current predictions are reliable for planning.`);
  else if (forecastAccuracy > 0) insights.push(`Forecast accuracy is ${forecastAccuracy}% — consider retraining with more recent data to improve predictions.`);
  if (avgReturnRate > 10) insights.push(`Average return rate of ${avgReturnRate}% is above industry benchmark. Investigate product quality or sizing issues.`);
  if (avgSellThrough < 60) insights.push(`Sell-through at ${avgSellThrough}% suggests overstock. Consider markdown strategies for slow-moving inventory.`);
  else if (avgSellThrough > 80) insights.push(`Excellent sell-through rate of ${avgSellThrough}%. Monitor for potential stockouts on top performers.`);
  const underperformers = shopPerformance.filter((s) => s.status === "Underperforming");
  if (underperformers.length > 0) insights.push(`${underperformers.length} shop(s) underperforming vs. forecast. Focus support on: ${underperformers.slice(0, 3).map((s) => s.shop_name).join(", ")}.`);
  const topShop = shopPerformance.sort((a, b) => b.variance - a.variance)[0];
  if (topShop && topShop.variance > 0) insights.push(`${topShop.shop_name} is the top performer with +${topShop.variance}% above forecast.`);
  if (Math.abs(revenuePredictionGap) > 5) insights.push(`Revenue prediction gap of ${revenuePredictionGap > 0 ? "+" : ""}${revenuePredictionGap}% — ${revenuePredictionGap > 0 ? "revenue is exceeding expectations" : "revenue is falling short of projections"}.`);
  if (insights.length === 0) insights.push("Not enough data to generate insights. Upload data and run predictions to see AI-powered recommendations.");

  const kpis = [
    { label: "Forecast Accuracy", value: `${forecastAccuracy}%`, icon: Target, up: forecastAccuracy >= 80 },
    { label: "Avg Sell-Through", value: `${avgSellThrough}%`, icon: TrendingUp, up: avgSellThrough >= 70 },
    { label: "Avg Return Rate", value: `${avgReturnRate}%`, icon: TrendingDown, up: avgReturnRate <= 10 },
    { label: "Revenue Gap", value: `${revenuePredictionGap > 0 ? "+" : ""}${revenuePredictionGap}%`, icon: BarChart3, up: revenuePredictionGap >= 0 },
  ];

  const statusBadgeStyles: Record<string, string> = {
    Outperforming: "bg-kpi-up/10 text-kpi-up border-kpi-up/20",
    "On Track": "bg-primary/10 text-primary border-primary/20",
    Underperforming: "bg-kpi-down/10 text-kpi-down border-kpi-down/20",
  };

  const anomalySeverityConfig: Record<string, { icon: typeof XCircle; color: string; bg: string }> = {
    critical: { icon: XCircle, color: "text-kpi-down", bg: "border-kpi-down/30 bg-kpi-down/5" },
    warning: { icon: AlertTriangle, color: "text-chart-3", bg: "border-chart-3/30 bg-chart-3/5" },
    info: { icon: CheckCircle2, color: "text-kpi-up", bg: "border-kpi-up/30 bg-kpi-up/5" },
  };

  const getSellThroughColor = (val: number) => {
    if (val >= 75) return "hsl(152, 60%, 42%)";
    if (val >= 60) return "hsl(32, 95%, 55%)";
    return "hsl(0, 72%, 55%)";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
              <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kpi-up opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-kpi-up" />
              </span>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">AI Performance Monitor</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                <span>·</span>
                <span>{dataPointCount.toLocaleString()} data points</span>
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="shadow-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                    <Icon className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-heading font-bold text-card-foreground">{kpi.value}</span>
                      {kpi.up ? (
                        <ArrowUpRight className="h-4 w-4 text-kpi-up mb-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-kpi-down mb-1" />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Sales Forecast vs Actuals */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Sales Forecast vs Actuals</CardTitle>
              <CardDescription className="text-xs">Predicted revenue vs actual revenue by month</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : forecastVsActual.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={forecastVsActual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }} />
                    <Area
                      dataKey="forecast"
                      stroke="none"
                      fill="hsl(243, 75%, 59%)"
                      fillOpacity={0.08}
                      type="monotone"
                      name="Error Gap"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="hsl(243, 75%, 59%)"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      name="Forecast"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(152, 60%, 42%)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "hsl(152, 60%, 42%)" }}
                      name="Actual"
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sell-Through Performance */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Sell-Through Performance</CardTitle>
              <CardDescription className="text-xs">Monthly sell-through % with 75% target line</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : sellThroughBars.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sellThroughBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }}
                      formatter={(value: number) => [`${value}%`, "Sell-Through"]}
                    />
                    <ReferenceLine y={75} stroke="hsl(243, 75%, 59%)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Target 75%", position: "right", fontSize: 10, fill: "hsl(243, 75%, 59%)" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Sell-Through %">
                      {sellThroughBars.map((entry, i) => (
                        <Cell key={i} fill={getSellThroughColor(entry.value)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Alerts */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              Anomaly Alerts
            </CardTitle>
            <CardDescription className="text-xs">Return rate anomalies detected across monthly data</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : anomalies.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-lg border border-kpi-up/20 bg-kpi-up/5">
                <CheckCircle2 className="h-4 w-4 text-kpi-up" />
                <span className="text-sm text-kpi-up font-medium">All clear — no return rate anomalies detected.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((a) => {
                  const cfg = anomalySeverityConfig[a.severity];
                  const SevIcon = cfg.icon;
                  return (
                    <Alert key={a.month} className={cn("border", cfg.bg)}>
                      <SevIcon className={cn("h-4 w-4", cfg.color)} />
                      <AlertTitle className="text-sm font-semibold">
                        {a.severity === "critical" ? "Critical" : a.severity === "warning" ? "Warning" : "Elevated"} — {a.month}
                      </AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        Return rate of {a.rate}% {a.severity === "critical" ? "far exceeds" : "exceeds"} acceptable thresholds. {a.severity === "critical" ? "Immediate investigation recommended." : "Monitor closely."}
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shop Performance Intelligence */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Shop Performance Intelligence</CardTitle>
            <CardDescription className="text-xs">Predicted vs actual sales aggregated by shop</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : shopPerformance.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No prediction data available</div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Shop</TableHead>
                      <TableHead className="text-xs text-right">Predicted</TableHead>
                      <TableHead className="text-xs text-right">Actual</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopPerformance.map((shop) => (
                      <TableRow key={shop.shop_id}>
                        <TableCell className="text-sm font-medium">{shop.shop_name}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{shop.predicted.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{shop.actual.toLocaleString()}</TableCell>
                        <TableCell className={cn("text-sm text-right tabular-nums font-semibold", shop.variance >= 0 ? "text-kpi-up" : "text-kpi-down")}>
                          {shop.variance > 0 ? "+" : ""}{shop.variance}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusBadgeStyles[shop.status])}>
                            {shop.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        <Card className="shadow-card border-border/50 border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription className="text-xs">Auto-generated intelligence based on current data</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <ul className="space-y-3">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-card-foreground leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
