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
// Gera as iniciais pro avatar de "Minha Conta" (Sidebar + página de perfil) a partir do nome de
// exibição (auth.users.user_metadata.full_name) ou, na falta dele, do email — não fazemos upload
// de foto de perfil, só um círculo com 1-2 letras, então isso é o "avatar" inteiro.
export function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return '?'
  const trimmed = nameOrEmail.trim()
  if (!trimmed) return '?'

  // Nome com espaço ("Josiney Alves") -> "JA". Sem espaço (nome único ou email) -> só a 1ª letra.
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return trimmed[0].toUpperCase()
}
