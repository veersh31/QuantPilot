// Advanced signal generation algorithm
export async function POST(request: Request) {
  try {
    const { symbol, data } = await request.json()

    const signals: any[] = []

    // RSI signals
    if (data.rsi) {
      if (data.rsi < 30) {
        signals.push({
          type: 'bullish',
          indicator: 'RSI Oversold',
          signal: `RSI at ${data.rsi.toFixed(2)} - Potential oversold condition, watch for reversal`,
          confidence: 0.75,
          timestamp: new Date().toISOString(),
        })
      } else if (data.rsi > 70) {
        signals.push({
          type: 'bearish',
          indicator: 'RSI Overbought',
          signal: `RSI at ${data.rsi.toFixed(2)} - Potential overbought condition`,
          confidence: 0.75,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // MACD signals
    if (data.macd && data.signal && data.histogram) {
      if (data.histogram > 0 && data.macd > data.signal) {
        signals.push({
          type: 'bullish',
          indicator: 'MACD Crossover',
          signal: `Bullish MACD crossover detected - Uptrend strengthening`,
          confidence: 0.82,
          timestamp: new Date().toISOString(),
        })
      } else if (data.histogram < 0 && data.macd < data.signal) {
        signals.push({
          type: 'bearish',
          indicator: 'MACD Crossover',
          signal: `Bearish MACD crossover - Downtrend detected`,
          confidence: 0.82,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Bollinger Bands signals
    if (data.price && data.bollinger_upper && data.bollinger_lower) {
      if (data.price > data.bollinger_upper) {
        signals.push({
          type: 'warning',
          indicator: 'Bollinger Band',
          signal: `Price above upper band - High volatility, potential pullback`,
          confidence: 0.68,
          timestamp: new Date().toISOString(),
        })
      } else if (data.price < data.bollinger_lower) {
        signals.push({
          type: 'bullish',
          indicator: 'Bollinger Band',
          signal: `Price below lower band - Volatility extreme, potential bounce`,
          confidence: 0.72,
          timestamp: new Date().toISOString(),
        })
      }
    }

    return Response.json({ signals })
  } catch (error) {
    console.error('Signal generation error:', error)
    return Response.json(
      { error: 'Failed to generate signals' },
      { status: 500 }
    )
  }
}
