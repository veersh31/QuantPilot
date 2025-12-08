'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

// Timeframe options
type TimeframeOption = '1M' | '3M' | '6M' | '1Y'

const TIMEFRAME_DAYS: Record<TimeframeOption, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365
}

export function AnalyticsCharts({ symbol }: { symbol: string }) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timeframeOptions: TimeframeOption[] = ['1M', '3M', '6M', '1Y']

  useEffect(() => {
    const fetchIndicators = async () => {
      if (!symbol) return

      setLoading(true)
      setError(null)

      try {
        console.log('[AnalyticsCharts] Fetching indicators from Python service:', symbol)

        const response = await fetch('/api/indicators/timeseries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            days: TIMEFRAME_DAYS[timeframe]
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch indicator timeseries')
        }

        const result = await response.json()
        console.log('[AnalyticsCharts] Received data:', result.dataPoints, 'points')

        setData(result.data)
      } catch (err) {
        console.error('[AnalyticsCharts] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchIndicators()
  }, [symbol, timeframe])

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeframe selector */}
      <div className="flex gap-2">
        {timeframeOptions.map((option) => (
          <Button
            key={option}
            variant={timeframe === option ? 'default' : 'outline'}
            onClick={() => setTimeframe(option)}
            size="sm"
          >
            {option}
          </Button>
        ))}
      </div>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Historical price movement for {symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Volume</CardTitle>
          <CardDescription>Trading volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* MACD Chart */}
      {data.some(d => d.macd !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>MACD (Moving Average Convergence Divergence)</CardTitle>
            <CardDescription>Momentum indicator showing trend strength and direction</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="macd" stroke="#8884d8" name="MACD" dot={false} />
                <Line type="monotone" dataKey="signal" stroke="#82ca9d" name="Signal" dot={false} />
                <Bar dataKey="histogram" fill="#ffc658" name="Histogram" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bollinger Bands Chart */}
      {data.some(d => d.bollinger_upper !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Bollinger Bands</CardTitle>
            <CardDescription>Volatility indicator showing price channels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bollinger_upper" stroke="#ff7c7c" name="Upper Band" dot={false} />
                <Line type="monotone" dataKey="bollinger_middle" stroke="#8884d8" name="SMA (20)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="bollinger_lower" stroke="#82ca9d" name="Lower Band" dot={false} />
                <Line type="monotone" dataKey="price" stroke="#000" name="Price" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* RSI Chart */}
      {data.some(d => d.rsi !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>RSI (Relative Strength Index)</CardTitle>
            <CardDescription>Momentum oscillator measuring speed and magnitude of price changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rsi" stroke="#8884d8" name="RSI" />
                <Line type="monotone" y={70} stroke="#ff7c7c" strokeDasharray="5 5" name="Overbought (70)" />
                <Line type="monotone" y={30} stroke="#82ca9d" strokeDasharray="5 5" name="Oversold (30)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Stochastic Chart */}
      {data.some(d => d.stochastic !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Stochastic Oscillator</CardTitle>
            <CardDescription>Momentum indicator comparing closing price to price range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stochastic" stroke="#8884d8" name="Stochastic %K" />
                <Line type="monotone" y={80} stroke="#ff7c7c" strokeDasharray="5 5" name="Overbought (80)" />
                <Line type="monotone" y={20} stroke="#82ca9d" strokeDasharray="5 5" name="Oversold (20)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
