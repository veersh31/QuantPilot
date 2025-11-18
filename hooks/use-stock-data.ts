import { useState, useEffect, useCallback } from 'react'

export interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  high52w: number
  low52w: number
  marketCap: string
  pe: number
  dividendYield: number
  volume: number
  avgVolume: number
}

export function useStockData(symbol: string | null) {
  const [data, setData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStockData = useCallback(async () => {
    if (!symbol) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stocks/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })

      if (!response.ok) throw new Error('Failed to fetch stock data')

      const stockData = await response.json()
      setData(stockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    fetchStockData()
    const interval = setInterval(fetchStockData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [fetchStockData])

  return { data, loading, error, refetch: fetchStockData }
}
