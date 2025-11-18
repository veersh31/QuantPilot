import { useCallback } from 'react'

export function useChatWithAI() {
  const generateResponse = useCallback(
    async (userMessage: string, portfolio: any[], selectedStock: string | null) => {
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            portfolio,
            selectedStock,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        const data = await response.json()
        return data.response
      } catch (error) {
        console.error('Error calling AI API:', error)
        throw error
      }
    },
    []
  )

  return { generateResponse }
}
