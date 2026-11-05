'use client'

/**
 * Funil de performance do Dashboard: Impressões → Cliques no link → Page View (visualização da
 * página de destino) → Initiate Checkout (IC) → Conversões (compras), com a taxa de passagem entre
 * etapas e a perda em cada uma. Desktop: horizontal (esquerda → direita); mobile: vertical.
 *
 * As alturas/larguras das formas são ESTILIZADAS (decrescentes e iguais para qualquer dado) —
 * proporcional de verdade deixaria compras invisíveis perto de milhões de impressões. Os números e
 * as porcentagens são sempre os reais.
 */

interface Stage {
  key: string
  label: string
  short: string // rótulo curto (mobile)
  value: number
}

interface Props {
  impressions: number
  linkClicks: number
  pageViews: number
  checkouts: number
  conversions: number
}

const fmtInt = (n: number) => n.toLocaleString('pt-BR')

function fmtPct(n: number): string {
  const digits = n < 1 ? 2 : n < 10 ? 1 : 1
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

// Alturas (desktop, em unidades de um viewBox de 40) e larguras (mobile, em %) estilizadas.
const HEIGHTS = [36, 29, 22, 15, 9]
const WIDTHS = [100, 82, 64, 46, 30]
const OPACITY = [1, 0.9, 0.8, 0.7, 0.6]

export default function PerformanceFunnel({ impressions, linkClicks, pageViews, checkouts, conversions }: Props) {
  const stages: Stage[] = [
    { key: 'impressions', label: 'Impressões', short: 'Impressões', value: impressions },
    { key: 'clicks', label: 'Cliques no link', short: 'Cliques', value: linkClicks },
    { key: 'pageViews', label: 'Page View', short: 'Page View', value: pageViews },
    { key: 'checkouts', label: 'Initiate Checkout (IC)', short: 'IC', value: checkouts },
    { key: 'conversions', label: 'Conversões', short: 'Conversões', value: conversions }
  ]

  // Taxa de passagem da etapa anterior para esta (null = sem base para calcular).
  const steps = stages.map((s, i) => {
    if (i === 0) return null
    const prev = stages[i - 1].value
    if (prev <= 0) return { rate: null as number | null, loss: null as number | null, hint: '' }
    const rate = (s.value / prev) * 100
    return {
      rate,
      loss: Math.max(0, 100 - rate),
      hint: `${s.short} ÷ ${stages[i - 1].short}: ${fmtInt(s.value)} de ${fmtInt(prev)}`
    }
  })

  const StepPill = ({ i }: { i: number }) => {
    const step = steps[i]
    if (!step) return null
    return (
      <div className="flex flex-col items-center leading-tight" title={step.hint || undefined}>
        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
          {step.rate === null ? '—' : fmtPct(step.rate)}
        </span>
        <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
          {step.loss === null ? '' : `perda ${fmtPct(step.loss)}`}
        </span>
      </div>
    )
  }

  // ---- Desktop: SVG 100 x 40 com 5 colunas de 20 unidades; barra [4,16] + conector [16,24] ----
  const bar = (i: number) => {
    const h = HEIGHTS[i]
    const x = i * 20 + 4
    return { x, y: 20 - h / 2, w: 12, h }
  }
  const connector = (i: number) => {
    const a = HEIGHTS[i] / 2
    const b = HEIGHTS[i + 1] / 2
    const x1 = i * 20 + 16
    const x2 = (i + 1) * 20 + 4
    return `${x1},${20 - a} ${x2},${20 - b} ${x2},${20 + b} ${x1},${20 + a}`
  }

  return (
    <div>
      {/* ===== Desktop (horizontal) ===== */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5">
          {stages.map(s => (
            <div key={s.key} className="text-center px-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
              <div className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{fmtInt(s.value)}</div>
            </div>
          ))}
        </div>

        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-3 block w-full h-24" aria-hidden="true">
          {stages.slice(0, -1).map((_, i) => (
            <polygon key={`c${i}`} points={connector(i)} className="fill-brand-500" fillOpacity={0.28} />
          ))}
          {stages.map((s, i) => {
            const b = bar(i)
            return <rect key={s.key} x={b.x} y={b.y} width={b.w} height={b.h} className="fill-brand-500" fillOpacity={OPACITY[i]} />
          })}
        </svg>

        {/* Taxas centradas na fronteira entre uma coluna e a seguinte */}
        <div className="relative mt-2 h-10">
          {stages.slice(1).map((_, k) => (
            <div key={k} className="absolute top-0 -translate-x-1/2" style={{ left: `${(k + 1) * 20}%` }}>
              <StepPill i={k + 1} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== Mobile (vertical) ===== */}
      <div className="md:hidden flex flex-col items-center">
        {stages.map((s, i) => (
          <div key={s.key} className="w-full flex flex-col items-center">
            {i > 0 && (
              <div className="my-1.5 flex items-center gap-1.5">
                <span className="text-gray-400 text-xs">▼</span>
                <StepPill i={i} />
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            <div
              className="mt-1 rounded-lg bg-brand-500 py-2 text-center text-lg font-bold text-black tabular-nums"
              style={{ width: `${WIDTHS[i]}%`, opacity: OPACITY[i] }}
            >
              {fmtInt(s.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
