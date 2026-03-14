import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyStat {
  month: string;
  total_sales: number;
  total_returns: number;
  revenue: number;
  return_rate_pct: number;
  sell_through_pct: number;
  forecast_revenue: number;
}

export interface LocationStat {
  location: string;
  sold: number;
  returned: number;
  revenue: number;
  returnRate: number;
}

export function useDistributionData() {
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [monthlyRes, cleanRes] = await Promise.all([
      supabase.from("monthly_summary").select("*").order("month", { ascending: true }),
      supabase.from("clean_data").select("shop_name, shop_id, quantity_sold, quantity_returned, revenue"),
    ]);

    if (monthlyRes.data && monthlyRes.data.length > 0) {
      setMonthly(monthlyRes.data.map((m) => ({
        month: m.month,
        total_sales: Number(m.total_sales),
        total_returns: Number(m.total_returns),
        revenue: Number(m.revenue),
        return_rate_pct: Number(m.return_rate_pct),
        sell_through_pct: Number(m.sell_through_pct),
        forecast_revenue: Number(m.forecast_revenue),
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

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregated KPIs
  const totalSold = monthly.reduce((s, m) => s + m.total_sales, 0);
  const totalReturned = monthly.reduce((s, m) => s + m.total_returns, 0);
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const avgSellThrough = monthly.length > 0
    ? monthly.reduce((s, m) => s + m.sell_through_pct, 0) / monthly.length
    : 0;

  const calcChange = (field: keyof MonthlyStat) => {
    if (monthly.length < 2) return 0;
    const curr = Number(monthly[monthly.length - 1][field]);
    const prev = Number(monthly[monthly.length - 2][field]);
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  };

  const hasData = monthly.length > 0 || locations.length > 0;

  return {
    monthly,
    locations,
    loading,
    refetch: fetchData,
    totalSold,
    totalReturned,
    totalRevenue,
    avgSellThrough,
    calcChange,
    hasData,
  };
}
