'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3, Target } from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioStock {
  symbol: string
  quantity: number
  avgCost: number
  price: number
}

interface PortfolioAnalyticsProps {
  portfolio: PortfolioStock[]
}

interface AnalyticsData {
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  alpha: number
  totalReturn: number
  annualizedReturn: number
  downsideDeviation: number
  calmarRatio: number
}

export function PortfolioAnalytics({ portfolio }: PortfolioAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('1y')

  useEffect(() => {
    if (portfolio && portfolio.length > 0) {
      calculateAnalytics()
    }
  }, [portfolio, period])

  const calculateAnalytics = async () => {
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

      // Fetch historical data
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

      // Fetch S&P 500 data for beta calculation
      let spyData: any[] = []
      try {
        const response = await fetch('/api/stocks/historical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'SPY', period }),
        })
        if (response.ok) {
          spyData = await response.json()
        }
      } catch (error) {
        console.error('Error fetching SPY data:', error)
      }

      // Calculate portfolio returns
      const portfolioReturns = calculatePortfolioReturns(historicalDataMap, weights)
      const spyReturns = calculateReturns(spyData)

      if (portfolioReturns.length === 0) {
        toast.error('Insufficient data for analytics')
        setLoading(false)
        return
      }

      // Calculate metrics
      const riskFreeRate = 0.04 // 4% annual risk-free rate (approximate)
      const periodsPerYear = getPeriods PerYear(period)

      const avgReturn = mean(portfolioReturns)
      const stdDev = standardDeviation(portfolioReturns)
      const downsideDev = downsideDeviation(portfolioReturns, 0)

      const sharpe = calculateSharpeRatio(portfolioReturns, riskFreeRate, periodsPerYear)
      const sortino = calculateSortinoRatio(portfolioReturns, riskFreeRate, downsideDev, periodsPerYear)
      const maxDD = calculateMaxDrawdown(portfolioReturns)
      const { beta: betaValue, alpha: alphaValue } = calculateBeta(portfolioReturns, spyReturns, riskFreeRate)

      const totalRet = calculateTotalReturn(portfolioReturns)
      const annualizedRet = calculateAnnualizedReturn(totalRet, portfolioReturns.length, periodsPerYear)
      const calmar = Math.abs(maxDD) > 0 ? annualizedRet / Math.abs(maxDD) : 0

      setAnalytics({
        sharpeRatio: sharpe,
        sortinoRatio: sortino,
        maxDrawdown: maxDD,
        volatility: stdDev * Math.sqrt(periodsPerYear) * 100, // Annualized volatility in %
        beta: betaValue,
        alpha: alphaValue * 100, // Convert to percentage
        totalReturn: totalRet * 100,
        annualizedReturn: annualizedRet * 100,
        downsideDeviation: downsideDev * Math.sqrt(periodsPerYear) * 100,
        calmarRatio: calmar
      })
    } catch (error) {
      console.error('Error calculating analytics:', error)
      toast.error('Failed to calculate analytics')
    }
    setLoading(false)
  }

  // Helper functions
  const calculateReturns = (prices: any[]): number[] => {
    if (!prices || prices.length < 2) return []
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      const ret = (prices[i].close - prices[i - 1].close) / prices[i - 1].close
      returns.push(ret)
    }
    return returns
  }

  const calculatePortfolioReturns = (
    historicalDataMap: { [key: string]: any[] },
    weights: { [key: string]: number }
  ): number[] => {
    const symbols = Object.keys(historicalDataMap)
    if (symbols.length === 0) return []

    // Get minimum length across all series
    const minLength = Math.min(...symbols.map(s => historicalDataMap[s].length))
    if (minLength < 2) return []

    const portfolioReturns: number[] = []

    for (let i = 1; i < minLength; i++) {
      let portfolioReturn = 0
      for (const symbol of symbols) {
        const prices = historicalDataMap[symbol]
        const stockReturn = (prices[i].close - prices[i - 1].close) / prices[i - 1].close
        portfolioReturn += stockReturn * weights[symbol]
      }
      portfolioReturns.push(portfolioReturn)
    }

    return portfolioReturns
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

  const downsideDeviation = (returns: number[], threshold: number): number => {
    const downsideReturns = returns.filter(r => r < threshold).map(r => Math.pow(r - threshold, 2))
    if (downsideReturns.length === 0) return 0
    return Math.sqrt(downsideReturns.reduce((sum, val) => sum + val, 0) / returns.length)
  }

  const calculateSharpeRatio = (returns: number[], riskFreeRate: number, periodsPerYear: number): number => {
    if (returns.length === 0) return 0
    const avgReturn = mean(returns)
    const stdDev = standardDeviation(returns)
    if (stdDev === 0) return 0

    const excessReturn = avgReturn - (riskFreeRate / periodsPerYear)
    return (excessReturn / stdDev) * Math.sqrt(periodsPerYear)
  }

  const calculateSortinoRatio = (
    returns: number[],
    riskFreeRate: number,
    downsideDev: number,
    periodsPerYear: number
  ): number => {
    if (returns.length === 0 || downsideDev === 0) return 0
    const avgReturn = mean(returns)
    const excessReturn = avgReturn - (riskFreeRate / periodsPerYear)
    return (excessReturn / downsideDev) * Math.sqrt(periodsPerYear)
  }

  const calculateMaxDrawdown = (returns: number[]): number => {
    if (returns.length === 0) return 0

    let peak = 1
    let maxDD = 0

    let cumulative = 1
    for (const ret of returns) {
      cumulative *= (1 + ret)
      if (cumulative > peak) {
        peak = cumulative
      }
      const drawdown = (cumulative - peak) / peak
      if (drawdown < maxDD) {
        maxDD = drawdown
      }
    }

    return maxDD * 100 // Convert to percentage
  }

  const calculateBeta = (
    portfolioReturns: number[],
    marketReturns: number[],
    riskFreeRate: number
  ): { beta: number; alpha: number } => {
    if (portfolioReturns.length === 0 || marketReturns.length === 0) {
      return { beta: 0, alpha: 0 }
    }

    const minLength = Math.min(portfolioReturns.length, marketReturns.length)
    const portRet = portfolioReturns.slice(-minLength)
    const mktRet = marketReturns.slice(-minLength)

    const portMean = mean(portRet)
    const mktMean = mean(mktRet)

    let covariance = 0
    let marketVariance = 0

    for (let i = 0; i < minLength; i++) {
      covariance += (portRet[i] - portMean) * (mktRet[i] - mktMean)
      marketVariance += Math.pow(mktRet[i] - mktMean, 2)
    }

    covariance /= minLength
    marketVariance /= minLength

    const beta = marketVariance === 0 ? 1 : covariance / marketVariance
    const alpha = portMean - beta * mktMean

    return { beta, alpha }
  }

  const calculateTotalReturn = (returns: number[]): number => {
    let cumulative = 1
    returns.forEach(ret => {
      cumulative *= (1 + ret)
    })
    return cumulative - 1
  }

  const calculateAnnualizedReturn = (totalReturn: number, periods: number, periodsPerYear: number): number => {
    const years = periods / periodsPerYear
    if (years <= 0) return 0
    return Math.pow(1 + totalReturn, 1 / years) - 1
  }

  const getPeriodsPerYear = (period: string): number => {
    switch (period) {
      case '1mo': return 252 / 21
      case '3mo': return 252 / 63
      case '6mo': return 252 / 126
      case '1y': return 252
      case '2y': return 252
      default: return 252
    }
  }

  const getRatingColor = (value: number, metric: string): string => {
    switch (metric) {
      case 'sharpe':
        if (value >= 2) return 'text-chart-1'
        if (value >= 1) return 'text-amber-500'
        return 'text-destructive'
      case 'sortino':
        if (value >= 2) return 'text-chart-1'
        if (value >= 1) return 'text-amber-500'
        return 'text-destructive'
      case 'calmar':
        if (value >= 2) return 'text-chart-1'
        if (value >= 1) return 'text-amber-500'
        return 'text-destructive'
      case 'beta':
        if (value >= 0.8 && value <= 1.2) return 'text-chart-1'
        if (value >= 0.5 && value <= 1.5) return 'text-amber-500'
        return 'text-destructive'
      default:
        return 'text-foreground'
    }
  }

  const getRating = (value: number, metric: string): string => {
    switch (metric) {
      case 'sharpe':
      case 'sortino':
      case 'calmar':
        if (value >= 2) return 'Excellent'
        if (value >= 1) return 'Good'
        if (value >= 0) return 'Fair'
        return 'Poor'
      case 'volatility':
        if (value < 10) return 'Low'
        if (value < 20) return 'Moderate'
        if (value < 30) return 'High'
        return 'Very High'
      default:
        return ''
    }
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Activity size={48} className="mx-auto mb-4 opacity-30" />
            <p>Add stocks to your portfolio to see analytics</p>
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
              <BarChart3 size={48} className="mx-auto opacity-30" />
            </div>
            <p>Calculating portfolio analytics...</p>
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
                <Activity size={24} />
                Portfolio Analytics
              </CardTitle>
              <CardDescription>Advanced risk and performance metrics</CardDescription>
            </div>
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
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {analytics ? (
            <Tabs defaultValue="returns" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="returns">Returns</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="ratios">Ratios</TabsTrigger>
              </TabsList>

              {/* Returns Tab */}
              <TabsContent value="returns" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Total Return</p>
                        {analytics.totalReturn >= 0 ? (
                          <TrendingUp className="text-chart-1" size={18} />
                        ) : (
                          <TrendingDown className="text-destructive" size={18} />
                        )}
                      </div>
                      <p className={`text-3xl font-bold ${analytics.totalReturn >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                        {analytics.totalReturn >= 0 ? '+' : ''}{analytics.totalReturn.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Over {period === '1mo' ? '1 month' : period === '3mo' ? '3 months' : period === '6mo' ? '6 months' : period === '1y' ? '1 year' : '2 years'}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Annualized Return</p>
                        {analytics.annualizedReturn >= 0 ? (
                          <TrendingUp className="text-chart-1" size={18} />
                        ) : (
                          <TrendingDown className="text-destructive" size={18} />
                        )}
                      </div>
                      <p className={`text-3xl font-bold ${analytics.annualizedReturn >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                        {analytics.annualizedReturn >= 0 ? '+' : ''}{analytics.annualizedReturn.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Per year equivalent</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Alpha (vs S&P 500)</p>
                        <Target size={18} className="text-primary" />
                      </div>
                      <p className={`text-3xl font-bold ${analytics.alpha >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                        {analytics.alpha >= 0 ? '+' : ''}{analytics.alpha.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics.alpha >= 0 ? 'Outperforming market' : 'Underperforming market'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Beta (vs S&P 500)</p>
                        <Activity size={18} className="text-primary" />
                      </div>
                      <p className={`text-3xl font-bold ${getRatingColor(analytics.beta, 'beta')}`}>
                        {analytics.beta.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics.beta > 1 ? 'More volatile than market' : analytics.beta < 1 ? 'Less volatile than market' : 'Matches market'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Risk Tab */}
              <TabsContent value="risk" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Volatility (Annual)</p>
                        <AlertTriangle size={18} className="text-amber-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.volatility.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRating(analytics.volatility, 'volatility')} risk level
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Maximum Drawdown</p>
                        <TrendingDown size={18} className="text-destructive" />
                      </div>
                      <p className="text-3xl font-bold text-destructive">
                        {analytics.maxDrawdown.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Peak-to-trough decline</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Downside Deviation</p>
                        <TrendingDown size={18} className="text-amber-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.downsideDeviation.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Downside risk only</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Ratios Tab */}
              <TabsContent value="ratios" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                        <BarChart3 size={18} className={getRatingColor(analytics.sharpeRatio, 'sharpe')} />
                      </div>
                      <p className={`text-3xl font-bold ${getRatingColor(analytics.sharpeRatio, 'sharpe')}`}>
                        {analytics.sharpeRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRating(analytics.sharpeRatio, 'sharpe')} risk-adjusted return
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Sortino Ratio</p>
                        <TrendingUp size={18} className={getRatingColor(analytics.sortinoRatio, 'sortino')} />
                      </div>
                      <p className={`text-3xl font-bold ${getRatingColor(analytics.sortinoRatio, 'sortino')}`}>
                        {analytics.sortinoRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRating(analytics.sortinoRatio, 'sortino')} downside-adjusted
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Calmar Ratio</p>
                        <Target size={18} className={getRatingColor(analytics.calmarRatio, 'calmar')} />
                      </div>
                      <p className={`text-3xl font-bold ${getRatingColor(analytics.calmarRatio, 'calmar')}`}>
                        {analytics.calmarRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRating(analytics.calmarRatio, 'calmar')} return vs drawdown
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-blue-500/5 border-blue-500/20">
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold mb-2">Understanding Risk Ratios:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li><strong>Sharpe Ratio:</strong> Measures return per unit of total risk (volatility). &gt;2 is excellent, &gt;1 is good.</li>
                      <li><strong>Sortino Ratio:</strong> Like Sharpe but only considers downside risk. &gt;2 is excellent.</li>
                      <li><strong>Calmar Ratio:</strong> Annual return divided by max drawdown. Higher is better.</li>
                      <li><strong>Beta:</strong> Measures correlation with market. 1 = market, &gt;1 = more volatile, &lt;1 = less volatile.</li>
                      <li><strong>Alpha:</strong> Excess return vs market. Positive alpha = beating the market.</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data available for selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
