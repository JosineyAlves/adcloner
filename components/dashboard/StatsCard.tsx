'use client'

import { LucideIcon } from 'lucide-react'

// Paleta de "tons" do card — mapeamento fixo (não gerar classes dinamicamente via template
// string: o Tailwind faz tree-shaking estático do conteúdo, então `bg-${tone}-50` seria
// removido no build de produção). Cada tom usa um badge suave (fundo claro + ícone colorido)
// em vez de fundo sólido saturado + ícone branco — linguagem visual mais "premium SaaS" e
// consistente com o design system (ver app/globals.css).
const TONE_STYLES: Record<string, { badge: string; icon: string }> = {
  red: { badge: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400' },
  green: { badge: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
  emerald: { badge: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  blue: { badge: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
  indigo: { badge: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400' },
  purple: { badge: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400' },
  gray: { badge: 'bg-gray-100 dark:bg-gray-700', icon: 'text-gray-600 dark:text-gray-300' },
}

type Tone = keyof typeof TONE_STYLES

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  icon?: LucideIcon
  /** Tom semântico do badge do ícone — ver TONE_STYLES. Default 'gray'. */
  tone?: Tone
  /** 'primary' = card em destaque (usado nos KPIs principais do topo); 'secondary' = menor
   * peso visual (indicadores derivados). Cria a hierarquia "o que eu preciso saber primeiro". */
  size?: 'primary' | 'secondary'
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  trend = 'neutral',
  description,
  icon: Icon,
  tone = 'gray',
  size = 'primary'
}: StatsCardProps) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.gray

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-400 dark:text-gray-500'
    }
  }

  const isPrimary = size === 'primary'

  return (
    <div className={`card ${isPrimary ? 'p-5' : 'p-4'} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <p className={`font-medium text-gray-500 dark:text-gray-400 truncate ${isPrimary ? 'text-sm' : 'text-xs uppercase tracking-wide'}`}>
              {title}
            </p>
            {trend !== 'neutral' && (
              <span className={`text-xs flex-shrink-0 ${getTrendColor()}`}>
                {getTrendIcon()}
              </span>
            )}
          </div>
          <p className={`font-bold text-gray-900 dark:text-white mt-1 truncate ${isPrimary ? 'text-2xl' : 'text-xl'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm font-medium ${getChangeColor()}`}>
              {change}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`rounded-ds-md flex items-center justify-center flex-shrink-0 ${toneStyle.badge} ${isPrimary ? 'w-11 h-11' : 'w-9 h-9'}`}>
            <Icon className={`${toneStyle.icon} ${isPrimary ? 'w-5 h-5' : 'w-4 h-4'}`} />
          </div>
        )}
      </div>
    </div>
  )
}
