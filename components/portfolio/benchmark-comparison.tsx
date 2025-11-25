'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioStock {
  symbol: string
  quantity: number
  avgCost: number
  price: number
}

interface BenchmarkComparisonProps {
  portfolio: PortfolioStock[]
}

interface ComparisonData {
  date: string
  portfolio: number
  benchmark: number
}

interface PerformanceMetrics {
  portfolioReturn: number
  benchmarkReturn: number
  alpha: number
  beta: number
  correlation: number
  trackingError: number
  informationRatio: number
  outperformance: number
}

export function BenchmarkComparison({ portfolio }: BenchmarkComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('1y')
  const [benchmark, setBenchmark] = useState('SPY')

  const benchmarkOptions = [
    { value: 'SPY', label: 'S&P 500 (SPY)' },
    { value: 'QQQ', label: 'NASDAQ-100 (QQQ)' },
    { value: 'DIA', label: 'Dow Jones (DIA)' },
    { value: 'IWM', label: 'Russell 2000 (IWM)' },
    { value: 'VTI', label: 'Total Market (VTI)' }
  ]

  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      fetchComparisonData()
    }
  }, [portfolio, period, benchmark])

  const fetchComparisonData = async () => {
    if (portfolio.length === 0) return

    setLoading(true)
    try {
      // Fetch historical data for all portfolio stocks
      const historicalDataMap: { [key: string]: any[] } = {}
      const weights: { [key: string]: number } = {}

      // Calculate portfolio weights
      const totalValue = portfolio.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
      portfolio.forEach(stock => {
        weights[stock.symbol] = (stock.price * stock.quantity) / totalValue
      })

      // Fetch historical data for portfolio stocks
      for (const stock of portfolio) {
        try {
          const response = await fetch('/api/stocks/historical', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: stock.symbol, period }),
          })

          if (response.ok) {
            const data = await response.json()
            historicalDataMap[stock.symbol] = data
          }
        } catch (error) {
          console.error(`Error fetching data for ${stock.symbol}:`, error)
        }
      }

      // Fetch benchmark data
      let benchmarkData: any[] = []
      try {
        const response = await fetch('/api/stocks/historical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: benchmark, period }),
        })
        if (response.ok) {
          benchmarkData = await response.json()
        }
      } catch (error) {
        console.error(`Error fetching ${benchmark} data:`, error)
      }

      if (benchmarkData.length === 0) {
        toast.error('Failed to fetch benchmark data')
        setLoading(false)
        return
      }

      // Calculate portfolio performance over time
      const symbols = Object.keys(historicalDataMap)
      const minLength = Math.min(
        ...symbols.map(s => historicalDataMap[s].length),
        benchmarkData.length
      )

      if (minLength < 2) {
        toast.error('Insufficient historical data')
        setLoading(false)
        return
      }

      // Normalize to 100 starting point
      const portfolioStartValue = symbols.reduce((sum, symbol) => {
        return sum + historicalDataMap[symbol][0].close * weights[symbol]
      }, 0)
      const benchmarkStartValue = benchmarkData[0].close

      const comparisonData: ComparisonData[] = []
      const portfolioReturns: number[] = []
      const benchmarkReturns: number[] = []

      for (let i = 0; i < minLength; i++) {
        // Calculate weighted portfolio value
        const portfolioValue = symbols.reduce((sum, symbol) => {
          return sum + historicalDataMap[symbol][i].close * weights[symbol]
        }, 0)

        const portfolioNormalized = (portfolioValue / portfolioStartValue) * 100
        const benchmarkNormalized = (benchmarkData[i].close / benchmarkStartValue) * 100

        comparisonData.push({
          date: benchmarkData[i].date,
          portfolio: parseFloat(portfolioNormalized.toFixed(2)),
          benchmark: parseFloat(benchmarkNormalized.toFixed(2))
        })

        // Calculate returns for metrics
        if (i > 0) {
          const portfolioPrevValue = symbols.reduce((sum, symbol) => {
            return sum + historicalDataMap[symbol][i - 1].close * weights[symbol]
          }, 0)

          portfolioReturns.push((portfolioValue - portfolioPrevValue) / portfolioPrevValue)
          benchmarkReturns.push(
            (benchmarkData[i].close - benchmarkData[i - 1].close) / benchmarkData[i - 1].close
          )
        }
      }

      setData(comparisonData)

      // Calculate performance metrics
      const portfolioReturn = ((comparisonData[comparisonData.length - 1].portfolio - 100) / 100) * 100
      const benchmarkReturn = ((comparisonData[comparisonData.length - 1].benchmark - 100) / 100) * 100

      const { beta, alpha } = calculateBetaAlpha(portfolioReturns, benchmarkReturns)
      const correlation = calculateCorrelation(portfolioReturns, benchmarkReturns)
      const trackingError = calculateTrackingError(portfolioReturns, benchmarkReturns)
      const informationRatio = trackingError > 0 ? (portfolioReturn - benchmarkReturn) / trackingError : 0

      setMetrics({
        portfolioReturn,
        benchmarkReturn,
        alpha: alpha * 100,
        beta,
        correlation,
        trackingError: trackingError * 100,
        informationRatio,
        outperformance: portfolioReturn - benchmarkReturn
      })

    } catch (error) {
      console.error('Error fetching comparison data:', error)
      toast.error('Failed to load comparison data')
    }
    setLoading(false)
  }

  const calculateBetaAlpha = (portfolioReturns: number[], benchmarkReturns: number[]) => {
    if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) {
      return { beta: 0, alpha: 0 }
    }

    const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length)
    const portRet = portfolioReturns.slice(-minLength)
    const benchRet = benchmarkReturns.slice(-minLength)

    const portMean = mean(portRet)
    const benchMean = mean(benchRet)

    let covariance = 0
    let variance = 0

    for (let i = 0; i < minLength; i++) {
      covariance += (portRet[i] - portMean) * (benchRet[i] - benchMean)
      variance += Math.pow(benchRet[i] - benchMean, 2)
    }

    covariance /= minLength
    variance /= minLength

    const beta = variance === 0 ? 1 : covariance / variance
    const alpha = portMean - beta * benchMean

    return { beta, alpha }
  }

  const calculateCorrelation = (portfolioReturns: number[], benchmarkReturns: number[]): number => {
    if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) return 0

    const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length)
    const portRet = portfolioReturns.slice(-minLength)
    const benchRet = benchmarkReturns.slice(-minLength)

    const portMean = mean(portRet)
    const benchMean = mean(benchRet)

    let covariance = 0
    let portVariance = 0
    let benchVariance = 0

    for (let i = 0; i < minLength; i++) {
      const portDiff = portRet[i] - portMean
      const benchDiff = benchRet[i] - benchMean
      covariance += portDiff * benchDiff
      portVariance += portDiff * portDiff
      benchVariance += benchDiff * benchDiff
    }

    const denominator = Math.sqrt(portVariance * benchVariance)
    return denominator === 0 ? 0 : covariance / denominator
  }

  const calculateTrackingError = (portfolioReturns: number[], benchmarkReturns: number[]): number => {
    if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) return 0

    const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length)
    const differences: number[] = []

    for (let i = 0; i < minLength; i++) {
      differences.push(portfolioReturns[i] - benchmarkReturns[i])
    }

    return standardDeviation(differences)
  }

  const mean = (arr: number[]): number => {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length
  }

  const standardDeviation = (arr: number[]): number => {
    const avg = mean(arr)
    const squaredDiffs = arr.map(val => Math.pow(val - avg, 2))
    const variance = mean(squaredDiffs)
    return Math.sqrt(variance)
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Activity size={48} className="mx-auto mb-4 opacity-30" />
            <p>Add stocks to your portfolio to see benchmark comparison</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <div className="animate-pulse mb-4">
              <Activity size={48} className="mx-auto opacity-30" />
            </div>
            <p>Loading comparison data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target size={24} />
                Portfolio vs Benchmark
              </CardTitle>
              <CardDescription>Performance comparison and relative metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={benchmark} onValueChange={setBenchmark}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {benchmarkOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1mo">1 Month</SelectItem>
                  <SelectItem value="3mo">3 Months</SelectItem>
                  <SelectItem value="6mo">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                  <SelectItem value="5y">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Indexed (Base = 100)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                  formatter={(value: any) => value.toFixed(2)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  name="Your Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={false}
                  name={benchmarkOptions.find(b => b.value === benchmark)?.label || benchmark}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Portfolio Return</p>
                {metrics.portfolioReturn >= 0 ? (
                  <TrendingUp className="text-chart-1" size={18} />
                ) : (
                  <TrendingDown className="text-destructive" size={18} />
                )}
              </div>
              <p className={`text-2xl font-bold ${metrics.portfolioReturn >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                {metrics.portfolioReturn >= 0 ? '+' : ''}{metrics.portfolioReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Over selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Benchmark Return</p>
                {metrics.benchmarkReturn >= 0 ? (
                  <TrendingUp className="text-chart-2" size={18} />
                ) : (
                  <TrendingDown className="text-destructive" size={18} />
                )}
              </div>
              <p className={`text-2xl font-bold ${metrics.benchmarkReturn >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {metrics.benchmarkReturn >= 0 ? '+' : ''}{metrics.benchmarkReturn.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{benchmark} performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Outperformance</p>
                <Target size={18} className="text-primary" />
              </div>
              <p className={`text-2xl font-bold ${metrics.outperformance >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                {metrics.outperformance >= 0 ? '+' : ''}{metrics.outperformance.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.outperformance >= 0 ? 'Beating' : 'Trailing'} {benchmark}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Alpha</p>
                <Activity size={18} className="text-primary" />
              </div>
              <p className={`text-2xl font-bold ${metrics.alpha >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                {metrics.alpha >= 0 ? '+' : ''}{metrics.alpha.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Risk-adjusted excess return</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Beta</p>
                <Activity size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics.beta.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.beta > 1 ? 'More volatile' : metrics.beta < 1 ? 'Less volatile' : 'Equal volatility'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Correlation</p>
                <Activity size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics.correlation.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.abs(metrics.correlation) > 0.8 ? 'Strong' : Math.abs(metrics.correlation) > 0.5 ? 'Moderate' : 'Weak'} correlation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Tracking Error</p>
                <Activity size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics.trackingError.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Deviation from benchmark</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Information Ratio</p>
                <Target size={18} className="text-primary" />
              </div>
              <p className="text-2xl font-bold">{metrics.informationRatio.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.informationRatio > 0.5 ? 'Good' : 'Fair'} active management
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <p className="text-sm font-semibold mb-2">Understanding Benchmark Metrics:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li><strong>Alpha:</strong> Excess return vs benchmark after adjusting for risk. Positive alpha = beating the market.</li>
            <li><strong>Beta:</strong> Volatility relative to benchmark. 1.0 = same as market, &gt;1 = more volatile, &lt;1 = less volatile.</li>
            <li><strong>Correlation:</strong> How closely portfolio moves with benchmark. 1.0 = perfect correlation, 0 = no correlation.</li>
            <li><strong>Tracking Error:</strong> Standard deviation of return differences. Lower = more similar to benchmark.</li>
            <li><strong>Information Ratio:</strong> Excess return per unit of tracking error. &gt;0.5 is good active management.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
