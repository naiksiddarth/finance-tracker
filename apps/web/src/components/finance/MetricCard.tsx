import React from "react"
import { cn } from "@workspace/ui/lib/utils"

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
    <div className={cn("rounded-lg border border-border bg-card p-5 flex flex-col justify-between shadow-sm", className)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="label-md font-medium text-muted-foreground">{title}</span>
        {icon && (
          <div className={cn(iconContainerClass)}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className={cn("numeric-lg tracking-tight", valueClass || "text-foreground")}>
          {value}
        </div>
        {(trendValue || subtitle) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {trendValue && (
              <span className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg label-sm font-semibold",
                trend === "up" ? "bg-success text-success-foreground" : 
                trend === "down" ? "bg-destructive/20 text-on-error-container" : 
                "bg-success text-primary"
              )}>
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className="body-sm text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
