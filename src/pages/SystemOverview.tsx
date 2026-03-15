import { AppLayout } from "@/components/AppLayout";
import {
  Brain,
  Database,
  Upload,
  LineChart,
  MapPin,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Layers,
  Workflow,
  Target,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const solutionPillars = [
  {
    icon: Database,
    title: "Data Ingestion & Processing",
    description:
      "Automated AI-powered pipeline that ingests raw CSV datasets, intelligently maps columns to internal schemas, and populates clean analytical tables — ready for insights in seconds.",
    capabilities: [
      "Drag-and-drop CSV upload",
      "AI column mapping (Gemini 2.5 Flash)",
      "Automated clean_data & monthly_summary population",
      "Historical data preservation across uploads",
    ],
    route: "/data-ingestion",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: BarChart3,
    title: "Dashboard & KPI Analytics",
    description:
      "Real-time executive dashboard displaying key performance indicators — total deliveries, sales, returns, revenue, and sell-through rates — with month-over-month trend analysis.",
    capabilities: [
      "Live KPI cards with trend indicators",
      "Network demand trend visualization",
      "Month-over-month change tracking",
      "Aggregated performance metrics",
    ],
    route: "/",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MapPin,
    title: "Regional Demand & Supply Intelligence",
    description:
      "AI-driven analysis of all distribution outlets to classify demand levels, identify supply inefficiencies, and recommend optimal distribution strategies per location.",
    capabilities: [
      "Outlet-level demand classification (high/medium/low)",
      "Supply efficiency scoring (over-supplied/balanced/under-supplied)",
      "AI confidence ratings per recommendation",
      "Risk region identification & growth opportunity mapping",
    ],
    route: "/regional",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    icon: Lightbulb,
    title: "AI Insights & BI Recommendations",
    description:
      "Generates actionable business intelligence recommendations and data-driven insights by analyzing historical sales patterns, return rates, and distribution events.",
    capabilities: [
      "Auto-generated data insights (positive/negative/warning)",
      "Prioritized BI recommendations",
      "Event-contextualized analysis",
      "Trend anomaly detection",
    ],
    route: "/insights",
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    icon: LineChart,
    title: "Predictive Forecasting",
    description:
      "Linear regression model projecting revenue trends, calculating AI confidence scores, and identifying peak performance months to support proactive distribution planning.",
    capabilities: [
      "Revenue trend projection",
      "AI confidence from R² scoring",
      "Year-end profit/loss estimation (N$)",
      "Peak month identification",
    ],
    route: "/forecasting",
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
];

const aiModels = [
  {
    name: "Gemini 3 Flash Preview",
    usage: "Regional demand/supply analysis, BI insights & recommendations",
    strength: "Fast structured reasoning with tool-calling for classification tasks",
  },
  {
    name: "Gemini 2.5 Flash",
    usage: "Data pipeline column mapping & schema normalization",
    strength: "Efficient pattern recognition for schema-to-schema transformations",
  },
];

const dataRequirements = [
  {
    icon: TrendingUp,
    title: "Historical Sales Figures",
    description: "Daily or monthly sales data by location for the last 12–24 months",
  },
  {
    icon: PackageCheck,
    title: "Return & Unsold Records",
    description: "Daily records of returned or unsold newspapers per distribution point",
  },
  {
    icon: AlertTriangle,
    title: "Distribution Events",
    description: "Dates of marketing campaigns, holidays, or breaking news events that influenced sales spikes",
  },
];

const pipelineSteps = [
  { step: "1", label: "Upload", description: "CSV file uploaded via Data Ingestion" },
  { step: "2", label: "Parse", description: "Raw rows extracted and stored" },
  { step: "3", label: "AI Map", description: "Columns mapped to internal schema via AI" },
  { step: "4", label: "Clean", description: "Normalized data written to clean_data" },
  { step: "5", label: "Aggregate", description: "Monthly summaries computed automatically" },
  { step: "6", label: "Analyze", description: "AI generates insights, forecasts & regional intelligence" },
];

export default function SystemOverview() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                System Solution Overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Commercial Performance & Sales Analytics Platform
              </p>
            </div>
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-foreground leading-relaxed">
                An AI-driven solution that analyses historical sales data from all distribution
                outlets to identify demand trends. The system determines where demand is growing
                and where it is declining — recommending where to{" "}
                <span className="font-semibold text-chart-2">increase newspaper supply</span> to
                avoid lost sales, and where to{" "}
                <span className="font-semibold text-destructive">reduce supply</span> to minimise
                unsold copies and returns.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Requirements */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Data Requirements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataRequirements.map((req) => (
              <Card key={req.title} className="border-border">
                <CardContent className="p-4 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <req.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{req.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Pipeline */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">AI-Powered Data Pipeline</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineSteps.map((s, i) => (
              <div key={s.step} className="relative">
                <Card className="border-border h-full">
                  <CardContent className="p-3 text-center space-y-1.5">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {s.step}
                    </div>
                    <p className="text-xs font-semibold text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{s.description}</p>
                  </CardContent>
                </Card>
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Solution Modules */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Solution Modules</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {solutionPillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-border hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => navigate(pillar.route)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${pillar.bgColor}`}>
                        <pillar.icon className={`h-4 w-4 ${pillar.color}`} />
                      </div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {pillar.title}
                      </CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-1 text-[11px] text-foreground/70">
                        <CheckCircle2 className="h-3 w-3 text-chart-2 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* AI Models */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">AI Models & Technology</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiModels.map((model) => (
              <Card key={model.name} className="border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{model.name}</p>
                    <Badge variant="secondary" className="text-[10px]">Google AI</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Used for:</span> {model.usage}</p>
                    <p><span className="font-medium text-foreground">Strength:</span> {model.strength}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* How AI Determines Activities */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">How AI Determines Distribution Activities</h2>
          </div>
          <Card className="border-border">
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-chart-2" />
                    <p className="text-sm font-medium text-foreground">Demand Classification</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Each outlet is scored based on sales volume, month-over-month growth trends,
                    and revenue contribution. The AI classifies demand as <strong>high</strong>,{" "}
                    <strong>medium</strong>, or <strong>low</strong> using weighted thresholds
                    against the network average.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-chart-3" />
                    <p className="text-sm font-medium text-foreground">Supply Efficiency</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Return rates and sell-through percentages determine if an outlet is{" "}
                    <strong>over-supplied</strong>, <strong>balanced</strong>, or{" "}
                    <strong>under-supplied</strong>. High return rates signal excess supply;
                    near-100% sell-through may indicate unmet demand.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium text-foreground">Action Recommendations</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Combining demand and efficiency scores, the AI recommends:{" "}
                    <strong>increase supply</strong> (high demand + under-supplied),{" "}
                    <strong>reduce supply</strong> (low demand + over-supplied),{" "}
                    <strong>maintain</strong> (balanced), or <strong>investigate</strong>{" "}
                    (anomalous patterns needing human review).
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground">Decision Flow</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">Historical Sales Data</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">Demand Scoring</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">Return Rate Analysis</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">Supply Classification</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono">Event Contextualization</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge className="bg-primary text-primary-foreground font-mono">AI Recommendation</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Ready to explore?</p>
              <p className="text-xs text-muted-foreground">
                Navigate to any module to see live analytics powered by your uploaded data.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate("/data-ingestion")}>
                <Upload className="h-4 w-4 mr-1.5" />
                Upload Data
              </Button>
              <Button size="sm" onClick={() => navigate("/regional")}>
                <MapPin className="h-4 w-4 mr-1.5" />
                Regional AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
