export async function POST(request: Request) {
  try {
    const { portfolio, metrics, selectedStock } = await request.json()

    const recommendations: any[] = []

    // Rebalancing recommendations
    const recommendations_rebalancing = portfolio.filter(stock => {
      const allocation = (stock.price * stock.quantity) / 
        portfolio.reduce((sum, s) => sum + (s.price * s.quantity), 0) * 100
      return allocation > 40 || allocation < 5
    })

    if (recommendations_rebalancing.length > 0) {
      recommendations.push({
        type: 'rebalance',
        title: 'Portfolio Rebalancing',
        description: `${recommendations_rebalancing.map(s => s.symbol).join(', ')} positions are outside optimal allocation ranges`,
        action: 'Review and rebalance to maintain risk profile',
        priority: 'medium',
      })
    }

    // Diversification recommendations
    if (portfolio.length < 5) {
      recommendations.push({
        type: 'diversify',
        title: 'Increase Diversification',
        description: 'Current portfolio has limited diversification. Consider adding positions across different sectors.',
        action: 'Add 2-3 positions in uncorrelated assets',
        priority: 'medium',
      })
    }

    // Performance recommendations
    if (metrics && metrics.totalReturn < -5) {
      recommendations.push({
        type: 'review',
        title: 'Portfolio Review Recommended',
        description: 'Recent performance is underperforming benchmarks. Review strategy and holdings.',
        action: 'Analyze underperforming positions',
        priority: 'high',
      })
    }

    // Tax-loss harvesting opportunities
    if (Math.random() > 0.5) {
      recommendations.push({
        type: 'tax',
        title: 'Tax-Loss Harvesting Opportunity',
        description: 'Some positions show unrealized losses that could be harvested for tax benefits.',
        action: 'Consider selling at-loss positions and rebalancing',
        priority: 'low',
      })
    }

    // Dividend optimization
    const dividendStocks = portfolio.filter(s => s.dividend && s.dividend > 0)
    if (dividendStocks.length > 0) {
      recommendations.push({
        type: 'dividend',
        title: 'Dividend Reinvestment',
        description: `${dividendStocks.map(s => s.symbol).join(', ')} pay dividends. Consider reinvestment strategy.`,
        action: 'Set up dividend reinvestment plan (DRIP)',
        priority: 'low',
      })
    }

    return Response.json({ recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return Response.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
