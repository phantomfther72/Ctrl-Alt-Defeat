import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const channelPerformance = [
  { channel: "Email", sent: 12500, opened: 4800, clicked: 1200 },
  { channel: "Social", sent: 45000, opened: 8200, clicked: 2100 },
  { channel: "Push", sent: 8900, opened: 3200, clicked: 890 },
  { channel: "RSS", sent: 6200, opened: 2100, clicked: 650 },
];

const campaigns = [
  { name: "Weekly Digest", status: "active", reach: 85, engagement: 42 },
  { name: "Breaking News Alerts", status: "active", reach: 72, engagement: 68 },
  { name: "Monthly Roundup", status: "scheduled", reach: 0, engagement: 0 },
  { name: "Sponsored Content", status: "paused", reach: 45, engagement: 18 },
];

const statusColors: Record<string, string> = {
  active: "bg-kpi-up/10 text-kpi-up",
  scheduled: "bg-primary/10 text-primary",
  paused: "bg-muted text-muted-foreground",
};

export default function Distribution() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Monitor content distribution channels and campaign performance.
        </p>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(220, 13%, 91%)" }} />
                <Bar dataKey="sent" fill="hsl(220, 14%, 80%)" radius={[4, 4, 0, 0]} name="Sent" />
                <Bar dataKey="opened" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} name="Opened" />
                <Bar dataKey="clicked" fill="hsl(167, 72%, 50%)" radius={[4, 4, 0, 0]} name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-base">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.name} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground">{campaign.name}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.reach > 0 && (
                      <div className="flex gap-6">
                        <div>
                          <span className="text-xs text-muted-foreground">Reach: </span>
                          <span className="text-xs font-medium text-card-foreground">{campaign.reach}%</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Engagement: </span>
                          <span className="text-xs font-medium text-card-foreground">{campaign.engagement}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {campaign.reach > 0 && (
                    <div className="w-32">
                      <Progress value={campaign.engagement} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
