import { AppLayout } from "@/components/AppLayout";
import { InsightCard } from "@/components/InsightCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
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
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insights");

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        toast({
          title: "Generation failed",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Insights generated",
          description: `${data.count} new insights created from your data.`,
        });
        await fetchInsights();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            AI-generated insights based on your data patterns and trends.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInsights}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {generating ? "Analyzing data..." : "Generate Insights"}
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No insights yet. Click "Generate Insights" to analyze your data with AI.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {generating ? "Analyzing..." : "Generate Insights"}
            </Button>
          </div>
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
