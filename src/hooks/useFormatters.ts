import { useMemo } from 'react'

export const useFormatters = () => {
  const formatters = useMemo(() => ({
    // Currency formatting
    currency: (amount: number, options?: { compact?: boolean; precision?: number }) => {
      const { compact = true, precision = 2 } = options || {}
      
      if (compact) {
        if (amount >= 1_000_000_000) {
          return `$${(amount / 1_000_000_000).toFixed(precision)}B`
        }
        if (amount >= 1_000_000) {
          return `$${(amount / 1_000_000).toFixed(precision)}M`
        }
        if (amount >= 1_000) {
          return `$${(amount / 1_000).toFixed(precision)}K`
        }
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(amount)
    },

    // Percentage formatting
    percentage: (value: number, options?: { precision?: number; showSign?: boolean }) => {
      const { precision = 2, showSign = false } = options || {}
      const formatted = (value * 100).toFixed(precision)
      const sign = showSign && value > 0 ? '+' : ''
      return `${sign}${formatted}%`
    },

    // Token amount formatting
    token: (amount: number | string, options?: { symbol?: string; precision?: number }) => {
      const { symbol = '', precision = 4 } = options || {}
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
      
      if (isNaN(numAmount)) return '0'
      
      const formatted = numAmount.toFixed(precision)
      return symbol ? `${formatted} ${symbol}` : formatted
    },

    // Time formatting
    timeAgo: (timestamp: number) => {
      const now = Date.now()
      const diff = now - timestamp
      
      const minute = 60 * 1000
      const hour = 60 * minute
      const day = 24 * hour
      const week = 7 * day
      const month = 30 * day
      
      if (diff < minute) {
        return 'just now'
      } else if (diff < hour) {
        const minutes = Math.floor(diff / minute)
        return `${minutes}m ago`
      } else if (diff < day) {
        const hours = Math.floor(diff / hour)
        return `${hours}h ago`
      } else if (diff < week) {
        const days = Math.floor(diff / day)
        return `${days}d ago`
      } else if (diff < month) {
        const weeks = Math.floor(diff / week)
        return `${weeks}w ago`
      } else {
        const months = Math.floor(diff / month)
        return `${months}mo ago`
      }
    },

    // Address formatting
    address: (address: string, options?: { start?: number; end?: number }) => {
      const { start = 6, end = 4 } = options || {}
      if (address.length <= start + end) return address
      return `${address.slice(0, start)}...${address.slice(-end)}`
    },

    // Transaction hash formatting
    txHash: (hash: string) => {
      return formatters.address(hash, { start: 8, end: 6 })
    },

    // Number formatting with units
    number: (value: number, options?: { compact?: boolean; precision?: number }) => {
      const { compact = true, precision = 2 } = options || {}
      
      if (compact) {
        if (value >= 1_000_000_000) {
          return `${(value / 1_000_000_000).toFixed(precision)}B`
        }
        if (value >= 1_000_000) {
          return `${(value / 1_000_000).toFixed(precision)}M`
        }
        if (value >= 1_000) {
          return `${(value / 1_000).toFixed(precision)}K`
        }
      }
      
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(value)
    },

    // APY formatting with color
    apy: (value: number) => {
      const formatted = formatters.percentage(value)
      const color = value > 0.2 ? 'text-green-400' : value > 0.1 ? 'text-yellow-400' : 'text-red-400'
      return { formatted, color }
    },

    // Risk level with color
    risk: (apy: number) => {
      if (apy < 0.15) return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' }
      if (apy < 0.25) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
      return { level: 'High', color: 'text-red-400', bg: 'bg-red-500/20' }
    },

    // Price change with color and arrow
    priceChange: (change: number) => {
      const isPositive = change > 0
      const formatted = formatters.percentage(Math.abs(change), { precision: 2 })
      const color = isPositive ? 'text-green-400' : 'text-red-400'
      const arrow = isPositive ? '↗' : '↘'
      const sign = isPositive ? '+' : '-'
      
      return {
        formatted: `${sign}${formatted}`,
        color,
        arrow,
        isPositive,
      }
    },
  }), [])

  return formatters
}