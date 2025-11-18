# Stock Analytics Chatbot - Setup Guide

## 🚀 Quick Start

### 1. Add Alpha Vantage API Key

To use real stock data instead of mock data, you need to add your Alpha Vantage API key:

**Steps:**
1. Click the **Vars** button in the left sidebar
2. Add a new environment variable:
   - Key: `ALPHA_VANTAGE_API_KEY`
   - Value: `ZD8VKOEJPDZ4MTS6` (provided by you)
3. Save and refresh the page

Your API key is already provided. Free tier supports 5 requests per minute and 100 requests per day.

### 2. Groq Integration (Already Configured)

The chatbot uses Groq's LLM through the AI SDK:
- **Model**: `llama-3.3-70b-versatile` (latest available model)
- **Status**: Connected via your workspace integration
- The Groq API key is automatically managed through the integration

## 🎯 Features

### Real-Time Stock Data
- Live quotes from Alpha Vantage
- 52-week high/low, P/E ratios, market cap
- Historical data for technical analysis
- Actual volume and dividend information

### AI Trading Advisor
- Uses `llama-3.3-70b-versatile` (Groq's latest model)
- Portfolio-aware recommendations
- Technical analysis insights (RSI, MACD, Bollinger Bands)
- Industry-level algorithms and patterns

### Portfolio Management
- Add/remove stocks from portfolio
- Real-time performance tracking
- Risk metrics and asset allocation
- Diversification analysis

## ⚙️ API Limits

**Alpha Vantage Free Tier:**
- 5 API calls per minute
- 100 calls per day
- Sufficient for testing and personal use

**Groq Model:**
- No rate limits on the free tier
- llama-3.3-70b-versatile has 131,000 token context window

## 🔧 Troubleshooting

### "API limit reached" Error
- Alpha Vantage has rate limits
- Wait a minute before making new requests
- Consider upgrading to premium tier for production use

### Chatbot not responding
- Ensure Groq integration is active
- Check that GROQ_API_KEY is set in environment
- Verify your message is being sent

### Stock data not updating
- Check that `ALPHA_VANTAGE_API_KEY` is set
- Verify the stock symbol is valid (AAPL, MSFT, etc.)
- Alpha Vantage API may be delayed during high traffic

## 📊 Supported Stocks

Alpha Vantage supports all US stock symbols. Try these popular ones:
- Tech: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA
- Finance: JPM, BAC, GS, WFC
- Healthcare: JNJ, PFE, UNH, ABBV
- Energy: XOM, CVX, COP, MPC

## 🎓 How to Get an Alpha Vantage Key

1. Visit: https://www.alphavantage.co/api/
2. Fill in the form with your details
3. You'll get a free API key instantly
4. Copy and paste it into the Vars section above
