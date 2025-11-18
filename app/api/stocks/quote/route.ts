export async function POST(request: Request) {
  try {
    const { symbol } = await request.json()

    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      )
    }

    const alphaUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    const response = await fetch(alphaUrl)
    const alphaData = await response.json()

    if (!alphaData['Global Quote']) {
      return Response.json({ error: 'Symbol not found or API limit reached' }, { status: 404 })
    }

    const quote = alphaData['Global Quote']
    
    const priceStr = quote['05. price']
    if (!priceStr || priceStr === '0') {
      return Response.json({ error: 'Invalid price data received' }, { status: 404 })
    }

    const price = parseFloat(priceStr)
    const previousClose = parseFloat(quote['08. previous close'] || '0')
    const change = previousClose > 0 ? price - previousClose : 0
    const changePercent = previousClose > 0 ? ((change / previousClose) * 100).toFixed(2) : '0.00'

    // Fetch company overview for additional metrics
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    const overviewResponse = await fetch(overviewUrl)
    const overviewData = await overviewResponse.json()

    const stockData = {
      symbol: symbol.toUpperCase(),
      price: isNaN(price) ? 0 : price,
      change: isNaN(change) ? 0 : parseFloat(change.toFixed(2)),
      changePercent: changePercent,
      high52w: parseFloat(overviewData['52WeekHigh'] || '0') || price,
      low52w: parseFloat(overviewData['52WeekLow'] || '0') || price,
      marketCap: overviewData['MarketCapitalization'] || 'N/A',
      pe: parseFloat(overviewData['PERatio'] || '0') || 0,
      dividendYield: parseFloat(overviewData['DividendYield'] || '0') || 0,
      volume: parseInt(quote['06. volume'] || '0') || 0,
      avgVolume: parseInt(overviewData['AverageVolume'] || '0') || 0,
      timestamp: new Date().toISOString(),
    }

    return Response.json(stockData, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error) {
    console.error('Stock quote error:', error)
    return Response.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
