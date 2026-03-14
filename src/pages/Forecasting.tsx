import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, ChevronUp, ChevronDown, Target, Calendar, Zap } from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type ForecastRow = {
  month: string;
  actual: number | null;
  forecast: number | null;
  upper_bound: number | null;
  lower_bound: number | null;
  growth_rate: number | null;
  scenario: string;
  generated_by: string | null;
};

type ForecastSummary = {
  trend_direction: "up" | "down" | "stable";
  confidence_score: number;
  key_findings: string[];
  predicted_peak_month: string;
  avg_growth_rate: number;
};

export default function Forecasting() {
  const [forecastData, setForecastData] = useState<ForecastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);

  // User controls
  const [horizon, setHorizon] = useState("6");
  const [seasonality, setSeasonality] = useState(true);
  const [growthModel, setGrowthModel] = useState("moderate");
  const [activeScenario, setActiveScenario] = useState("baseline");
  const [showConfidence, setShowConfidence] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("forecast_data").select("*");
    if (data) {
      const sorted = [...data].sort(
        (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
      );
      setForecastData(sorted as ForecastRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateForecast = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-forecast", {
        body: { horizon: parseInt(horizon), seasonality, growthModel },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.summary) {
        setSummary(data.summary);
      }

      toast.success(`Generated ${data?.count || 0} forecast points across 3 scenarios`);
      await fetchData();
    } catch (err: any) {
      console.error("Forecast generation error:", err);
      toast.error(err.message || "Failed to generate forecast");
    } finally {
      setGenerating(false);
    }
  };

  // Filter data by active scenario for charting
  const scenarioData = forecastData.filter(
    (d) => d.scenario === activeScenario || d.scenario === "baseline" || d.actual !== null
  );

  // Build chart data: merge actuals + scenario forecasts by month
  const chartData = MONTH_ORDER.map((month) => {
    const actual = forecastData.find((d) => d.month === month && d.actual !== null);
    const scenarioRow = forecastData.find((d) => d.month === month && d.scenario === activeScenario && d.forecast !== null);

    return {
      month,
      actual: actual?.actual ?? null,
      forecast: scenarioRow?.forecast ?? null,
      upper_bound: scenarioRow?.upper_bound ?? null,
      lower_bound: scenarioRow?.lower_bound ?? null,
      confidence_range: scenarioRow ? [scenarioRow.lower_bound, scenarioRow.upper_bound] : null,
    };
  }).filter((d) => d.actual !== null || d.forecast !== null);

  // Growth rate chart data
  const growthData = forecastData
    .filter((d) => d.scenario === activeScenario && d.growth_rate !== null)
    .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
    .map((d) => ({
      month: d.month,
      growth: d.growth_rate,
    }));

  // Compute metrics
  const actuals = forecastData.filter((d) => d.actual !== null);
  const baselineForecasts = forecastData.filter((d) => d.scenario === activeScenario && d.forecast !== null);
  const lastActual = actuals.length > 0 ? actuals[actuals.length - 1].actual ?? 0 : 0;
  const lastForecast = baselineForecasts.length > 0 ? baselineForecasts[baselineForecasts.length - 1].forecast ?? 0 : 0;
  const growth = lastActual > 0 ? Math.round(((lastForecast - lastActual) / lastActual) * 100) : 0;

  const trendIcon = summary?.trend_direction === "up" ? TrendingUp : summary?.trend_direction === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const metrics = [
    {
      label: "Predicted Growth",
      value: loading ? "..." : `${growth >= 0 ? "+" : ""}${growth}%`,
      icon: growth >= 0 ? ChevronUp : ChevronDown,
      status: growth >= 0 ? "positive" : "negative",
    },
    {
      label: "AI Confidence",
      value: loading ? "..." : `${summary?.confidence_score ?? 87}%`,
      icon: Target,
      status: "neutral",
    },
    {
      label: "Est. Year-End",
      value: loading ? "..." : lastForecast >= 1000 ? `${(lastForecast / 1000).toFixed(1)}K` : String(lastForecast),
      icon: Calendar,
      status: "positive",
    },
    {
      label: "Peak Month",
      value: loading ? "..." : summary?.predicted_peak_month ?? "N/A",
      icon: Zap,
      status: "neutral",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              AI-powered predictive analytics with configurable scenarios and confidence intervals.
            </p>
          </div>
          <Button
            onClick={generateForecast}
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {generating ? "Generating..." : "Generate AI Forecast"}
          </Button>
        </div>

        {/* Controls */}
        <Card className="shadow-card border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Horizon</Label>
                <Select value={horizon} onValueChange={setHorizon}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="9">9 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Growth Model</Label>
                <Select value={growthModel} onValueChange={setGrowthModel}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="seasonality" checked={seasonality} onCheckedChange={setSeasonality} />
                <Label htmlFor="seasonality" className="text-xs text-muted-foreground">Seasonality</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="confidence" checked={showConfidence} onCheckedChange={setShowConfidence} />
                <Label htmlFor="confidence" className="text-xs text-muted-foreground">Confidence Band</Label>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Scenario</Label>
                <div className="flex gap-1">
                  {["pessimistic", "baseline", "optimistic"].map((s) => (
                    <Button
                      key={s}
                      variant={activeScenario === s ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-[11px] capitalize px-3"
                      onClick={() => setActiveScenario(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className="shadow-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                      <p className="font-heading text-xl font-bold text-card-foreground">{m.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${m.status === "positive" ? "bg-emerald-500/10" : m.status === "negative" ? "bg-red-500/10" : "bg-primary/10"}`}>
                      <Icon className={`h-4 w-4 ${m.status === "positive" ? "text-emerald-500" : m.status === "negative" ? "text-red-500" : "text-primary"}`} />
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {m.status === "positive" ? "↑ Favorable" : m.status === "negative" ? "↓ Declining" : "→ Stable"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Forecast Chart */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">
              Traffic Forecast — <span className="capitalize text-primary">{activeScenario}</span> Scenario
            </CardTitle>
            {summary && (
              <div className="flex items-center gap-2">
                <TrendIcon className={`h-4 w-4 ${summary.trend_direction === "up" ? "text-emerald-500" : summary.trend_direction === "down" ? "text-red-500" : "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">
                  Avg growth: {summary.avg_growth_rate?.toFixed(1)}%
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }}
                  formatter={(value: any, name: string) => {
                    if (name === "upper_bound" || name === "lower_bound") return [value, name.replace("_", " ")];
                    return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                  }}
                />
                <Legend />

                {showConfidence && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="upper_bound"
                      stroke="none"
                      fill="url(#confidenceGrad)"
                      name="Upper Bound"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower_bound"
                      stroke="none"
                      fill="transparent"
                      name="Lower Bound"
                      connectNulls={false}
                    />
                  </>
                )}

                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(243, 75%, 59%)"
                  fill="url(#actualGrad)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(243, 75%, 59%)" }}
                  name="Actual"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(167, 72%, 50%)"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  dot={{ r: 4, fill: "hsl(167, 72%, 50%)" }}
                  name="Forecast"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Growth Rate Chart */}
          {growthData.length > 0 && (
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base">Monthly Growth Rate (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}%`, "Growth"]}
                    />
                    <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                      {growthData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Number(entry.growth) >= 0 ? "hsl(167, 72%, 50%)" : "hsl(340, 75%, 55%)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          {summary && (
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant={summary.trend_direction === "up" ? "default" : summary.trend_direction === "down" ? "destructive" : "secondary"} className="capitalize">
                    {summary.trend_direction} Trend
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Confidence: <span className="font-semibold text-card-foreground">{summary.confidence_score}%</span>
                  </span>
                </div>
                <div className="space-y-2">
                  {summary.key_findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scenario Comparison Table */}
        {forecastData.some((d) => d.generated_by === "ai") && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Month</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Pessimistic</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Baseline</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Optimistic</th>
                      <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTH_ORDER.map((month) => {
                      const pess = forecastData.find((d) => d.month === month && d.scenario === "pessimistic" && d.forecast !== null);
                      const base = forecastData.find((d) => d.month === month && d.scenario === "baseline" && d.forecast !== null);
                      const opt = forecastData.find((d) => d.month === month && d.scenario === "optimistic" && d.forecast !== null);
                      if (!pess && !base && !opt) return null;
                      const range = opt && pess ? (opt.forecast ?? 0) - (pess.forecast ?? 0) : 0;
                      return (
                        <tr key={month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 font-medium text-card-foreground">{month}</td>
                          <td className="py-2 px-3 text-right text-red-400">{pess?.forecast?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3 text-right text-card-foreground font-medium">{base?.forecast?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{opt?.forecast?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground text-xs">±{Math.round(range / 2).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
