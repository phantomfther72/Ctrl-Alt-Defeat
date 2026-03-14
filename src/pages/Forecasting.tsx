import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Forecasting() {
  const [forecastData, setForecastData] = useState<{ month: string; actual: number | null; forecast: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
      const { data } = await supabase.from("forecast_data").select("*");
      if (data) {
        const sorted = [...data].sort(
          (a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
        );
        setForecastData(sorted.map((r) => ({ month: r.month, actual: r.actual, forecast: r.forecast })));
      }
      setLoading(false);
    }
    fetchForecast();
  }, []);

  // Compute metrics from data
  const actuals = forecastData.filter((d) => d.actual !== null);
  const forecasts = forecastData.filter((d) => d.forecast !== null);
  const lastActual = actuals.length > 0 ? actuals[actuals.length - 1].actual ?? 0 : 0;
  const lastForecast = forecasts.length > 0 ? forecasts[forecasts.length - 1].forecast ?? 0 : 0;
  const growth = lastActual > 0 ? Math.round(((lastForecast - lastActual) / lastActual) * 100) : 0;

  const metrics = [
    { label: "Predicted Growth", value: `+${growth}%`, status: "positive" },
    { label: "Confidence Level", value: "87%", status: "neutral" },
    { label: "Est. Year-End Views", value: lastForecast >= 1000 ? `${(lastForecast / 1000).toFixed(0)}K` : String(lastForecast), status: "positive" },
    { label: "Seasonal Impact", value: "Moderate", status: "neutral" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Predictive analytics and trend forecasting for your content performance.
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="font-heading text-xl font-bold text-card-foreground">{loading ? "..." : m.value}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {m.status === "positive" ? "↑ Favorable" : "→ Stable"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Traffic Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)" }} />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="hsl(243, 75%, 59%)" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="hsl(167, 72%, 50%)" strokeWidth={2.5} strokeDasharray="8 4" dot={{ r: 4 }} name="Forecast" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
