import { AppLayout } from "@/components/AppLayout";
import { InsightCard } from "@/components/InsightCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type InsightType = "positive" | "negative" | "warning" | "neutral";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  metric: string | null;
  category: string | null;
}

export default function Insights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      const { data } = await supabase
        .from("insights")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) {
        setInsights(
          data.map((r) => ({
            ...r,
            type: (["positive", "negative", "warning", "neutral"].includes(r.type) ? r.type : "neutral") as InsightType,
          }))
        );
      }
      setLoading(false);
    }
    fetchInsights();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          AI-generated insights based on your data patterns and trends.
        </p>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                description={insight.description}
                type={insight.type}
                metric={insight.metric ?? undefined}
                category={insight.category ?? undefined}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
