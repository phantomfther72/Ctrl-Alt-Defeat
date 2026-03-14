import { AppLayout } from "@/components/AppLayout";
import { InsightCard } from "@/components/InsightCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InsightType = "positive" | "negative" | "warning" | "neutral";
type Priority = "high" | "medium" | "low";

interface Insight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  metric: string | null;
  category: string | null;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  priority: Priority;
  category: string;
}

function parseCategory(cat: string | null): { isRec: boolean; label: string } {
  if (cat && cat.startsWith("Rec:")) {
    return { isRec: true, label: cat.slice(4) };
  }
  return { isRec: false, label: cat || "" };
}

function typeToPriority(type: string): Priority {
  if (type === "warning") return "high";
  if (type === "positive") return "low";
  return "medium";
}

export default function Insights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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
      const insightItems: Insight[] = [];
      const recItems: Recommendation[] = [];

      data.forEach((r) => {
        const { isRec, label } = parseCategory(r.category);
        if (isRec) {
          recItems.push({
            id: r.id,
            title: r.title,
            description: r.description,
            expectedImpact: r.metric || "TBD",
            priority: typeToPriority(r.type),
            category: label,
          });
        } else {
          insightItems.push({
            ...r,
            type: (["positive", "negative", "warning", "neutral"].includes(r.type) ? r.type : "neutral") as InsightType,
          });
        }
      });

      setInsights(insightItems);
      setRecommendations(recItems);
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

      if (error) throw new Error(error.message);

      if (data?.error) {
        toast({ title: "Generation failed", description: data.error, variant: "destructive" });
      } else {
        toast({
          title: "Analysis complete",
          description: `${data.count} insights and ${data.recommendations_count} recommendations generated.`,
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

  const hasContent = insights.length > 0 || recommendations.length > 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            AI-generated insights and business intelligence recommendations.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {generating ? "Analyzing data..." : "Generate Analysis"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No insights yet. Click "Generate Analysis" to analyze your data with AI.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {generating ? "Analyzing..." : "Generate Analysis"}
            </Button>
          </div>
        ) : (
          <>
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">BI Recommendations</h2>
                  <span className="text-xs text-muted-foreground">({recommendations.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      title={rec.title}
                      description={rec.description}
                      expectedImpact={rec.expectedImpact}
                      priority={rec.priority}
                      category={rec.category}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Insights Section */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">Data Insights</h2>
                  <span className="text-xs text-muted-foreground">({insights.length})</span>
                </div>
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
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
