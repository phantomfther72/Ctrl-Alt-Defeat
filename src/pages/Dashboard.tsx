import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, TrendingUp, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const COLORS = [
  "hsl(243, 75%, 59%)",
  "hsl(167, 72%, 50%)",
  "hsl(32, 95%, 55%)",
  "hsl(340, 75%, 55%)",
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Dashboard() {
  const [trendData, setTrendData] = useState<{ day: string; pageviews: number; sessions: number }[]>([]);
  const [sourceData, setSourceData] = useState<{ name: string; value: number }[]>([]);
  const [kpis, setKpis] = useState({ pageviews: 0, users: 0, bounceRate: 0, avgSession: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [analyticsRes, sourcesRes] = await Promise.all([
        supabase.from("analytics_data").select("*").order("date", { ascending: true }).limit(7),
        supabase.from("traffic_sources").select("*").order("percentage", { ascending: false }),
      ]);

      if (analyticsRes.data && analyticsRes.data.length > 0) {
        const trends = analyticsRes.data.map((row) => ({
          day: dayNames[new Date(row.date).getUTCDay()],
          pageviews: row.pageviews,
          sessions: row.sessions,
        }));
        setTrendData(trends);

        const totalPV = analyticsRes.data.reduce((s, r) => s + r.pageviews, 0);
        const totalSessions = analyticsRes.data.reduce((s, r) => s + r.sessions, 0);
        const avgBounce = analyticsRes.data.reduce((s, r) => s + (r.bounce_rate ?? 0), 0) / analyticsRes.data.length;
        const avgDuration = analyticsRes.data.reduce((s, r) => s + (r.avg_session_duration ?? 0), 0) / analyticsRes.data.length;

        setKpis({
          pageviews: totalPV,
          users: totalSessions,
          bounceRate: Number(avgBounce.toFixed(1)),
          avgSession: Math.round(avgDuration),
        });
      }

      if (sourcesRes.data) {
        setSourceData(sourcesRes.data.map((r) => ({ name: r.name, value: Number(r.percentage) })));
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Page Views" value={loading ? "..." : formatNumber(kpis.pageviews)} change={15.2} icon={Eye} />
          <KpiCard title="Active Users" value={loading ? "..." : formatNumber(kpis.users)} change={7.8} icon={Users} />
          <KpiCard title="Bounce Rate" value={loading ? "..." : `${kpis.bounceRate}%`} change={-4.5} icon={TrendingUp} />
          <KpiCard title="Avg. Session" value={loading ? "..." : formatDuration(kpis.avgSession)} change={11.2} icon={BarChart3} />
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
