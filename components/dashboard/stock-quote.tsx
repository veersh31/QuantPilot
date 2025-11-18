'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useStockData } from '@/hooks/use-stock-data'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

export function StockQuote({ symbol }: { symbol: string | null }) {
  const { data, loading } = useStockData(symbol)

  if (!symbol) {
    return null
  }

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-32">
          <Loader2 className="animate-spin" size={24} />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{data.symbol}</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">${data.price.toFixed(2)}</span>
            {data.change >= 0 ? (
              <TrendingUp className="text-chart-1" size={24} />
            ) : (
              <TrendingDown className="text-destructive" size={24} />
            )}
          </div>
        </CardTitle>
        <CardDescription>
          <span className={data.change >= 0 ? 'text-chart-1' : 'text-destructive'}>
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent}%)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">52W High</p>
            <p className="font-semibold">${data.high52w.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">52W Low</p>
            <p className="font-semibold">${data.low52w.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Market Cap</p>
            <p className="font-semibold">{data.marketCap}</p>
          </div>
          <div>
            <p className="text-muted-foreground">P/E Ratio</p>
            <p className="font-semibold">{data.pe.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Volume</p>
            <p className="font-semibold">{(data.volume / 1000000).toFixed(2)}M</p>
          </div>
          <div>
            <p className="text-muted-foreground">Dividend Yield</p>
            <p className="font-semibold">{(data.dividendYield * 100).toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
