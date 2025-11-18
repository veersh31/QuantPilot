'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsCard } from './metrics-card'
import { useFundamentals } from '@/hooks/use-fundamentals'
import { Skeleton } from '@/components/ui/skeleton'

interface InDepthAnalyticsProps {
  symbol: string
}

export function InDepthAnalytics({ symbol }: InDepthAnalyticsProps) {
  const { fundamentals, isLoading, error } = useFundamentals(symbol)

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-500">Failed to load metrics</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!fundamentals) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{fundamentals.name}</h2>
              <p className="text-sm text-muted-foreground">{fundamentals.sector} • {fundamentals.industry}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{symbol.toUpperCase()}</p>
            </div>
          </CardTitle>
        </CardHeader>
        {fundamentals.description && fundamentals.description !== 'N/A' && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{fundamentals.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Valuation Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Valuation Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricsCard
            title="Price-to-Earnings (P/E)"
            value={fundamentals.peRatio}
            benchmark="Industry avg: 15-20x"
            description="Lower P/E may indicate undervaluation"
          />
          <MetricsCard
            title="Price-to-Sales (P/S)"
            value={fundamentals.psRatio}
            benchmark="Typically 1-3x"
            description="Shows value relative to revenue"
          />
          <MetricsCard
            title="Price-to-Book (P/B)"
            value={fundamentals.pbRatio}
            benchmark="Typically 1-3x"
            description="Compares market to book value"
          />
          <MetricsCard
            title="Beta"
            value={fundamentals.beta}
            benchmark="Market beta: 1.0"
            description=">1 = more volatile than market"
          />
          <MetricsCard
            title="52-Week High"
            value={fundamentals.week52High}
            unit="$"
          />
          <MetricsCard
            title="52-Week Low"
            value={fundamentals.week52Low}
            unit="$"
          />
        </div>
      </div>

      {/* Profitability Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Profitability & Efficiency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricsCard
            title="Earnings Per Share (EPS)"
            value={fundamentals.eps}
            unit="$"
            description="Profit allocated per share"
          />
          <MetricsCard
            title="Return on Equity (ROE)"
            value={fundamentals.roe}
            unit="%"
            positive={fundamentals.roe !== null && fundamentals.roe > 0}
            benchmark="Target: >15%"
            description="How efficiently equity generates profit"
          />
          <MetricsCard
            title="Return on Invested Capital (ROIC)"
            value={fundamentals.roic}
            unit="%"
            positive={fundamentals.roic !== null && fundamentals.roic > 0}
            benchmark="Target: >8%"
            description="Return on all invested capital"
          />
          <MetricsCard
            title="Operating Margin"
            value={fundamentals.operatingMargin}
            unit="%"
            positive={fundamentals.operatingMargin !== null && fundamentals.operatingMargin > 0}
            benchmark="Industry dependent"
            description="Operating profit per dollar of sales"
          />
          <MetricsCard
            title="Profit Margin"
            value={fundamentals.profitMargin}
            unit="%"
            positive={fundamentals.profitMargin !== null && fundamentals.profitMargin > 0}
            benchmark="Target: >10%"
            description="Net profit per dollar of sales"
          />
        </div>
      </div>

      {/* Financial Health */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Health & Debt</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricsCard
            title="Debt-to-Equity Ratio"
            value={fundamentals.debtToEquity}
            positive={fundamentals.debtToEquity !== null && fundamentals.debtToEquity < 1}
            benchmark="Lower is better: <1.0"
            description="Total liabilities vs shareholder equity"
          />
          <MetricsCard
            title="Current Ratio"
            value={fundamentals.currentRatio}
            benchmark="Target: 1.5-3.0"
            description="Short-term liquidity position"
          />
          <MetricsCard
            title="Quick Ratio"
            value={fundamentals.quickRatio}
            benchmark="Target: 1.0+"
            description="Ability to meet short-term obligations"
          />
          <MetricsCard
            title="Book Value"
            value={fundamentals.bookValue}
            unit="$"
            description="Net asset value per share"
          />
        </div>
      </div>

      {/* Growth & Dividend */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Growth & Dividends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricsCard
            title="Dividend Yield"
            value={fundamentals.dividendYield}
            unit="%"
            benchmark="Market avg: 2-3%"
            description="Annual dividend relative to stock price"
          />
          <MetricsCard
            title="Payout Ratio"
            value={fundamentals.payoutRatio}
            unit="%"
            benchmark="Target: 30-50%"
            description="Percentage of earnings paid as dividends"
          />
          <MetricsCard
            title="Revenue Per Share"
            value={fundamentals.revenueGrowth}
            unit="$"
            description="Total revenue allocated per share"
          />
        </div>
      </div>

      {/* Overview */}
      {fundamentals.marketCap && (
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap:</span>
                <span className="font-semibold">
                  ${(fundamentals.marketCap / 1e9).toFixed(2)}B
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
