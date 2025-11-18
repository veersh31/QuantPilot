export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      console.error('[v0] Alpha Vantage API key not configured')
      return Response.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      )
    }

    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    console.log('[v0] Fetching fundamentals for:', symbol)
    
    const response = await fetch(overviewUrl)
    const data = await response.json()

    console.log('[v0] Alpha Vantage response:', { hasSymbol: !!data.Symbol, keys: Object.keys(data).slice(0, 10) })

    if (!data.Symbol) {
      console.error('[v0] Symbol not found in response:', data)
      return Response.json({ error: 'Symbol not found' }, { status: 404 })
    }

    const fundamentals = {
      // Valuation Ratios
      peRatio: data['PERatio'] ? parseFloat(data['PERatio']) : null,
      psRatio: data['PriceToSalesRatioTTM'] ? parseFloat(data['PriceToSalesRatioTTM']) : null,
      pbRatio: data['PriceToBookRatio'] ? parseFloat(data['PriceToBookRatio']) : null,
      
      // Profitability Metrics
      eps: data['EPS'] ? parseFloat(data['EPS']) : null,
      roe: data['ReturnOnEquityTTM'] ? parseFloat(data['ReturnOnEquityTTM']) : null,
      roic: data['ReturnOnCapitalEmployedTTM'] ? parseFloat(data['ReturnOnCapitalEmployedTTM']) : null,
      operatingMargin: data['OperatingMarginTTM'] ? parseFloat(data['OperatingMarginTTM']) : null,
      profitMargin: data['ProfitMargin'] ? parseFloat(data['ProfitMargin']) : null,
      
      // Financial Health
      debtToEquity: data['DebtToEquity'] ? parseFloat(data['DebtToEquity']) : null,
      currentRatio: data['CurrentRatio'] ? parseFloat(data['CurrentRatio']) : null,
      quickRatio: data['QuickRatio'] ? parseFloat(data['QuickRatio']) : null,
      
      // Growth & Dividend
      revenueGrowth: data['RevenuePerShareTTM'] ? parseFloat(data['RevenuePerShareTTM']) : null,
      dividendYield: data['DividendYield'] ? parseFloat(data['DividendYield']) : null,
      payoutRatio: data['PayoutRatio'] ? parseFloat(data['PayoutRatio']) : null,
      
      // Other Metrics
      marketCap: data['MarketCapitalization'] ? parseInt(data['MarketCapitalization']) : null,
      bookValue: data['BookValue'] ? parseFloat(data['BookValue']) : null,
      beta: data['Beta'] ? parseFloat(data['Beta']) : null,
      week52High: data['52WeekHigh'] ? parseFloat(data['52WeekHigh']) : null,
      week52Low: data['52WeekLow'] ? parseFloat(data['52WeekLow']) : null,
      
      // Company Info
      name: data['Name'] || symbol,
      sector: data['Sector'] || 'N/A',
      industry: data['Industry'] || 'N/A',
      description: data['Description'] || 'N/A',
    }

    return Response.json(fundamentals, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[v0] Fundamentals fetch error:', error)
    return Response.json({ error: 'Failed to fetch fundamentals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { symbol } = await request.json()

    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 })
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      console.error('[v0] Alpha Vantage API key not configured')
      return Response.json(
        { error: 'Alpha Vantage API key not configured' },
        { status: 500 }
      )
    }

    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`
    console.log('[v0] Fetching fundamentals (POST) for:', symbol)
    
    const response = await fetch(overviewUrl)
    const data = await response.json()

    console.log('[v0] Alpha Vantage response:', { hasSymbol: !!data.Symbol, keys: Object.keys(data).slice(0, 10) })

    if (!data.Symbol) {
      console.error('[v0] Symbol not found in response:', data)
      return Response.json({ error: 'Symbol not found' }, { status: 404 })
    }

    const fundamentals = {
      // Valuation Ratios
      peRatio: data['PERatio'] ? parseFloat(data['PERatio']) : null,
      psRatio: data['PriceToSalesRatioTTM'] ? parseFloat(data['PriceToSalesRatioTTM']) : null,
      pbRatio: data['PriceToBookRatio'] ? parseFloat(data['PriceToBookRatio']) : null,
      
      // Profitability Metrics
      eps: data['EPS'] ? parseFloat(data['EPS']) : null,
      roe: data['ReturnOnEquityTTM'] ? parseFloat(data['ReturnOnEquityTTM']) : null,
      roic: data['ReturnOnCapitalEmployedTTM'] ? parseFloat(data['ReturnOnCapitalEmployedTTM']) : null,
      operatingMargin: data['OperatingMarginTTM'] ? parseFloat(data['OperatingMarginTTM']) : null,
      profitMargin: data['ProfitMargin'] ? parseFloat(data['ProfitMargin']) : null,
      
      // Financial Health
      debtToEquity: data['DebtToEquity'] ? parseFloat(data['DebtToEquity']) : null,
      currentRatio: data['CurrentRatio'] ? parseFloat(data['CurrentRatio']) : null,
      quickRatio: data['QuickRatio'] ? parseFloat(data['QuickRatio']) : null,
      
      // Growth & Dividend
      revenueGrowth: data['RevenuePerShareTTM'] ? parseFloat(data['RevenuePerShareTTM']) : null,
      dividendYield: data['DividendYield'] ? parseFloat(data['DividendYield']) : null,
      payoutRatio: data['PayoutRatio'] ? parseFloat(data['PayoutRatio']) : null,
      
      // Other Metrics
      marketCap: data['MarketCapitalization'] ? parseInt(data['MarketCapitalization']) : null,
      bookValue: data['BookValue'] ? parseFloat(data['BookValue']) : null,
      beta: data['Beta'] ? parseFloat(data['Beta']) : null,
      week52High: data['52WeekHigh'] ? parseFloat(data['52WeekHigh']) : null,
      week52Low: data['52WeekLow'] ? parseFloat(data['52WeekLow']) : null,
      
      // Company Info
      name: data['Name'] || symbol,
      sector: data['Sector'] || 'N/A',
      industry: data['Industry'] || 'N/A',
      description: data['Description'] || 'N/A',
    }

    return Response.json(fundamentals, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[v0] Fundamentals fetch error:', error)
    return Response.json({ error: 'Failed to fetch fundamentals' }, { status: 500 })
  }
}
