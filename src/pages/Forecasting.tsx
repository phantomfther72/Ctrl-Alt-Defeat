import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const forecastData = [
  { month: "Jan", actual: 4200, forecast: null },
  { month: "Feb", actual: 5100, forecast: null },
  { month: "Mar", actual: 4800, forecast: null },
  { month: "Apr", actual: 6200, forecast: null },
  { month: "May", actual: 7500, forecast: null },
  { month: "Jun", actual: 8100, forecast: 8100 },
  { month: "Jul", actual: null, forecast: 8800 },
  { month: "Aug", actual: null, forecast: 9200 },
  { month: "Sep", actual: null, forecast: 9800 },
  { month: "Oct", actual: null, forecast: 10500 },
  { month: "Nov", actual: null, forecast: 11200 },
  { month: "Dec", actual: null, forecast: 12000 },
];

const metrics = [
  { label: "Predicted Growth", value: "+47%", status: "positive" },
  { label: "Confidence Level", value: "87%", status: "neutral" },
  { label: "Est. Year-End Views", value: "12K", status: "positive" },
  { label: "Seasonal Impact", value: "Moderate", status: "neutral" },
];

export default function Forecasting() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Predictive analytics and trend forecasting for your content performance.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} className="shadow-card border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="font-heading text-xl font-bold text-card-foreground">{m.value}</p>
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
