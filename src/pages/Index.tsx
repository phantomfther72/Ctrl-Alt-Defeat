import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { InsightCard } from "@/components/InsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, TrendingUp, BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const trafficData = [
  { month: "Jan", views: 4200, unique: 2800 },
  { month: "Feb", views: 5100, unique: 3200 },
  { month: "Mar", views: 4800, unique: 3100 },
  { month: "Apr", views: 6200, unique: 4100 },
  { month: "May", views: 7500, unique: 4900 },
  { month: "Jun", views: 8100, unique: 5300 },
];

const categoryData = [
  { category: "Tech", articles: 45 },
  { category: "Finance", articles: 38 },
  { category: "Health", articles: 32 },
  { category: "Sports", articles: 28 },
  { category: "Politics", articles: 22 },
];

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Views" value="42.5K" change={12.5} icon={Eye} />
          <KpiCard title="Unique Visitors" value="18.2K" change={8.3} icon={Users} />
          <KpiCard title="Engagement Rate" value="64.7%" change={-2.1} icon={TrendingUp} />
          <KpiCard title="Articles Published" value="165" change={5.0} icon={BarChart3} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="shadow-card border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-base">Traffic Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(167, 72%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(220, 13%, 91%)",
                      boxShadow: "0 10px 30px -10px hsl(220, 30%, 10%, 0.1)",
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="hsl(243, 75%, 59%)" fill="url(#colorViews)" strokeWidth={2} />
                  <Area type="monotone" dataKey="unique" stroke="hsl(167, 72%, 50%)" fill="url(#colorUnique)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-base">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" width={60} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid hsl(220, 13%, 91%)",
                    }}
                  />
                  <Bar dataKey="articles" fill="hsl(243, 75%, 59%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Insights */}
        <div>
          <h3 className="font-heading text-base font-semibold mb-4 text-foreground">Recent Insights</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InsightCard
              title="Audience Growth Spike"
              description="Your tech category saw a 34% increase in unique visitors this week, primarily driven by mobile users."
              type="positive"
              metric="+34%"
              category="Audience"
            />
            <InsightCard
              title="Declining Engagement"
              description="Finance articles show a 12% drop in average time on page. Consider refreshing content format."
              type="negative"
              metric="-12%"
              category="Content"
            />
            <InsightCard
              title="Trending Topic Detected"
              description="AI-related content is gaining traction. Publishing more content in this area could boost engagement."
              type="neutral"
              category="Trends"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
