'use client'

// Gráfico de barras horizontais para as visualizações "Vendas por País/Hora/Dia da Semana" do
// Dashboard — segue o procedimento da skill de dataviz: forma antes de cor. Aqui a pergunta dos
// dados é "magnitude" (quem vendeu mais) sobre uma única métrica, não "identidade" (não faz
// sentido codificar país/hora/dia por cor categórica quando o que importa é comparar tamanho),
// então usa um único hue (a cor de marca) em todas as barras — nunca uma cor por categoria — e a
// leitura vem do comprimento da barra, não da cor. Texto/labels ficam sempre em tokens de tinta
// (cinza), nunca na cor da série, conforme a regra de "texto nunca herda a cor da série".
interface BreakdownDatum {
  label: string
  value: number
  secondaryLabel?: string
}

interface BreakdownBarChartProps {
  data: BreakdownDatum[]
  valueFormatter: (value: number) => string
  emptyLabel?: string
  maxItems?: number
}

export default function BreakdownBarChart({
  data,
  valueFormatter,
  emptyLabel = 'Sem dados no período selecionado',
  maxItems
}: BreakdownBarChartProps) {
  const sorted = [...data].filter((d) => d.value > 0)
  const limited = maxItems ? sorted.slice(0, maxItems) : sorted
  const rest = maxItems ? sorted.slice(maxItems) : []
  const restTotal = rest.reduce((sum, d) => sum + d.value, 0)

  const rows: BreakdownDatum[] = restTotal > 0 ? [...limited, { label: 'Outros', value: restTotal }] : limited
  const maxValue = Math.max(...rows.map((d) => d.value), 0)

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row) => {
        const widthPct = maxValue > 0 ? Math.max((row.value / maxValue) * 100, 2) : 0
        return (
          <div key={row.label} title={`${row.label}: ${valueFormatter(row.value)}`} className="group">
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {row.label}
                {row.secondaryLabel && (
                  <span className="text-gray-400 dark:text-gray-500"> · {row.secondaryLabel}</span>
                )}
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white tabular-nums shrink-0">
                {valueFormatter(row.value)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all group-hover:bg-brand-600"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
