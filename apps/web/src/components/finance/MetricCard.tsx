import React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

interface MetricCardProps {
  title: string
  value: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  subtitle?: string
  icon?: React.ReactNode
  iconContainerClass?: string
  valueClass?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  trend,
  trendValue,
  subtitle,
  icon,
  iconContainerClass,
  valueClass,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="label-md font-medium text-muted-foreground">
          {title}
        </span>
        {icon && <div className={cn(iconContainerClass)}>{icon}</div>}
      </div>
      <div className="mt-3">
        <div
          className={cn(
            "numeric-lg tracking-tight",
            valueClass || "text-foreground"
          )}
        >
          {value}
        </div>
        {(trendValue || subtitle) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {trendValue && (
              <Badge
                variant="default"
                className={
                  trend === "down"
                    ? "bg-transparent text-destructive p-0"
                    : "bg-transparent text-success p-0"
                }
              >
                {trendValue}
              </Badge>
            )}
            {subtitle && (
              <span className="body-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
