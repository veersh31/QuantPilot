import useSWR from 'swr'

interface Fundamentals {
  peRatio: number | null
  psRatio: number | null
  pbRatio: number | null
  eps: number | null
  roe: number | null
  roic: number | null
  operatingMargin: number | null
  profitMargin: number | null
  debtToEquity: number | null
  currentRatio: number | null
  quickRatio: number | null
  revenueGrowth: number | null
  dividendYield: number | null
  payoutRatio: number | null
  marketCap: number | null
  bookValue: number | null
  beta: number | null
  week52High: number | null
  week52Low: number | null
  name: string
  sector: string
  industry: string
  description: string
}

export function useFundamentals(symbol: string | null) {
  const { data, error, isLoading } = useSWR(
    symbol ? `/api/stocks/fundamentals?symbol=${symbol}` : null,
    async (url) => {
      console.log('[v0] Fetching fundamentals from:', url)
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('[v0] Fundamentals error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch fundamentals')
      }
      const data = await response.json()
      console.log('[v0] Fundamentals loaded successfully')
      return data as Fundamentals
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  return { fundamentals: data, isLoading, error: !!error }
}
