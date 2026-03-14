import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: LucideIcon;
}

export function KpiCard({ title, value, change, changeLabel = "vs last period", icon: Icon }: KpiCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="font-heading text-2xl font-bold text-card-foreground">{value}</p>
            <div className="flex items-center gap-1.5">
              {isNeutral ? (
                <Minus className="h-3.5 w-3.5 text-kpi-neutral" />
              ) : isPositive ? (
                <ArrowUp className="h-3.5 w-3.5 text-kpi-up" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-kpi-down" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isNeutral ? "text-kpi-neutral" : isPositive ? "text-kpi-up" : "text-kpi-down"
                )}
              >
                {isPositive ? "+" : ""}{change}%
              </span>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
