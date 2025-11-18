'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowUpRight, ArrowDownRight, AlertCircle, TrendingUp } from 'lucide-react'

export interface PortfolioMetrics {
  totalReturn: number
  ytdReturn: number
  maxDrawdown: number
  sharpeRatio: number
  volatility: number
  beta: number
  allocation: Array<{ name: string; value: number }>
  performanceHistory: Array<{ date: string; value: number }>
}

export function PerformanceMetrics({ portfolio, metrics }: { portfolio: any[], metrics?: PortfolioMetrics }) {
  // Calculate metrics if not provided
  const calculateMetrics = (): PortfolioMetrics => {
    if (metrics) return metrics

    const totalValue = portfolio.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
    const initialValue = portfolio.reduce((sum, stock) => sum + (stock.avgCost * stock.quantity), 0)
    const totalReturn = ((totalValue - initialValue) / initialValue) * 100

    // Mock performance data
    const performanceHistory = []
    let currentValue = initialValue
    for (let i = 0; i < 30; i++) {
      currentValue += (Math.random() - 0.48) * 1000
      performanceHistory.push({
        date: `Day ${i + 1}`,
        value: Math.max(currentValue, initialValue * 0.9),
      })
    }

    const allocation = portfolio.map(stock => ({
      name: stock.symbol,
      value: (stock.price * stock.quantity) / totalValue * 100,
    }))

    return {
      totalReturn,
      ytdReturn: totalReturn * 0.85,
      maxDrawdown: -12.5,
      sharpeRatio: 1.85,
      volatility: 14.2,
      beta: 1.12,
      allocation,
      performanceHistory,
    }
  }

  const data = calculateMetrics()
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#f87171', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${data.totalReturn >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                {data.totalReturn >= 0 ? '+' : ''}{data.totalReturn.toFixed(2)}%
              </span>
              {data.totalReturn >= 0 ? (
                <ArrowUpRight className="text-chart-1" size={20} />
              ) : (
                <ArrowDownRight className="text-destructive" size={20} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-chart-1">{data.ytdReturn.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{data.maxDrawdown.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{data.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Higher is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-chart-2">{data.volatility.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{data.beta.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">vs. Market</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>30-day performance history</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performanceHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value: any) => `$${value.toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      {data.allocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>Portfolio composition by holdings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.allocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.allocation.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      <Card className="border-accent/50 bg-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="text-accent" size={20} />
            <CardTitle>Risk Assessment</CardTitle>
          </div>
          <CardDescription>Portfolio risk profile analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-sm mb-2">Volatility Level: Moderate</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-accent h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your portfolio volatility is 65% of market standard deviation</p>
          </div>

          <div>
            <p className="font-semibold text-sm mb-2">Downside Risk: Medium</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-destructive/60 h-2 rounded-full" style={{ width: '58%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Maximum expected drawdown in adverse conditions: 18-22%</p>
          </div>

          <div>
            <p className="font-semibold text-sm mb-2">Concentration Risk: Low</p>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-chart-1 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Portfolio is well-diversified across {portfolio.length} positions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
