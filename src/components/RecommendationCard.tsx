import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowUpRight, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "high" | "medium" | "low";

interface RecommendationCardProps {
  title: string;
  description: string;
  expectedImpact: string;
  priority: Priority;
  category: string;
}

const priorityConfig: Record<Priority, { icon: typeof Zap; color: string; label: string; border: string }> = {
  high: { icon: Zap, color: "text-kpi-down", label: "High Priority", border: "border-l-kpi-down" },
  medium: { icon: Target, color: "text-chart-3", label: "Medium Priority", border: "border-l-chart-3" },
  low: { icon: Clock, color: "text-primary", label: "Low Priority", border: "border-l-primary" },
};

export function RecommendationCard({ title, description, expectedImpact, priority, category }: RecommendationCardProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <Card className={cn("shadow-card border-border/50 hover:shadow-elevated transition-all border-l-4", config.border)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
            <CardTitle className="text-sm font-semibold truncate">{title}</CardTitle>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
              {category}
            </Badge>
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 whitespace-nowrap")}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center gap-1.5 pt-1">
          <ArrowUpRight className="h-3.5 w-3.5 text-kpi-up" />
          <span className="text-xs font-semibold text-kpi-up">Expected: {expectedImpact}</span>
        </div>
      </CardContent>
    </Card>
  );
}
