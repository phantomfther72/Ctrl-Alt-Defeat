import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { horizon = 6, seasonality = true, growthModel = "moderate" } = await req.json();

    // Fetch historical analytics data
    const { data: analyticsData } = await supabase
      .from("analytics_data")
      .select("*")
      .order("date", { ascending: true });

    // Fetch existing forecast data for context
    const { data: existingForecasts } = await supabase
      .from("forecast_data")
      .select("*")
      .order("month", { ascending: true });

    const dataContext = `
Historical Analytics Data (${analyticsData?.length || 0} records):
${JSON.stringify(analyticsData || [], null, 2)}

Existing Forecast Data:
${JSON.stringify(existingForecasts || [], null, 2)}

User Parameters:
- Forecast Horizon: ${horizon} months ahead
- Include Seasonality: ${seasonality}
- Growth Model: ${growthModel} (conservative = low growth, moderate = steady, aggressive = high growth)
    `.trim();

    const systemPrompt = `You are a senior data analyst specializing in time-series forecasting for a content analytics platform.

Analyze the provided historical data and generate monthly forecasts. For each forecasted month, provide THREE scenarios:
- baseline: Most likely outcome based on trends
- optimistic: Best-case scenario (upper bound of reasonable expectations)
- pessimistic: Worst-case scenario (lower bound of reasonable expectations)

Also provide confidence intervals (upper_bound and lower_bound) for each prediction.

Use the generate_forecast tool to return your analysis. Generate forecasts for the next ${horizon} months.

Month labels should be: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec.

Consider:
- Seasonal patterns if seasonality is enabled
- The specified growth model (${growthModel})
- Historical trends and anomalies
- Provide realistic, data-grounded numbers

Also include a brief analysis summary with key findings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this data and generate forecasts:\n\n${dataContext}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_forecast",
              description: "Return monthly forecast data with scenarios and confidence intervals.",
              parameters: {
                type: "object",
                properties: {
                  forecasts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        month: { type: "string" },
                        scenario: { type: "string", enum: ["baseline", "optimistic", "pessimistic"] },
                        forecast: { type: "integer" },
                        upper_bound: { type: "integer" },
                        lower_bound: { type: "integer" },
                        growth_rate: { type: "number" },
                      },
                      required: ["month", "scenario", "forecast", "upper_bound", "lower_bound", "growth_rate"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      trend_direction: { type: "string", enum: ["up", "down", "stable"] },
                      confidence_score: { type: "integer" },
                      key_findings: {
                        type: "array",
                        items: { type: "string" },
                      },
                      predicted_peak_month: { type: "string" },
                      avg_growth_rate: { type: "number" },
                    },
                    required: ["trend_direction", "confidence_score", "key_findings", "predicted_peak_month", "avg_growth_rate"],
                    additionalProperties: false,
                  },
                },
                required: ["forecasts", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_forecast" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error [${response.status}]: ${errorText}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const forecasts = parsed.forecasts || [];
    const summary = parsed.summary || {};

    // Delete old AI-generated forecasts, then insert new ones
    await supabase.from("forecast_data").delete().eq("generated_by", "ai");

    if (forecasts.length > 0) {
      const { error: insertError } = await supabase.from("forecast_data").insert(
        forecasts.map((f: any) => ({
          month: f.month,
          forecast: f.forecast,
          upper_bound: f.upper_bound,
          lower_bound: f.lower_bound,
          growth_rate: f.growth_rate,
          scenario: f.scenario,
          generated_by: "ai",
        }))
      );

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to save forecasts: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: forecasts.length, forecasts, summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-forecast error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
