export async function POST(request: Request) {
  try {
    const { symbol, days = 30 } = await request.json()

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      )
    }

    // Fetch from Alpha Vantage TIME_SERIES_DAILY
    const alphaUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${apiKey}`
    const response = await fetch(alphaUrl)
    const alphaData = await response.json()

    if (!alphaData['Time Series (Daily)']) {
      return Response.json({ error: 'Symbol not found or no data available' }, { status: 404 })
    }

    const timeSeries = alphaData['Time Series (Daily)']
    const dates = Object.keys(timeSeries).sort().reverse().slice(0, days)

    const historicalData = dates
      .sort()
      .map(date => ({
        date: date,
        open: parseFloat(timeSeries[date]['1. open']),
        close: parseFloat(timeSeries[date]['4. close']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        volume: parseInt(timeSeries[date]['5. volume']),
      }))
      .reverse()

    return Response.json({ symbol: symbol.toUpperCase(), data: historicalData })
  } catch (error) {
    console.error('Historical data error:', error)
    return Response.json({ error: 'Failed to fetch historical data' }, { status: 500 })
  }
}
