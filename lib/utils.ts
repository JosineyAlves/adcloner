import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateUTMSource(accountName: string, index: number) {
  return `fb${index + 1}`
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'active':
    case 'success':
      return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    case 'pending':
    case 'review':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    case 'failed':
    case 'error':
      return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    case 'disabled':
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
    case 'success':
      return '✓'
    case 'pending':
    case 'review':
      return '⏳'
    case 'failed':
    case 'error':
      return '✗'
    case 'disabled':
      return '⊘'
    default:
      return '?'
  }
} 