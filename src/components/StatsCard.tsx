import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "accent" | "warning";
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "primary" }: StatsCardProps) {
  const colorClasses = {
    primary: "gradient-primary",
    success: "gradient-success",
    accent: "gradient-accent",
    warning: "bg-warning",
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-6 hover:shadow-hover transition-shadow duration-300">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <span className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
