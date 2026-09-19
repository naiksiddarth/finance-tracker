import React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

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
    <Card
      className={cn(
        "gap-0 rounded-lg border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <CardHeader className="flex items-center justify-between gap-0 rounded-none p-0">
        <CardTitle className="label-md font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className={cn(iconContainerClass)}>{icon}</div>}
      </CardHeader>
      <CardContent className="mt-3 p-0">
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
                    ? "bg-transparent p-0 text-destructive"
                    : "bg-transparent p-0 text-success"
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
      </CardContent>
    </Card>
  )
}
