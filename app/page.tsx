'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview'
import { StockSearch } from '@/components/dashboard/stock-search'
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts'
import { StockQuote } from '@/components/dashboard/stock-quote'
import { PerformanceMetrics } from '@/components/dashboard/performance-metrics'
import { Recommendations } from '@/components/dashboard/recommendations'
import { InDepthAnalytics } from '@/components/dashboard/in-depth-analytics'
import { AIChat } from '@/components/ai/ai-chat'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Analytics */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioOverview portfolio={portfolio} />
            
            {selectedStock && <StockQuote symbol={selectedStock} />}
            
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="analytics">Charts</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="mt-4">
                <StockSearch 
                  onStockSelect={setSelectedStock}
                  onAddToPortfolio={(stock) => {
                    if (!portfolio.find(p => p.symbol === stock.symbol)) {
                      setPortfolio([...portfolio, stock])
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-4">
                {selectedStock ? (
                  <AnalyticsCharts symbol={selectedStock} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a stock to view analytics
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="mt-4">
                {selectedStock ? (
                  <InDepthAnalytics symbol={selectedStock} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a stock to view metrics
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                {portfolio.length > 0 ? (
                  <PerformanceMetrics portfolio={portfolio} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Add stocks to your portfolio to view performance
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - AI Chat & Recommendations */}
          <div className="space-y-6">
            <AIChat portfolio={portfolio} selectedStock={selectedStock} />
            {portfolio.length > 0 && <Recommendations portfolio={portfolio} />}
          </div>
        </div>
      </main>
    </div>
  )
}
