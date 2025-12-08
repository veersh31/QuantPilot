const PYTHON_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const { symbol, days = 200 } = await request.json()

    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 })
    }

    console.log('[Indicators Timeseries] Fetching from Python service:', symbol, days, 'days')

    // Proxy to Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/indicators/timeseries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, days })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Python service error')
    }

    const result = await response.json()

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error('[Indicators Timeseries] Error:', error)
    return Response.json({ error: 'Failed to fetch indicator timeseries' }, { status: 500 })
  }
}
