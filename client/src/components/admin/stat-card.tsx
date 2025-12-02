import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "",
    success: "border-green-500/30",
    warning: "border-yellow-500/30",
    danger: "border-red-500/30",
  };

  const valueStyles = {
    default: "",
    success: "text-green-600 dark:text-green-500",
    warning: "text-yellow-600 dark:text-yellow-500",
    danger: "text-red-600 dark:text-red-500",
  };

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <Card className={cn(variantStyles[variant], className)} data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn("text-muted-foreground", valueStyles[variant])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueStyles[variant])}>
          {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && TrendIcon && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs h-5 gap-1",
                  trend.value > 0 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  trend.value < 0 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value)}%
              </Badge>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend?.label && (
              <p className="text-xs text-muted-foreground">{trend.label}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
    6: "md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridCols[columns])}>
      {children}
    </div>
  );
}
