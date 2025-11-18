'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react'

export interface SignalAlert {
  type: 'bullish' | 'bearish' | 'warning'
  indicator: string
  signal: string
  confidence: number
  timestamp: string
}

export function SignalAlerts({ signals }: { signals: SignalAlert[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Signals & Alerts</CardTitle>
        <CardDescription>Real-time technical signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active signals</p>
        ) : (
          signals.map((signal, idx) => (
            <Alert
              key={idx}
              className={
                signal.type === 'bullish'
                  ? 'border-chart-1 bg-chart-1/5'
                  : signal.type === 'bearish'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-accent bg-accent/5'
              }
            >
              <div className="flex items-start gap-3">
                {signal.type === 'bullish' && <TrendingUp className="text-chart-1 mt-0.5" size={18} />}
                {signal.type === 'bearish' && <TrendingDown className="text-destructive mt-0.5" size={18} />}
                {signal.type === 'warning' && <AlertTriangle className="text-accent mt-0.5" size={18} />}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{signal.indicator}</p>
                    <span className="text-xs bg-background px-2 py-1 rounded">
                      {(signal.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <AlertDescription className="text-xs mt-1">{signal.signal}</AlertDescription>
                  <p className="text-xs text-muted-foreground mt-1">{signal.timestamp}</p>
                </div>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  )
}
