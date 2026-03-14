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

    // Fetch recent analytics data
    const [analyticsRes, sourcesRes, uploadsRes] = await Promise.all([
      supabase.from("analytics_data").select("*").order("date", { ascending: false }).limit(14),
      supabase.from("traffic_sources").select("*").order("date", { ascending: false }).limit(10),
      supabase.from("file_uploads").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const analyticsData = analyticsRes.data || [];
    const trafficSources = sourcesRes.data || [];
    const fileUploads = uploadsRes.data || [];

    const dataContext = `
Analytics Data (last 14 days):
${JSON.stringify(analyticsData, null, 2)}

Traffic Sources:
${JSON.stringify(trafficSources, null, 2)}

Recent File Uploads:
${JSON.stringify(fileUploads, null, 2)}
    `.trim();

    const systemPrompt = `You are a data analyst for a content analytics platform called "New Era Insights". 
Analyze the provided data and generate actionable insights. Each insight should identify a meaningful pattern, trend, or anomaly.

Return insights using the suggest_insights tool. Generate 3-5 insights based on the data provided.
Each insight must have:
- title: Short, descriptive title (max 60 chars)
- description: 1-2 sentence explanation of the finding and its implication
- type: one of "positive", "negative", "warning", "neutral"
- metric: A key number or percentage related to the insight
- category: one of "Content", "Timing", "Performance", "Distribution", "Audience"`;

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
          { role: "user", content: `Analyze this data and generate insights:\n\n${dataContext}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_insights",
              description: "Return 3-5 data-driven insights based on analytics data.",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["positive", "negative", "warning", "neutral"] },
                        metric: { type: "string" },
                        category: { type: "string", enum: ["Content", "Timing", "Performance", "Distribution", "Audience"] },
                      },
                      required: ["title", "description", "type", "metric", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_insights" } },
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
    const newInsights = parsed.insights || [];

    // Insert generated insights into the database
    if (newInsights.length > 0) {
      const { error: insertError } = await supabase.from("insights").insert(
        newInsights.map((insight: any) => ({
          title: insight.title,
          description: insight.description,
          type: insight.type,
          metric: insight.metric,
          category: insight.category,
          is_active: true,
        }))
      );

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Failed to save insights: ${insertError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: newInsights.length, insights: newInsights }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-insights error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
