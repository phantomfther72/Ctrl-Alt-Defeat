import { AppLayout } from "@/components/AppLayout";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Newspaper, Package, Undo2, DollarSign, TrendingUp, MapPin,
  Calendar, AlertTriangle, ArrowRight, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line,
} from "recharts";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MonthlyStat {
  month: string;
  total_sales: number;
  total_returns: number;
  revenue: number;
  return_rate_pct: number;
  sell_through_pct: number;
}

interface LocationStat {
  location: string;
  sold: number;
  returned: number;
  revenue: number;
  returnRate: number;
}

interface DistEvent {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

const CHART_COLORS = {
  sold: "hsl(var(--chart-1))",
  returned: "hsl(var(--chart-4))",
  demand: "hsl(var(--chart-2))",
  revenue: "hsl(var(--chart-1))",
  sellThrough: "hsl(var(--chart-2))",
  returnRate: "hsl(var(--chart-4))",
};

const eventTypeBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  holiday: "default",
  school_event: "secondary",
  festive_season: "outline",
  campaign: "default",
  breaking_news: "destructive",
};

const Index = () => {
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [events, setEvents] = useState<DistEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [monthlyRes, cleanRes, eventsRes] = await Promise.all([
      supabase.from("monthly_summary").select("*").order("month", { ascending: true }),
      supabase.from("clean_data").select("shop_name, shop_id, quantity_sold, quantity_returned, revenue"),
      supabase.from("distribution_events").select("*").order("start_date", { ascending: false }).limit(10),
    ]);

    if (monthlyRes.data && monthlyRes.data.length > 0) {
      setMonthly(monthlyRes.data.map((m) => ({
        month: m.month,
        total_sales: Number(m.total_sales),
        total_returns: Number(m.total_returns),
        revenue: Number(m.revenue),
        return_rate_pct: Number(m.return_rate_pct),
        sell_through_pct: Number(m.sell_through_pct),
      })));
    }

    if (cleanRes.data && cleanRes.data.length > 0) {
      const agg: Record<string, LocationStat> = {};
      for (const r of cleanRes.data) {
        const loc = r.shop_name || r.shop_id;
        if (!agg[loc]) agg[loc] = { location: loc, sold: 0, returned: 0, revenue: 0, returnRate: 0 };
        agg[loc].sold += r.quantity_sold || 0;
        agg[loc].returned += r.quantity_returned || 0;
        agg[loc].revenue += Number(r.revenue || 0);
      }
      const stats = Object.values(agg).map((l) => ({
        ...l,
        returnRate: l.sold > 0 ? (l.returned / (l.sold + l.returned)) * 100 : 0,
      }));
      setLocations(stats.sort((a, b) => b.sold - a.sold));
    }

    if (eventsRes.data) {
      setEvents(eventsRes.data as DistEvent[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Aggregated KPIs
  const totalSold = monthly.reduce((s, m) => s + m.total_sales, 0);
  const totalReturned = monthly.reduce((s, m) => s + m.total_returns, 0);
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const avgSellThrough = monthly.length > 0
    ? monthly.reduce((s, m) => s + m.sell_through_pct, 0) / monthly.length
    : 0;

  // Month-over-month change for KPIs
  const calcChange = (field: keyof MonthlyStat) => {
    if (monthly.length < 2) return 0;
    const curr = Number(monthly[monthly.length - 1][field]);
    const prev = Number(monthly[monthly.length - 2][field]);
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Chart data
  const salesReturnsData = monthly.map((m) => ({
    month: m.month,
    sold: m.total_sales,
    returned: m.total_returns,
    demand: m.total_sales - m.total_returns,
  }));

  const efficiencyData = monthly.map((m) => ({
    month: m.month,
    sell_through: m.sell_through_pct,
    return_rate: m.return_rate_pct,
    revenue: m.revenue,
  }));

  const topLocations = locations.slice(0, 8).map((l) => ({
    name: l.location.length > 18 ? l.location.slice(0, 18) + "…" : l.location,
    fullName: l.location,
    demand: l.sold - l.returned,
    returnRate: l.returnRate,
  }));

  const highReturnLocations = [...locations]
    .filter((l) => l.returnRate > 15)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 5);

  const hasData = monthly.length > 0 || locations.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Distribution Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Historical sales, returns, and distribution event insights at a glance.
            </p>
          </div>
          {!hasData && !loading && (
            <Button onClick={() => navigate("/data-ingestion")} className="gap-2">
              <ArrowRight className="h-4 w-4" /> Upload Data
            </Button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasData && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-heading font-semibold text-foreground text-lg">No Distribution Data Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Upload your historical sales and returns dataset to populate the dashboard with demand trends, revenue analysis, and location-based insights.
              </p>
            </CardContent>
          </Card>
        )}

        {/* KPI Row */}
        {!loading && hasData && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Copies Sold"
                value={formatNum(totalSold)}
                change={Number(calcChange("total_sales").toFixed(1))}
                icon={Package}
              />
              <KpiCard
                title="Copies Returned"
                value={formatNum(totalReturned)}
                change={Number(calcChange("total_returns").toFixed(1))}
                icon={Undo2}
              />
              <KpiCard
                title="Total Revenue"
                value={`N$${formatNum(totalRevenue)}`}
                change={Number(calcChange("revenue").toFixed(1))}
                icon={DollarSign}
              />
              <KpiCard
                title="Sell-Through Rate"
                value={`${avgSellThrough.toFixed(1)}%`}
                change={Number(calcChange("sell_through_pct").toFixed(1))}
                icon={TrendingUp}
              />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Sales vs Returns Over Time */}
              <Card className="shadow-card border-border/50 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">Sales vs Returns Over Time</CardTitle>
                  <CardDescription className="text-xs">Monthly distributed, returned, and net demand</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={salesReturnsData}>
                      <defs>
                        <linearGradient id="gradDemand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.demand} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={CHART_COLORS.demand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="sold" fill={CHART_COLORS.sold} radius={[3, 3, 0, 0]} name="Sold" opacity={0.7} />
                      <Bar dataKey="returned" fill={CHART_COLORS.returned} radius={[3, 3, 0, 0]} name="Returned" opacity={0.7} />
                      <Area type="monotone" dataKey="demand" fill="url(#gradDemand)" stroke={CHART_COLORS.demand} strokeWidth={2} name="Net Demand" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Distribution Points */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Top Locations
                  </CardTitle>
                  <CardDescription className="text-xs">By net demand (sold − returned)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topLocations} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} />
                      <Bar dataKey="demand" radius={[0, 4, 4, 0]} name="Net Demand">
                        {topLocations.map((_, i) => (
                          <Cell key={i} fill={i < 3 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Efficiency & Revenue Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sell-Through & Return Rate */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base">Distribution Efficiency</CardTitle>
                  <CardDescription className="text-xs">Sell-through vs return rate trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={efficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Legend />
                      <Area type="monotone" dataKey="sell_through" stroke={CHART_COLORS.sellThrough} fill={CHART_COLORS.sellThrough} fillOpacity={0.1} strokeWidth={2} name="Sell-Through %" />
                      <Area type="monotone" dataKey="return_rate" stroke={CHART_COLORS.returnRate} fill={CHART_COLORS.returnRate} fillOpacity={0.1} strokeWidth={2} name="Return Rate %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Trend */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Monthly revenue from newspaper sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={efficiencyData}>
                      <defs>
                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: number) => `N$${v.toLocaleString()}`} />
                      <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} fill="url(#gradRev)" strokeWidth={2.5} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row: Events + High Return Locations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Distribution Events */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Distribution Events
                    </CardTitle>
                    <CardDescription className="text-xs">Holidays, campaigns & breaking news that influence demand</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/distribution")} className="text-xs text-primary">
                    Manage <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Add holidays, campaigns, or breaking news events to track their impact on demand.</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[280px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Event</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((ev) => (
                            <TableRow key={ev.id}>
                              <TableCell className="text-sm font-medium py-2">{ev.event_name}</TableCell>
                              <TableCell className="py-2">
                                <Badge variant={eventTypeBadge[ev.event_type] || "secondary"} className="text-[10px] capitalize">
                                  {ev.event_type.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground py-2">
                                {new Date(ev.start_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                {ev.start_date !== ev.end_date && ` – ${new Date(ev.end_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* High Return Locations Alert */}
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Over-Distribution Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">Locations with return rates above 15%</CardDescription>
                </CardHeader>
                <CardContent>
                  {highReturnLocations.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">All locations within healthy return rates.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[280px] overflow-auto">
                      {highReturnLocations.map((loc) => (
                        <div key={loc.location} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{loc.location}</p>
                              <p className="text-xs text-muted-foreground">
                                {loc.returned.toLocaleString()} returned of {(loc.sold + loc.returned).toLocaleString()} distributed
                              </p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0 ml-2">
                            {loc.returnRate.toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/demand-trends")} className="gap-2 text-xs">
                <TrendingUp className="h-3.5 w-3.5" /> AI Trend Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/forecasting")} className="gap-2 text-xs">
                <Newspaper className="h-3.5 w-3.5" /> Forecasting
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/insights")} className="gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5" /> AI Insights
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
