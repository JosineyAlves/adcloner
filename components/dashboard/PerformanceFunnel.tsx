'use client'

/**
 * Funil de performance do Dashboard: Impressões → Cliques no link → Page View → Initiate Checkout (IC)
 * → Conversões, com a taxa de passagem e a perda de cada etapa.
 *
 * Desktop: funil horizontal contínuo (cada segmento é um trapézio que termina na altura em que o
 * próximo começa; nomes/taxas alternam acima e abaixo). Mobile: o mesmo funil na vertical.
 * O formato (larguras/alturas) é ESTILIZADO — igual para qualquer dado, senão as compras
 * ficariam invisíveis perto de milhões de impressões. Os números e % são sempre os reais.
 */

interface Stage {
  key: string
  label: string
  short: string
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
const fmtPct = (n: number) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

// Tamanho (em % do máximo) nas 6 fronteiras do funil: segmento i vai de B[i] até B[i+1].
const B = [100, 80, 62, 46, 33, 22]

// Desktop
const FUNNEL_H = 220 // altura máxima do funil (px)
const AREA_H = 380 // altura total (funil + rótulos acima/abaixo)
const SEG_W = 200 // largura de cada segmento no viewBox (1000 / 5)
const GAP = 4 // vão entre segmentos

export default function PerformanceFunnel({ impressions, linkClicks, pageViews, checkouts, conversions }: Props) {
  const stages: Stage[] = [
    { key: 'impressions', label: 'Impressões', short: 'Impressões', value: impressions },
    { key: 'clicks', label: 'Cliques no link', short: 'Cliques', value: linkClicks },
    { key: 'pageViews', label: 'Page View', short: 'Page View', value: pageViews },
    { key: 'checkouts', label: 'Initiate Checkout', short: 'IC', value: checkouts },
    { key: 'conversions', label: 'Conversões', short: 'Conversões', value: conversions }
  ]

  // Taxa de passagem da etapa anterior para esta (rate null = sem base para calcular).
  const steps = stages.map((s, i) => {
    if (i === 0) return null
    const prev = stages[i - 1].value
    if (prev <= 0) return { rate: null as number | null, loss: null as number | null, hint: '' }
    const rate = (s.value / prev) * 100
    return {
      rate,
      loss: Math.max(0, 100 - rate),
      hint: `${fmtInt(s.value)} de ${fmtInt(prev)} (${stages[i - 1].short} → ${s.short})`
    }
  })

  const StepInfo = ({ i, align = 'center' }: { i: number; align?: 'center' | 'start' }) => {
    const step = steps[i]
    if (!step) return null
    return (
      <div
        className={`flex flex-col leading-tight ${align === 'center' ? 'items-center' : 'items-start'}`}
        title={step.hint || undefined}
      >
        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
          {step.rate === null ? '—' : fmtPct(step.rate)}
        </span>
        <span className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
          {step.loss === null ? '' : `perda ${fmtPct(step.loss)}`}
        </span>
      </div>
    )
  }

  // Trapézio i no viewBox 1000 x 100 (centralizado em y = 50).
  const trapezoid = (i: number, pad = 0) => {
    const x1 = i * SEG_W + GAP / 2
    const x2 = (i + 1) * SEG_W - GAP / 2
    const a = B[i] / 2 + pad
    const b = B[i + 1] / 2 + pad
    return `${x1},${50 - a} ${x2},${50 - b} ${x2},${50 + b} ${x1},${50 + a}`
  }
  const fill = (i: number) => (i % 2 === 0 ? 'fill-brand-500' : 'fill-brand-600')
  const bg = (i: number) => (i % 2 === 0 ? 'bg-brand-500' : 'bg-brand-600')

  return (
    <div>
      {/* ===== Desktop (horizontal) ===== */}
      <div className="hidden md:block relative w-full" style={{ height: AREA_H }}>
        {/* Funil */}
        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="absolute left-0 w-full"
          style={{ top: (AREA_H - FUNNEL_H) / 2, height: FUNNEL_H }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="funnelShadow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Sombra suave atrás de cada segmento (efeito de profundidade) */}
          {stages.map((s, i) => (
            <polygon
              key={`s${s.key}`}
              points={trapezoid(i, 4.5)}
              fill="url(#funnelShadow)"
              className="text-gray-400 dark:text-gray-500"
            />
          ))}
          {stages.map((s, i) => (
            <polygon key={s.key} points={trapezoid(i)} className={fill(i)} />
          ))}
        </svg>

        {/* Valores dentro de cada segmento */}
        {stages.map((s, i) => (
          <div
            key={`v${s.key}`}
            className="absolute -translate-y-1/2 text-center font-bold text-black tabular-nums text-xl lg:text-2xl"
            style={{ left: `${i * 20}%`, width: '20%', top: '50%' }}
          >
            {fmtInt(s.value)}
          </div>
        ))}

        {/* Nome + taxa: pares acima do funil, ímpares abaixo (como na referência) */}
        {stages.map((s, i) => {
          const above = i % 2 === 1
          const offset = (B[i] / 100) * (FUNNEL_H / 2) + 12 // distância da linha central até a borda mais alta do segmento
          const style: React.CSSProperties = {
            left: `${i * 20}%`,
            width: '20%',
            ...(above ? { bottom: `calc(50% + ${offset}px)` } : { top: `calc(50% + ${offset}px)` })
          }
          return (
            <div key={`l${s.key}`} className="absolute px-2 text-center" style={style}>
              {above && i > 0 && (
                <div className="mb-1.5">
                  <StepInfo i={i} />
                </div>
              )}
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</div>
              {!above && i > 0 && (
                <div className="mt-1.5">
                  <StepInfo i={i} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ===== Mobile (vertical) ===== */}
      <div className="md:hidden flex flex-col">
        {stages.map((s, i) => {
          const top = B[i]
          const bottom = B[i + 1]
          const clip = `polygon(${(100 - top) / 2}% 0, ${(100 + top) / 2}% 0, ${(100 + bottom) / 2}% 100%, ${(100 - bottom) / 2}% 100%)`
          return (
            <div key={s.key}>
              {i > 0 && (
                <div className="flex justify-center py-1.5">
                  <StepInfo i={i} />
                </div>
              )}
              <div
                className={`${bg(i)} flex flex-col items-center justify-center text-black`}
                style={{ clipPath: clip, height: 68 }}
              >
                <span className="text-[11px] font-semibold leading-none opacity-80">{s.short}</span>
                <span className="mt-1 text-lg font-bold leading-none tabular-nums">{fmtInt(s.value)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
