import { AppLayout } from "@/components/AppLayout";
import { InsightCard } from "@/components/InsightCard";

const insights = [
  {
    title: "Content Velocity Impact",
    description: "Publishing 3+ articles per day correlates with 28% higher engagement rates compared to 1-2 articles.",
    type: "positive" as const,
    metric: "+28%",
    category: "Content",
  },
  {
    title: "Peak Engagement Hours",
    description: "Content published between 9-11 AM EST receives 45% more initial engagement than other time slots.",
    type: "positive" as const,
    metric: "9-11 AM",
    category: "Timing",
  },
  {
    title: "Mobile Bounce Rate Rising",
    description: "Mobile users show a 15% increase in bounce rate. Page load times on mobile have increased by 0.8s.",
    type: "negative" as const,
    metric: "+15%",
    category: "Performance",
  },
  {
    title: "Social Referral Decline",
    description: "Traffic from social platforms decreased 8% this month. Algorithm changes may be affecting reach.",
    type: "warning" as const,
    metric: "-8%",
    category: "Distribution",
  },
  {
    title: "Newsletter Effectiveness",
    description: "Email subscribers have 3.2x higher retention than social media visitors. Consider investing more in email growth.",
    type: "neutral" as const,
    metric: "3.2x",
    category: "Audience",
  },
  {
    title: "Video Content Opportunity",
    description: "Articles with embedded video see 52% longer average session duration. Only 12% of content includes video.",
    type: "positive" as const,
    metric: "+52%",
    category: "Content",
  },
];

export default function Insights() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            AI-generated insights based on your data patterns and trends.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
