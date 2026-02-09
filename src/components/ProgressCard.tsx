import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
  title: string;
  value: number;
  total: number;
  icon: LucideIcon;
  color?: "primary" | "success" | "accent" | "warning";
}

export function ProgressCard({ title, value, total, icon: Icon, color = "primary" }: ProgressCardProps) {
  const percentage = Math.round((value / total) * 100);
  
  const colorClasses = {
    primary: "gradient-primary",
    success: "gradient-success",
    accent: "gradient-accent",
    warning: "bg-warning",
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-6 hover:shadow-hover transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">{percentage}%</span>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {value} de {total} completos
      </p>
      
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
