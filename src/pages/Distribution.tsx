import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend,
} from "recharts";
import {
  Mail, Share2, Bell, Rss, TrendingUp, TrendingDown, Users, Eye,
  MousePointerClick, Clock, Zap, Calendar, Play, Pause, RotateCcw,
  ArrowUpRight, Target, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data ---
const kpis = [
  { label: "Total Reach", value: "72,600", change: "+12.4%", up: true, icon: Users },
  { label: "Avg Open Rate", value: "38.2%", change: "+3.1%", up: true, icon: Eye },
  { label: "Click-Through Rate", value: "6.8%", change: "-0.4%", up: false, icon: MousePointerClick },
  { label: "Avg Delivery Time", value: "1.2s", change: "-0.3s", up: true, icon: Clock },
];

const channelPerformance = [
  { channel: "Email", sent: 12500, opened: 4800, clicked: 1200, icon: Mail },
  { channel: "Social", sent: 45000, opened: 8200, clicked: 2100, icon: Share2 },
  { channel: "Push", sent: 8900, opened: 3200, clicked: 890, icon: Bell },
  { channel: "RSS", sent: 6200, opened: 2100, clicked: 650, icon: Rss },
];

const channelBreakdown = [
  { name: "Email", value: 32, color: "hsl(243, 75%, 59%)" },
  { name: "Social", value: 42, color: "hsl(167, 72%, 50%)" },
  { name: "Push", value: 16, color: "hsl(32, 95%, 55%)" },
  { name: "RSS", value: 10, color: "hsl(340, 75%, 55%)" },
];

const engagementTrend = [
  { date: "Mon", email: 38, social: 22, push: 45, rss: 30 },
  { date: "Tue", email: 42, social: 25, push: 40, rss: 28 },
  { date: "Wed", email: 35, social: 30, push: 48, rss: 32 },
  { date: "Thu", email: 48, social: 28, push: 42, rss: 35 },
  { date: "Fri", email: 52, social: 35, push: 38, rss: 30 },
  { date: "Sat", email: 30, social: 42, push: 32, rss: 25 },
  { date: "Sun", email: 28, social: 48, push: 28, rss: 22 },
];

const campaigns = [
  { name: "Weekly Digest", status: "active", reach: 85, engagement: 42, channel: "Email", nextRun: "Tomorrow 9AM", sent: 12500 },
  { name: "Breaking News Alerts", status: "active", reach: 72, engagement: 68, channel: "Push", nextRun: "On trigger", sent: 8900 },
  { name: "Monthly Roundup", status: "scheduled", reach: 0, engagement: 0, channel: "Email", nextRun: "Mar 30", sent: 0 },
  { name: "Social Highlights", status: "active", reach: 64, engagement: 35, channel: "Social", nextRun: "Daily 12PM", sent: 45000 },
  { name: "Sponsored Content", status: "paused", reach: 45, engagement: 18, channel: "Social", nextRun: "—", sent: 3200 },
  { name: "RSS Auto-Publish", status: "active", reach: 58, engagement: 28, channel: "RSS", nextRun: "On publish", sent: 6200 },
];

const abTests = [
  { name: "Subject Line A/B", variant: "Variant B", lift: "+14.2%", confidence: 96, status: "winner", metric: "Open Rate" },
  { name: "CTA Placement", variant: "Top CTA", lift: "+8.7%", confidence: 89, status: "running", metric: "CTR" },
  { name: "Send Time Test", variant: "9AM Slot", lift: "+5.1%", confidence: 72, status: "running", metric: "Opens" },
];

const statusConfig: Record<string, { color: string; icon: typeof Play }> = {
  active: { color: "text-kpi-up", icon: Play },
  scheduled: { color: "text-primary", icon: Calendar },
  paused: { color: "text-muted-foreground", icon: Pause },
};

const statusBadgeColors: Record<string, string> = {
  active: "bg-kpi-up/10 text-kpi-up border-kpi-up/20",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  paused: "bg-muted text-muted-foreground border-border",
};

const channelIcons: Record<string, typeof Mail> = {
  Email: Mail, Social: Share2, Push: Bell, RSS: Rss,
};

export default function Distribution() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Monitor distribution channels, campaigns, and optimize delivery performance.
          </p>
          <Button size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> New Campaign
          </Button>
        </div>

        {/* KPI Row */}
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
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-heading font-bold text-card-foreground">{kpi.value}</span>
                    <span className={cn("text-xs font-semibold mb-0.5", kpi.up ? "text-kpi-up" : "text-kpi-down")}>
                      {kpi.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Channel Performance Bar Chart */}
          <Card className="shadow-card border-border/50 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Channel Performance</CardTitle>
              <CardDescription className="text-xs">Sent vs opened vs clicked across channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={channelPerformance} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="channel" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }} />
                  <Bar dataKey="sent" fill="hsl(220, 14%, 80%)" radius={[3, 3, 0, 0]} name="Sent" />
                  <Bar dataKey="opened" fill="hsl(243, 75%, 59%)" radius={[3, 3, 0, 0]} name="Opened" />
                  <Bar dataKey="clicked" fill="hsl(167, 72%, 50%)" radius={[3, 3, 0, 0]} name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Channel Breakdown Pie */}
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Channel Mix</CardTitle>
              <CardDescription className="text-xs">Distribution share by channel</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={channelBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" stroke="none">
                    {channelBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {channelBreakdown.map((ch) => (
                  <div key={ch.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                    {ch.name} ({ch.value}%)
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Trend */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Weekly Engagement Trend</CardTitle>
            <CardDescription className="text-xs">Open rate % by channel over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" unit="%" />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="email" stroke="hsl(243, 75%, 59%)" fill="hsl(243, 75%, 59%)" fillOpacity={0.1} strokeWidth={2} name="Email" />
                <Area type="monotone" dataKey="social" stroke="hsl(167, 72%, 50%)" fill="hsl(167, 72%, 50%)" fillOpacity={0.1} strokeWidth={2} name="Social" />
                <Area type="monotone" dataKey="push" stroke="hsl(32, 95%, 55%)" fill="hsl(32, 95%, 55%)" fillOpacity={0.1} strokeWidth={2} name="Push" />
                <Area type="monotone" dataKey="rss" stroke="hsl(340, 75%, 55%)" fill="hsl(340, 75%, 55%)" fillOpacity={0.1} strokeWidth={2} name="RSS" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaigns & A/B Tests Tabs */}
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4">
            <Card className="shadow-card border-border/50">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {campaigns.map((c) => {
                    const ChIcon = channelIcons[c.channel] || Mail;
                    const sConf = statusConfig[c.status] || statusConfig.active;
                    return (
                      <div key={c.name} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10")}>
                            <ChIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-card-foreground truncate">{c.name}</p>
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusBadgeColors[c.status])}>
                                {c.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">{c.channel}</span>
                              <span className="text-[11px] text-muted-foreground">Next: {c.nextRun}</span>
                              {c.sent > 0 && <span className="text-[11px] text-muted-foreground">{c.sent.toLocaleString()} sent</span>}
                            </div>
                          </div>
                        </div>
                        {c.reach > 0 ? (
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Reach</p>
                              <p className="text-sm font-semibold text-card-foreground">{c.reach}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Engagement</p>
                              <p className="text-sm font-semibold text-card-foreground">{c.engagement}%</p>
                            </div>
                            <div className="w-24">
                              <Progress value={c.engagement} className="h-1.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not yet started</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abtests" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              {abTests.map((test) => (
                <Card key={test.name} className={cn(
                  "shadow-card border-border/50 border-l-4",
                  test.status === "winner" ? "border-l-kpi-up" : "border-l-chart-3"
                )}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-card-foreground">{test.name}</p>
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0 border",
                        test.status === "winner" ? "bg-kpi-up/10 text-kpi-up border-kpi-up/20" : "bg-chart-3/10 text-chart-3 border-chart-3/20"
                      )}>
                        {test.status === "winner" ? "Winner" : "Running"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Leading Variant</span>
                        <span className="font-medium text-card-foreground">{test.variant}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Metric</span>
                        <span className="font-medium text-card-foreground">{test.metric}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Lift</span>
                        <span className="font-semibold text-kpi-up">{test.lift}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium text-card-foreground">{test.confidence}%</span>
                      </div>
                      <Progress value={test.confidence} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Channel Settings */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Channel Settings</CardTitle>
            <CardDescription className="text-xs">Toggle channels and configure delivery preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {channelPerformance.map((ch) => {
                const Icon = ch.icon;
                const openRate = ((ch.opened / ch.sent) * 100).toFixed(1);
                const ctr = ((ch.clicked / ch.sent) * 100).toFixed(1);
                return (
                  <div key={ch.channel} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary/10">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{ch.channel}</p>
                        <p className="text-[11px] text-muted-foreground">{openRate}% open · {ctr}% CTR</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
