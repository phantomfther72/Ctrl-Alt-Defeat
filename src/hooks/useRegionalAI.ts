import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RegionAnalysis {
  location: string;
  demand_level: "high" | "medium" | "low";
  supply_status: "over-supplied" | "balanced" | "under-supplied";
  recommended_action: "increase_supply" | "maintain" | "reduce_supply" | "investigate";
  ai_confidence: number;
  reasoning: string;
  demand_score: number;
  efficiency_score: number;
  risk_level: "high" | "medium" | "low";
}

export interface AIDecisionFactor {
  factor_name: string;
  description: string;
  threshold: string;
  weight: "high" | "medium" | "low";
}

export interface RiskRegion {
  location: string;
  risk_type: string;
  description: string;
  urgency: "immediate" | "short-term" | "monitor";
}

export interface GrowthOpportunity {
  location: string;
  opportunity_type: string;
  potential_impact: string;
  recommended_investment: string;
}

export interface OverallAssessment {
  balance_status: "over-supplied" | "balanced" | "under-supplied";
  network_health_score: number;
  summary: string;
  total_waste_pct: number;
}

export interface RegionalAIResult {
  overall_assessment: OverallAssessment;
  ai_decision_factors: AIDecisionFactor[];
  region_analyses: RegionAnalysis[];
  risk_regions: RiskRegion[];
  growth_opportunities: GrowthOpportunity[];
}

export interface LocationStat {
  location: string;
  sold: number;
  returned: number;
  revenue: number;
  delivered: number;
  returnRate: string;
  sellThrough: string;
  monthlyData: { month: string; sold: number; returned: number; revenue: number }[];
}

export function useRegionalAI() {
  const [analysis, setAnalysis] = useState<RegionalAIResult | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-regional");

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      setLocationStats(data.location_stats || []);
      setHasRun(true);
      toast({ title: "AI Analysis Complete", description: "Regional demand/supply analysis generated successfully." });
    } catch (e: any) {
      console.error("Regional AI error:", e);
      toast({ title: "Analysis Failed", description: e.message || "Could not generate analysis.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, locationStats, loading, hasRun, runAnalysis };
}
