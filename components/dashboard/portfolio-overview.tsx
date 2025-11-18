'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function PortfolioOverview({ portfolio }: { portfolio: any[] }) {
  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.price || 0) * (stock.quantity || 1), 0)
  const gainLoss = portfolio.reduce((sum, stock) => sum + ((stock.price - stock.avgCost) * (stock.quantity || 1)), 0)
  const gainLossPercent = portfolio.length > 0 ? ((gainLoss / (totalValue - gainLoss)) * 100).toFixed(2) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Real-time portfolio summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gain/Loss</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">${gainLoss.toFixed(2)}</p>
              {gainLoss >= 0 ? (
                <TrendingUp className="text-chart-1" size={20} />
              ) : (
                <TrendingDown className="text-destructive" size={20} />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Return %</p>
            <p className={`text-2xl font-bold ${gainLoss >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
              {gainLossPercent}%
            </p>
          </div>
        </div>
        {portfolio.length === 0 && (
          <p className="text-sm text-muted-foreground mt-4">Add stocks to your portfolio to get started</p>
        )}
      </CardContent>
    </Card>
  )
}
