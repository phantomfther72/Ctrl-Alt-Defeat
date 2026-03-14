import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch clean_data and events
    const [cleanRes, eventsRes, monthlyRes] = await Promise.all([
      supabase.from("clean_data").select("*").order("month", { ascending: true }),
      supabase.from("distribution_events").select("*").order("start_date", { ascending: true }),
      supabase.from("monthly_summary").select("*").order("month", { ascending: true }),
    ]);

    const cleanData = cleanRes.data || [];
    if (cleanData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data available. Upload a dataset first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aggregate by location
    const locAgg: Record<string, any> = {};
    for (const r of cleanData) {
      const loc = r.shop_name || r.shop_id;
      if (!locAgg[loc]) locAgg[loc] = { location: loc, sold: 0, returned: 0, revenue: 0, months: {} };
      locAgg[loc].sold += r.quantity_sold || 0;
      locAgg[loc].returned += r.quantity_returned || 0;
      locAgg[loc].revenue += Number(r.revenue || 0);
      if (!locAgg[loc].months[r.month]) locAgg[loc].months[r.month] = { sold: 0, returned: 0, revenue: 0 };
      locAgg[loc].months[r.month].sold += r.quantity_sold || 0;
      locAgg[loc].months[r.month].returned += r.quantity_returned || 0;
      locAgg[loc].months[r.month].revenue += Number(r.revenue || 0);
    }

    const locationStats = Object.values(locAgg).map((l: any) => ({
      ...l,
      delivered: l.sold + l.returned,
      returnRate: l.sold + l.returned > 0 ? ((l.returned / (l.sold + l.returned)) * 100).toFixed(1) : "0",
      sellThrough: l.sold + l.returned > 0 ? ((l.sold / (l.sold + l.returned)) * 100).toFixed(1) : "0",
      monthlyData: Object.entries(l.months).map(([month, data]: [string, any]) => ({ month, ...data })),
    }));

    const totalSold = locationStats.reduce((s: number, l: any) => s + l.sold, 0);
    const totalReturned = locationStats.reduce((s: number, l: any) => s + l.returned, 0);
    const totalRevenue = locationStats.reduce((s: number, l: any) => s + l.revenue, 0);

    const prompt = `You are an expert newspaper distribution demand/supply analyst. Analyze this regional data and determine optimal distribution activities for each region.

REGIONAL DATA:
- Total outlets: ${locationStats.length}
- Total sold: ${totalSold}, Total returned: ${totalReturned}, Total revenue: N$${totalRevenue.toFixed(0)}
- Overall sell-through: ${totalSold + totalReturned > 0 ? ((totalSold / (totalSold + totalReturned)) * 100).toFixed(1) : 0}%

LOCATION BREAKDOWN:
${JSON.stringify(locationStats.map((l: any) => ({
  location: l.location,
  sold: l.sold,
  returned: l.returned,
  revenue: l.revenue,
  returnRate: l.returnRate,
  sellThrough: l.sellThrough,
  monthlyData: l.monthlyData,
})), null, 2)}

DISTRIBUTION EVENTS:
${JSON.stringify(eventsRes.data || [], null, 2)}

MONTHLY SUMMARY:
${JSON.stringify(monthlyRes.data || [], null, 2)}

For each region, determine:
1. Demand classification (high/medium/low) based on volume and trend
2. Supply efficiency (over-supplied/balanced/under-supplied) based on return rates
3. Recommended action (increase supply/maintain/reduce supply/investigate)
4. AI confidence level (0-100) based on data quality and consistency
5. Key reasoning factors that led to the determination

Also provide:
- Overall demand/supply balance assessment
- Risk regions needing immediate attention
- Growth opportunity regions
- Specific AI decision factors and thresholds used`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a demand/supply optimization AI for newspaper distribution networks." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "regional_analysis",
              description: "Return structured regional demand/supply analysis",
              parameters: {
                type: "object",
                properties: {
                  overall_assessment: {
                    type: "object",
                    properties: {
                      balance_status: { type: "string", enum: ["over-supplied", "balanced", "under-supplied"] },
                      network_health_score: { type: "number", description: "0-100 score" },
                      summary: { type: "string" },
                      total_waste_pct: { type: "number", description: "Percentage of total supply wasted via returns" },
                    },
                    required: ["balance_status", "network_health_score", "summary", "total_waste_pct"],
                  },
                  ai_decision_factors: {
                    type: "array",
                    description: "The key factors and thresholds the AI uses to classify regions",
                    items: {
                      type: "object",
                      properties: {
                        factor_name: { type: "string" },
                        description: { type: "string" },
                        threshold: { type: "string" },
                        weight: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["factor_name", "description", "threshold", "weight"],
                    },
                  },
                  region_analyses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                        demand_level: { type: "string", enum: ["high", "medium", "low"] },
                        supply_status: { type: "string", enum: ["over-supplied", "balanced", "under-supplied"] },
                        recommended_action: { type: "string", enum: ["increase_supply", "maintain", "reduce_supply", "investigate"] },
                        ai_confidence: { type: "number", description: "0-100" },
                        reasoning: { type: "string", description: "Why the AI made this determination" },
                        demand_score: { type: "number", description: "0-100 demand strength score" },
                        efficiency_score: { type: "number", description: "0-100 supply efficiency score" },
                        risk_level: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["location", "demand_level", "supply_status", "recommended_action", "ai_confidence", "reasoning", "demand_score", "efficiency_score", "risk_level"],
                    },
                  },
                  risk_regions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                        risk_type: { type: "string" },
                        description: { type: "string" },
                        urgency: { type: "string", enum: ["immediate", "short-term", "monitor"] },
                      },
                      required: ["location", "risk_type", "description", "urgency"],
                    },
                  },
                  growth_opportunities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                        opportunity_type: { type: "string" },
                        potential_impact: { type: "string" },
                        recommended_investment: { type: "string" },
                      },
                      required: ["location", "opportunity_type", "potential_impact", "recommended_investment"],
                    },
                  },
                },
                required: ["overall_assessment", "ai_decision_factors", "region_analyses", "risk_regions", "growth_opportunities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "regional_analysis" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status} ${errText}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        location_stats: locationStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-regional error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
