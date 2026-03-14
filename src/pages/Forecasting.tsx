import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, TrendingUp, TrendingDown, Calendar, Zap, BarChart3 } from "lucide-react";
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
  ReferenceLine,
} from "recharts";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthlyRow {
  month: string;
  total_sales: number;
  total_returns: number;
  revenue: number;
  return_rate_pct: number;
  sell_through_pct: number;
  forecast_revenue: number;
}

// ── Linear Regression ──────────────────────────────────────────────
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² (coefficient of determination)
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2: Math.max(0, r2) };
}

function sortByMonth(data: MonthlyRow[]): MonthlyRow[] {
  return [...data].sort(
    (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  );
}

// ── Component ──────────────────────────────────────────────────────
export default function Forecasting() {
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("monthly_summary")
        .select("*")
        .order("month", { ascending: true });

      if (data && data.length > 0) {
        const mapped = data.map((m) => ({
          month: m.month,
          total_sales: Number(m.total_sales),
          total_returns: Number(m.total_returns),
          revenue: Number(m.revenue),
          return_rate_pct: Number(m.return_rate_pct),
          sell_through_pct: Number(m.sell_through_pct),
          forecast_revenue: Number(m.forecast_revenue),
        }));
        setMonthly(sortByMonth(mapped));
      }
      setLoading(false);
    })();
  }, []);

  // ── Regression analysis ──────────────────────────────────────────
  const analysis = useMemo(() => {
    if (monthly.length < 2) return null;

    // Build data points: x = month index, y = revenue
    const points = monthly.map((m, i) => ({ x: i, y: m.revenue }));
    const reg = linearRegression(points);

    // Forecast remaining months of the year
    const existingMonths = monthly.map((m) => m.month);
    const lastIndex = monthly.length - 1;
    const forecastPoints: { month: string; predicted: number }[] = [];

    for (let i = 0; i < 12; i++) {
      const month = MONTH_ORDER[i];
      if (!existingMonths.includes(month)) {
        const x = lastIndex + (i - MONTH_ORDER.indexOf(existingMonths[existingMonths.length - 1]));
        const predicted = Math.max(0, reg.slope * (lastIndex + forecastPoints.length + 1) + reg.intercept);
        forecastPoints.push({ month, predicted });
      }
    }

    // Predicted growth: compare first vs last predicted revenue
    const firstRevenue = monthly[0].revenue;
    const lastPredicted = forecastPoints.length > 0
      ? forecastPoints[forecastPoints.length - 1].predicted
      : monthly[monthly.length - 1].revenue;
    const lastActual = monthly[monthly.length - 1].revenue;
    const finalValue = forecastPoints.length > 0 ? lastPredicted : lastActual;
    const predictedGrowth = firstRevenue > 0
      ? ((finalValue - firstRevenue) / firstRevenue) * 100
      : 0;

    // Est. year-end: sum actual + forecasted revenue
    const totalActual = monthly.reduce((s, m) => s + m.revenue, 0);
    const totalForecast = forecastPoints.reduce((s, p) => s + p.predicted, 0);
    const estYearEnd = totalActual + totalForecast;
    const totalCosts = monthly.reduce((s, m) => s + m.total_returns * (m.revenue / Math.max(m.total_sales, 1)), 0);
    const isProfit = estYearEnd > totalCosts;

    // Peak month: highest revenue (actual or predicted)
    const allMonths = [
      ...monthly.map((m) => ({ month: m.month, value: m.revenue })),
      ...forecastPoints.map((f) => ({ month: f.month, value: f.predicted })),
    ];
    const peak = allMonths.reduce((max, m) => (m.value > max.value ? m : max), allMonths[0]);

    // Confidence: R² mapped to percentage
    const confidence = Math.round(reg.r2 * 100);

    // Chart data
    const chartData = MONTH_ORDER.map((month) => {
      const actual = monthly.find((m) => m.month === month);
      const forecast = forecastPoints.find((f) => f.month === month);
      const idx = MONTH_ORDER.indexOf(month);

      // Regression line value for every month
      const monthDataIndex = actual
        ? monthly.indexOf(actual)
        : lastIndex + (forecastPoints.findIndex((f) => f.month === month) + 1);
      const regressionValue = Math.max(0, reg.slope * monthDataIndex + reg.intercept);

      return {
        month,
        actual: actual ? actual.revenue : null,
        predicted: forecast ? Math.round(forecast.predicted) : null,
        regression: Math.round(regressionValue),
      };
    }).filter((d) => d.actual !== null || d.predicted !== null);

    return {
      confidence,
      predictedGrowth,
      estYearEnd,
      isProfit,
      peakMonth: peak.month,
      chartData,
      slope: reg.slope,
      r2: reg.r2,
    };
  }, [monthly]);

  // ── KPI cards ────────────────────────────────────────────────────
  const kpis = analysis
    ? [
        {
          label: "AI Confidence",
          value: `${analysis.confidence}%`,
          icon: Target,
          description: `R² = ${analysis.r2.toFixed(3)}`,
          status: analysis.confidence >= 70 ? "positive" : analysis.confidence >= 40 ? "neutral" : "negative",
        },
        {
          label: "Predicted Growth",
          value: `${analysis.predictedGrowth >= 0 ? "+" : ""}${analysis.predictedGrowth.toFixed(1)}%`,
          icon: analysis.predictedGrowth >= 0 ? TrendingUp : TrendingDown,
          description: analysis.predictedGrowth >= 0 ? "Upward trend" : "Downward trend",
          status: analysis.predictedGrowth >= 0 ? "positive" : "negative",
        },
        {
          label: "Est. Year-End",
          value: analysis.estYearEnd >= 1_000_000
            ? `N$${(analysis.estYearEnd / 1_000_000).toFixed(2)}M`
            : analysis.estYearEnd >= 1000
              ? `N$${(analysis.estYearEnd / 1000).toFixed(1)}K`
              : `N$${Math.round(analysis.estYearEnd)}`,
          icon: BarChart3,
          description: analysis.isProfit ? "Projected Profit" : "Projected Loss",
          status: analysis.isProfit ? "positive" : "negative",
        },
        {
          label: "Peak Month Forecast",
          value: analysis.peakMonth,
          icon: Zap,
          description: "Highest projected revenue",
          status: "neutral" as const,
        },
      ]
    : [];

  // ── Render ───────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Forecasting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Linear regression model projecting revenue trends from historical distribution data.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !analysis ? (
          <Card className="border-border/50">
            <CardContent className="p-10 text-center text-muted-foreground">
              Not enough data to run regression. Upload at least 2 months of distribution data.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.label} className="shadow-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                          <p className="font-heading text-xl font-bold text-card-foreground">
                            {kpi.value}
                          </p>
                        </div>
                        <div
                          className={`p-2 rounded-lg ${
                            kpi.status === "positive"
                              ? "bg-emerald-500/10"
                              : kpi.status === "negative"
                                ? "bg-red-500/10"
                                : "bg-primary/10"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              kpi.status === "positive"
                                ? "text-emerald-500"
                                : kpi.status === "negative"
                                  ? "text-red-500"
                                  : "text-primary"
                            }`}
                          />
                        </div>
                      </div>
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {kpi.description}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Regression Chart */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base">
                  Revenue — Actual vs. Regression Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={370}>
                  <ComposedChart data={analysis.chartData}>
                    <defs>
                      <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--background))",
                        fontSize: 12,
                      }}
                      formatter={(value: any, name: string) => [
                        `N$${Number(value).toLocaleString()}`,
                        name === "actual" ? "Actual" : name === "predicted" ? "Predicted" : "Regression Line",
                      ]}
                    />
                    <Legend />

                    {/* Actual revenue area */}
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(var(--primary))"
                      fill="url(#actualFill)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(var(--primary))" }}
                      name="Actual"
                      connectNulls={false}
                    />

                    {/* Predicted future area */}
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="hsl(167, 72%, 50%)"
                      fill="url(#predictedFill)"
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      dot={{ r: 4, fill: "hsl(167, 72%, 50%)" }}
                      name="Predicted"
                      connectNulls={false}
                    />

                    {/* Regression trend line */}
                    <Line
                      type="monotone"
                      dataKey="regression"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Regression Line"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-heading text-base">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Month</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Actual Revenue</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Regression</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Predicted</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.chartData.map((row) => {
                        const val = row.actual ?? row.predicted ?? 0;
                        const variance = val - row.regression;
                        return (
                          <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2 px-3 font-medium text-card-foreground">{row.month}</td>
                            <td className="py-2 px-3 text-right text-card-foreground">
                              {row.actual !== null ? `N$${row.actual.toLocaleString()}` : "—"}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              N${row.regression.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-500">
                              {row.predicted !== null ? `$${row.predicted.toLocaleString()}` : "—"}
                            </td>
                            <td className={`py-2 px-3 text-right text-xs ${variance >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                              {variance >= 0 ? "+" : ""}{Math.round(variance).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
