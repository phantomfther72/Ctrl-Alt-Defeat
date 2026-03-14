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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all clean_data
    const { data: cleanData, error: cleanErr } = await supabase
      .from("clean_data")
      .select("*")
      .order("month", { ascending: true });

    if (cleanErr) throw cleanErr;
    if (!cleanData || cleanData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data available. Please upload a dataset first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch distribution events
    const { data: events } = await supabase
      .from("distribution_events")
      .select("*")
      .order("start_date", { ascending: true });

    // Fetch monthly summary
    const { data: monthlySummary } = await supabase
      .from("monthly_summary")
      .select("*")
      .order("month", { ascending: true });

    // Build a summary for AI analysis
    const dataSummary = {
      totalRecords: cleanData.length,
      months: [...new Set(cleanData.map((r: any) => r.month))],
      locations: [...new Set(cleanData.map((r: any) => r.shop_name || r.shop_id))],
      totalSold: cleanData.reduce((s: number, r: any) => s + (r.quantity_sold || 0), 0),
      totalReturned: cleanData.reduce((s: number, r: any) => s + (r.quantity_returned || 0), 0),
      totalRevenue: cleanData.reduce((s: number, r: any) => s + Number(r.revenue || 0), 0),
      monthlySummary: monthlySummary || [],
      events: events || [],
      // Location-level aggregates
      locationStats: Object.values(
        cleanData.reduce((acc: any, r: any) => {
          const loc = r.shop_name || r.shop_id;
          if (!acc[loc]) acc[loc] = { location: loc, sold: 0, returned: 0, revenue: 0, months: 0 };
          acc[loc].sold += r.quantity_sold || 0;
          acc[loc].returned += r.quantity_returned || 0;
          acc[loc].revenue += Number(r.revenue || 0);
          acc[loc].months += 1;
          return acc;
        }, {})
      ),
    };

    const prompt = `You are a newspaper distribution analytics expert. Analyze this data and produce a comprehensive demand & revenue trend analysis.

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

Provide analysis using the tool provided. Generate insights covering:
1. Overall demand trend (growing/declining/stable) with growth rate
2. Revenue trend with growth rate  
3. Top 5 performing locations by demand
4. Top 5 locations with highest return rates (over-distribution)
5. Seasonal patterns if distribution events are present
6. Specific recommendations for optimizing distribution

Return structured results via the tool call.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a data analyst specializing in newspaper distribution optimization." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "store_trend_analysis",
              description: "Store the trend analysis results",
              parameters: {
                type: "object",
                properties: {
                  demand_trend: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["growing", "declining", "stable"] },
                      growth_rate_pct: { type: "number" },
                      summary: { type: "string" },
                    },
                    required: ["direction", "growth_rate_pct", "summary"],
                  },
                  revenue_trend: {
                    type: "object",
                    properties: {
                      direction: { type: "string", enum: ["growing", "declining", "stable"] },
                      growth_rate_pct: { type: "number" },
                      total_revenue: { type: "number" },
                      summary: { type: "string" },
                    },
                    required: ["direction", "growth_rate_pct", "total_revenue", "summary"],
                  },
                  top_locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                        demand: { type: "number" },
                        revenue: { type: "number" },
                        return_rate_pct: { type: "number" },
                      },
                      required: ["location", "demand", "revenue", "return_rate_pct"],
                    },
                  },
                  high_return_locations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                        return_rate_pct: { type: "number" },
                        total_returned: { type: "number" },
                        recommendation: { type: "string" },
                      },
                      required: ["location", "return_rate_pct", "total_returned", "recommendation"],
                    },
                  },
                  seasonal_patterns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string" },
                        impact: { type: "string" },
                        affected_months: { type: "string" },
                      },
                      required: ["pattern", "impact", "affected_months"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        expected_impact: { type: "string" },
                      },
                      required: ["title", "description", "priority", "expected_impact"],
                    },
                  },
                },
                required: [
                  "demand_trend",
                  "revenue_trend",
                  "top_locations",
                  "high_return_locations",
                  "seasonal_patterns",
                  "recommendations",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "store_trend_analysis" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Clear old trend analysis
    await supabase.from("trend_analysis").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Store results
    const rows: any[] = [];

    // Demand trend
    rows.push({
      analysis_type: "demand",
      metric_name: "overall_trend",
      metric_value: analysis.demand_trend.growth_rate_pct,
      trend_direction: analysis.demand_trend.direction,
      insight: analysis.demand_trend.summary,
    });

    // Revenue trend
    rows.push({
      analysis_type: "revenue",
      metric_name: "overall_trend",
      metric_value: analysis.revenue_trend.growth_rate_pct,
      trend_direction: analysis.revenue_trend.direction,
      insight: analysis.revenue_trend.summary,
    });
    rows.push({
      analysis_type: "revenue",
      metric_name: "total_revenue",
      metric_value: analysis.revenue_trend.total_revenue,
      insight: analysis.revenue_trend.summary,
    });

    // Top locations
    for (const loc of analysis.top_locations || []) {
      rows.push({
        analysis_type: "location_demand",
        location: loc.location,
        metric_name: "demand",
        metric_value: loc.demand,
        insight: `Revenue: N$${loc.revenue.toLocaleString()}, Return rate: ${loc.return_rate_pct}%`,
      });
    }

    // High return locations
    for (const loc of analysis.high_return_locations || []) {
      rows.push({
        analysis_type: "location_returns",
        location: loc.location,
        metric_name: "return_rate",
        metric_value: loc.return_rate_pct,
        insight: loc.recommendation,
      });
    }

    // Seasonal patterns
    for (const p of analysis.seasonal_patterns || []) {
      rows.push({
        analysis_type: "seasonal",
        metric_name: p.pattern,
        metric_value: 0,
        period: p.affected_months,
        insight: p.impact,
      });
    }

    // Recommendations
    for (const r of analysis.recommendations || []) {
      rows.push({
        analysis_type: "recommendation",
        metric_name: r.title,
        metric_value: 0,
        trend_direction: r.priority,
        insight: `${r.description} | Expected impact: ${r.expected_impact}`,
      });
    }

    if (rows.length > 0) {
      const { error: insertErr } = await supabase.from("trend_analysis").insert(rows);
      if (insertErr) console.error("Insert error:", insertErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        monthly_data: monthlySummary,
        location_stats: dataSummary.locationStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
