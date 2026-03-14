import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const demographicData = [
  { name: "18-24", value: 22 },
  { name: "25-34", value: 35 },
  { name: "35-44", value: 24 },
  { name: "45-54", value: 12 },
  { name: "55+", value: 7 },
];

const deviceData = [
  { name: "Mobile", value: 58 },
  { name: "Desktop", value: 34 },
  { name: "Tablet", value: 8 },
];

const geoData = [
  { country: "United States", users: 8200 },
  { country: "United Kingdom", users: 3100 },
  { country: "Canada", users: 2400 },
  { country: "Germany", users: 1800 },
  { country: "India", users: 1500 },
];

const COLORS = [
  "hsl(243, 75%, 59%)",
  "hsl(167, 72%, 50%)",
  "hsl(32, 95%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(200, 80%, 50%)",
];

const interests = [
  { name: "Technology", pct: 78 },
  { name: "Business", pct: 65 },
  { name: "Science", pct: 52 },
  { name: "Entertainment", pct: 41 },
  { name: "Health", pct: 38 },
];

export default function Audience() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Understand your audience demographics, behaviors, and preferences.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Age Distribution */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={demographicData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {demographicData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {deviceData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Regions */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Top Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={geoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem" }} />
                  <Bar dataKey="users" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Interest Areas */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Interest Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interests.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-card-foreground font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.pct}%</span>
                    </div>
                    <Progress value={item.pct} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
