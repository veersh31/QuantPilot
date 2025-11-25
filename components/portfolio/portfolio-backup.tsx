'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileJson, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface PortfolioBackupProps {
  onImport?: () => void
}

export function PortfolioBackup({ onImport }: PortfolioBackupProps) {
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    try {
      // Get all portfolio data from LocalStorage
      const portfolioData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          portfolio: localStorage.getItem('quantpilot-portfolio'),
          transactions: localStorage.getItem('quantpilot-transactions'),
          watchlist: localStorage.getItem('quantpilot-watchlist'),
          alerts: localStorage.getItem('quantpilot-alerts'),
          settings: localStorage.getItem('quantpilot-settings'),
          userProfile: localStorage.getItem('quantpilot-user-profile'),
          paperTrading: localStorage.getItem('quantpilot-paper-trading')
        }
      }

      // Convert to JSON
      const jsonString = JSON.stringify(portfolioData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quantpilot-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Portfolio exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export portfolio')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        // Validate data structure
        if (!data.version || !data.data) {
          throw new Error('Invalid backup file format')
        }

        // Confirm import
        const confirmed = window.confirm(
          'This will overwrite your current portfolio data. Are you sure you want to proceed?'
        )

        if (!confirmed) {
          setImporting(false)
          return
        }

        // Restore data to LocalStorage
        Object.entries(data.data).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, value as string)
          }
        })

        toast.success('Portfolio imported successfully!')

        // Trigger page reload to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error('Import error:', error)
        toast.error('Failed to import portfolio. Invalid file format.')
      } finally {
        setImporting(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  const handleExportCSV = () => {
    try {
      const portfolioStr = localStorage.getItem('quantpilot-portfolio')
      if (!portfolioStr) {
        toast.error('No portfolio data to export')
        return
      }

      const portfolio = JSON.parse(portfolioStr)

      // Create CSV header
      let csv = 'Symbol,Quantity,Average Cost,Current Price,Market Value,Total Gain/Loss,Gain/Loss %\n'

      // Add portfolio rows
      portfolio.forEach((stock: any) => {
        const marketValue = stock.quantity * stock.price
        const totalCost = stock.quantity * stock.avgCost
        const gainLoss = marketValue - totalCost
        const gainLossPercent = (gainLoss / totalCost) * 100

        csv += `${stock.symbol},${stock.quantity},${stock.avgCost.toFixed(2)},${stock.price.toFixed(2)},${marketValue.toFixed(2)},${gainLoss.toFixed(2)},${gainLossPercent.toFixed(2)}%\n`
      })

      // Create download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quantpilot-portfolio-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Portfolio exported as CSV!')
    } catch (error) {
      console.error('CSV export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleExportTransactionsCSV = () => {
    try {
      const transactionsStr = localStorage.getItem('quantpilot-transactions')
      if (!transactionsStr) {
        toast.error('No transaction history to export')
        return
      }

      const transactions = JSON.parse(transactionsStr)

      // Create CSV header
      let csv = 'Date,Type,Symbol,Quantity,Price,Total,Fees,Notes\n'

      // Add transaction rows
      transactions.forEach((txn: any) => {
        const date = new Date(txn.date).toLocaleDateString()
        const total = txn.quantity * txn.price
        const fees = txn.fees || 0
        const notes = (txn.notes || '').replace(/,/g, ';') // Replace commas in notes

        csv += `${date},${txn.type},${txn.symbol},${txn.quantity || ''},${txn.price?.toFixed(2) || ''},${total.toFixed(2)},${fees.toFixed(2)},${notes}\n`
      })

      // Create download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quantpilot-transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Transactions exported as CSV!')
    } catch (error) {
      console.error('Transactions CSV export error:', error)
      toast.error('Failed to export transactions')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson size={20} />
            Portfolio Backup & Restore
          </CardTitle>
          <CardDescription>
            Export your portfolio data for backup or import from a previous export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Export Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download size={16} className="mr-2" />
                Export Full Backup (JSON)
              </Button>
              <Button onClick={handleExportCSV} variant="outline" className="w-full">
                <Download size={16} className="mr-2" />
                Export Portfolio (CSV)
              </Button>
              <Button onClick={handleExportTransactionsCSV} variant="outline" className="w-full">
                <Download size={16} className="mr-2" />
                Export Transactions (CSV)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <CheckCircle2 size={12} className="inline mr-1" />
              Full backup includes portfolio, transactions, watchlist, alerts, and settings
            </p>
          </div>

          {/* Import Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Import Data</h4>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                id="import-file"
                disabled={importing}
              />
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                variant="outline"
                disabled={importing}
                className="w-full md:w-auto"
              >
                <Upload size={16} className="mr-2" />
                {importing ? 'Importing...' : 'Import from Backup (JSON)'}
              </Button>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Warning:</strong> Importing will overwrite your current data. Make sure to export your current portfolio first if you want to keep it.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              <strong>💡 Backup Tips:</strong>
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 space-y-1 ml-4 list-disc">
              <li>Export regularly to avoid data loss (weekly recommended)</li>
              <li>Store backups in multiple locations (cloud storage, external drive)</li>
              <li>Use descriptive filenames with dates for easy organization</li>
              <li>Test your backups occasionally by importing them</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
