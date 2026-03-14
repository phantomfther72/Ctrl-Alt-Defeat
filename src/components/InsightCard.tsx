import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightType = "positive" | "negative" | "warning" | "neutral";

interface InsightCardProps {
  title: string;
  description: string;
  type: InsightType;
  metric?: string;
  category?: string;
}

const typeConfig: Record<InsightType, { icon: typeof Lightbulb; color: string; badge: string }> = {
  positive: { icon: TrendingUp, color: "text-kpi-up", badge: "Opportunity" },
  negative: { icon: TrendingDown, color: "text-kpi-down", badge: "Risk" },
  warning: { icon: AlertTriangle, color: "text-chart-3", badge: "Alert" },
  neutral: { icon: Lightbulb, color: "text-primary", badge: "Insight" },
};

export function InsightCard({ title, description, type, metric, category }: InsightCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className="shadow-card border-border/50 hover:shadow-elevated transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", config.color)} />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <div className="flex gap-1.5">
            {category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {category}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {config.badge}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {metric && (
          <p className={cn("mt-2 font-heading text-lg font-bold", config.color)}>{metric}</p>
        )}
      </CardContent>
    </Card>
  );
}
