'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus } from 'lucide-react'

// Mock stock data
const MOCK_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 180.52, change: 2.5, changePercent: 1.4 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 370.72, change: 5.2, changePercent: 1.4 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.22, change: -1.5, changePercent: -1.1 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.90, change: 3.2, changePercent: 1.7 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 127.45, change: -2.1, changePercent: -1.6 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84, change: 8.5, changePercent: 3.6 },
]

export function StockSearch({ onStockSelect, onAddToPortfolio }: any) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState(MOCK_STOCKS)

  const handleSearch = (value: string) => {
    setSearch(value)
    const filtered = MOCK_STOCKS.filter(
      stock => stock.symbol.includes(value.toUpperCase()) || stock.name.toLowerCase().includes(value.toLowerCase())
    )
    setResults(filtered)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Search</CardTitle>
        <CardDescription>Search and add stocks to your portfolio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by symbol or name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((stock) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted cursor-pointer"
              onClick={() => onStockSelect(stock.symbol)}
            >
              <div>
                <p className="font-semibold text-foreground">{stock.symbol}</p>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">${stock.price.toFixed(2)}</p>
                  <p className={`text-sm ${stock.change >= 0 ? 'text-chart-1' : 'text-destructive'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent}%)
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToPortfolio({ ...stock, quantity: 1, avgCost: stock.price })
                  }}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
