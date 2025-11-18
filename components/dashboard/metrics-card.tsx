'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: number | string | null
  unit?: string
  benchmark?: string
  positive?: boolean
  description?: string
}

export function MetricsCard({
  title,
  value,
  unit = '',
  benchmark,
  positive,
  description,
}: MetricsCardProps) {
  if (value === null || value === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const isPositive = positive !== undefined ? positive : parseFloat(String(value)) > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          {positive !== undefined && (
            isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(2) : value}{unit}
        </div>
        {benchmark && (
          <p className="text-xs text-muted-foreground">Benchmark: {benchmark}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
