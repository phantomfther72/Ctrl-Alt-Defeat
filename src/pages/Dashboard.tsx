import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, TrendingUp, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const trendData = [
  { day: "Mon", pageviews: 3200, sessions: 1800 },
  { day: "Tue", pageviews: 4100, sessions: 2200 },
  { day: "Wed", pageviews: 3800, sessions: 2100 },
  { day: "Thu", pageviews: 5200, sessions: 2900 },
  { day: "Fri", pageviews: 4600, sessions: 2500 },
  { day: "Sat", pageviews: 3100, sessions: 1700 },
  { day: "Sun", pageviews: 2800, sessions: 1500 },
];

const sourceData = [
  { name: "Organic Search", value: 42 },
  { name: "Social Media", value: 28 },
  { name: "Direct", value: 18 },
  { name: "Referral", value: 12 },
];

const COLORS = [
  "hsl(243, 75%, 59%)",
  "hsl(167, 72%, 50%)",
  "hsl(32, 95%, 55%)",
  "hsl(340, 75%, 55%)",
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Page Views" value="28.4K" change={15.2} icon={Eye} />
          <KpiCard title="Active Users" value="3.2K" change={7.8} icon={Users} />
          <KpiCard title="Bounce Rate" value="32.1%" change={-4.5} icon={TrendingUp} />
          <KpiCard title="Avg. Session" value="4m 23s" change={11.2} icon={BarChart3} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="shadow-card border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-base">Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)" }} />
                  <Area type="monotone" dataKey="pageviews" stroke="hsl(243, 75%, 59%)" fill="url(#gradPV)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sessions" stroke="hsl(167, 72%, 50%)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {sourceData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-card-foreground">{item.value}%</span>
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
