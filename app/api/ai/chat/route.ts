import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

// Industry-standard technical analysis algorithms
function calculateTechnicalIndicators(prices: number[]) {
  // RSI (Relative Strength Index)
  const delta = prices.slice(1).map((p, i) => p - prices[i])
  const gain = delta.filter(d => d > 0).reduce((a, b) => a + b, 0) / delta.length
  const loss = Math.abs(delta.filter(d => d < 0).reduce((a, b) => a + b, 0) / delta.length)
  const rs = gain / loss
  const rsi = 100 - (100 / (1 + rs))

  // Moving Averages
  const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20
  const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b) / 50 : null

  return { rsi: rsi.toFixed(2), sma20: sma20.toFixed(2), sma50 }
}

function generatePortfolioContext(portfolio: any[]) {
  if (portfolio.length === 0) {
    return 'The user has no holdings in their portfolio yet.'
  }

  const totalValue = portfolio.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0)
  const holdings = portfolio
    .map(stock => `${stock.symbol}: ${stock.quantity} shares @ $${stock.price.toFixed(2)} (${((stock.price * stock.quantity / totalValue) * 100).toFixed(1)}% of portfolio)`)
    .join('\n')

  return `Portfolio Summary:\n${holdings}\nTotal Portfolio Value: $${totalValue.toFixed(2)}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, portfolio, selectedStock } = body

    // Build comprehensive context for the AI
    const portfolioContext = generatePortfolioContext(portfolio)
    const technicalContext = selectedStock 
      ? `Currently analyzing ${selectedStock} with focus on technical indicators.`
      : 'No specific stock selected for detailed analysis.'

    const systemPrompt = `You are an expert financial advisor and seasoned trader with 20+ years of experience.

When responding:
1. Keep responses SHORT and FOCUSED - maximum 3-4 key points
2. Use clear, direct language - no excessive markdown or formatting
3. Reference specific metrics only when relevant
4. Give one primary recommendation or insight
5. Mention 1-2 risks or considerations
6. End with a clear actionable suggestion

Current Portfolio: ${portfolio.length > 0 ? portfolio.map(p => p.symbol).join(', ') : 'Empty'}
${selectedStock ? `Current Focus: ${selectedStock}` : ''}`

    const { text: aiResponse } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: message,
      temperature: 0.7,
      maxTokens: 400, // Reduced from 1000 for concise responses
    })

    return Response.json({ response: aiResponse })
  } catch (error) {
    console.error('AI Chat Error:', error)
    return Response.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
