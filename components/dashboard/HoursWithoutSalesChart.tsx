'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

// Gráfico "Horas sem Venda" do Dashboard: mostra, hora a hora (horário de Brasília), a receita
// (para cima) e o gasto (para baixo) somados no período, para enxergar em quais horários o gasto
// não vira venda. Gasto/receita/ROI totais já existem nos cards do topo, então aqui só entra o que
// é novo: faixas de 3h+ seguidas com gasto e nenhuma venda, "gasto depois da última venda do dia",
// ROI acumulado hora a hora e um corte de hora para comparar o ROI de antes e de depois.

export interface HourlyFunnelRow {
  date: string // AAAA-MM-DD (Brasília)
  hour: number // 0-23 (Brasília)
  spend: number
  conversions: number
  conversionValues: number
}

interface Props {
  rows: HourlyFunnelRow[]
  loading: boolean
  valueFormatter: (value: number) => string
  /** Alguma conta ficou sem o fuso horário conhecido — as horas dela podem estar deslocadas. */
  timezoneWarning?: boolean
  /** Alguma conta atingiu o limite de requisições da Meta — dados podem estar incompletos. */
  incomplete?: boolean
}

interface Zone {
  from: number
  to: number
  spend: number
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const hh = (h: number) => `${String(h).padStart(2, '0')}h`

const roiOf = (spend: number, revenue: number): number | null => (spend > 0 ? ((revenue - spend) / spend) * 100 : null)
const fmtRoi = (v: number | null) => (v === null ? '–' : `${v >= 0 ? '▲ +' : '▼ −'}${Math.abs(v).toFixed(0)}%`)

function findZones(hours: { spend: number; conversions: number }[]): Zone[] {
  const zones: Zone[] = []
  let i = 0
  while (i < 24) {
    if (hours[i].spend > 0 && hours[i].conversions === 0) {
      let j = i
      let spend = 0
      while (j < 24 && hours[j].spend > 0 && hours[j].conversions === 0) {
        spend += hours[j].spend
        j++
      }
      if (j - i >= 3) zones.push({ from: i, to: j - 1, spend })
      i = j
    } else {
      i++
    }
  }
  return zones
}

export default function HoursWithoutSalesChart({ rows, loading, valueFormatter, timezoneWarning, incomplete }: Props) {
  const [mode, setMode] = useState<'hour' | 'acc'>('hour')
  const [cut, setCut] = useState(12)
  const [hover, setHover] = useState<number | null>(null)
  const cutTouched = useRef(false)
  const roiRef = useRef<HTMLDivElement>(null)
  const [roiWidth, setRoiWidth] = useState(800)

  useEffect(() => {
    const el = roiRef.current
    if (!el) return
    const update = () => setRoiWidth(el.clientWidth || 800)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, rows.length])

  const model = useMemo(() => {
    const hours = HOURS.map(() => ({ spend: 0, revenue: 0, conversions: 0 }))
    const days = new Map<string, { spend: number; byHour: { spend: number; conversions: number }[] }>()
    for (const r of rows) {
      const h = hours[r.hour]
      if (!h) continue
      h.spend += r.spend
      h.revenue += r.conversionValues
      h.conversions += r.conversions
      let day = days.get(r.date)
      if (!day) {
        day = { spend: 0, byHour: HOURS.map(() => ({ spend: 0, conversions: 0 })) }
        days.set(r.date, day)
      }
      day.spend += r.spend
      day.byHour[r.hour].spend += r.spend
      day.byHour[r.hour].conversions += r.conversions
    }

    const totalSpend = hours.reduce((a, h) => a + h.spend, 0)
    const totalRevenue = hours.reduce((a, h) => a + h.revenue, 0)

    // Gasto depois da última venda de cada dia (dia sem nenhuma venda: o gasto inteiro do dia).
    let afterLastSale = 0
    let daysWithoutSale = 0
    let lastDayLastSaleHour: number | null = null
    const sortedDates = Array.from(days.keys()).sort()
    sortedDates.forEach((date, idx) => {
      const day = days.get(date)!
      let last = -1
      day.byHour.forEach((h, i) => {
        if (h.conversions > 0) last = i
      })
      if (last === -1) {
        daysWithoutSale++
        afterLastSale += day.spend
      } else {
        afterLastSale += day.byHour.slice(last + 1).reduce((a, h) => a + h.spend, 0)
      }
      if (idx === sortedDates.length - 1 && last !== -1) lastDayLastSaleHour = last
    })

    const acc: { spend: number; revenue: number }[] = []
    let cs = 0
    let cr = 0
    hours.forEach((h) => {
      cs += h.spend
      cr += h.revenue
      acc.push({ spend: cs, revenue: cr })
    })

    const zones = findZones(hours)
    return { hours, acc, zones, totalSpend, totalRevenue, afterLastSale, daysWithoutSale, lastDayLastSaleHour, dayCount: days.size }
  }, [rows])

  // Corte padrão: hora da última venda do dia mais recente (ponto de partida natural da pergunta
  // "quanto gastei depois da última venda?"). Só é reaplicado enquanto o usuário não mexer no controle.
  useEffect(() => {
    if (cutTouched.current) return
    setCut(model.lastDayLastSaleHour ?? 12)
  }, [model.lastDayLastSaleHour])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (rows.length === 0 || model.totalSpend <= 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-500">
        Sem dados por hora no período selecionado
      </div>
    )
  }

  const { hours, acc, zones, totalSpend, totalRevenue, afterLastSale, daysWithoutSale } = model
  const maxV =
    mode === 'hour'
      ? Math.max(...hours.map((h) => Math.max(h.spend, h.revenue)), 1)
      : Math.max(acc[23].spend, acc[23].revenue, 1)
  const zonesTotal = zones.reduce((a, z) => a + z.spend, 0)
  // Conferência: o gasto total se divide em horas COM venda, faixas sem venda (3h+ seguidas) e as
  // demais horas sem venda (faixas curtas, de 1 a 2h). A soma dos três é sempre o gasto do período.
  const salesHoursSpend = hours.reduce((a, h) => a + (h.conversions > 0 ? h.spend : 0), 0)
  const otherNoSaleSpend = Math.max(totalSpend - zonesTotal - salesHoursSpend, 0)
  const biggest = zones.slice().sort((a, b) => b.spend - a.spend)[0]

  const before = acc[cut]
  const afterSpend = totalSpend - before.spend
  const afterRevenue = totalRevenue - before.revenue

  const roiValues = acc.map((a) => roiOf(a.spend, a.revenue) ?? 0)
  const lo = Math.min(0, ...roiValues)
  const hi = Math.max(0, ...roiValues)
  const H = 110
  const padY = 10
  const yOf = (v: number) => padY + ((hi - v) / (hi - lo || 1)) * (H - padY * 2)
  const xOf = (h: number) => ((h + 0.5) * roiWidth) / 24
  const peakHour = roiValues.indexOf(hi)

  const hoverInfo = hover !== null ? { h: hours[hover], a: acc[hover] } : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Gasto após a última venda do dia</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">{valueFormatter(afterLastSale)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {((afterLastSale / totalSpend) * 100).toFixed(0)}% do gasto · a partir da hora seguinte à última venda
            {daysWithoutSale > 0 ? ` · inclui ${daysWithoutSale} dia${daysWithoutSale > 1 ? 's' : ''} sem nenhuma venda` : ''}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Gasto em faixas sem venda</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">{valueFormatter(zonesTotal)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {zones.length} faixa{zones.length === 1 ? '' : 's'} de 3h+ seguidas · {((zonesTotal / totalSpend) * 100).toFixed(0)}% do gasto
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Maior faixa sem venda</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">
            {biggest ? `${hh(biggest.from)}–${hh(biggest.to)}` : '–'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {biggest ? `${valueFormatter(biggest.spend)} gastos, nenhuma venda` : 'Nenhuma faixa de 3h+ sem venda'}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 tabular-nums">
        <b>Conferência do gasto ({valueFormatter(totalSpend)}):</b> {valueFormatter(salesHoursSpend)} em horas com venda +{' '}
        {valueFormatter(zonesTotal)} em faixas sem venda (3h+) + {valueFormatter(otherNoSaleSpend)} em outras horas sem venda.
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" role="group" aria-label="Modo do gráfico">
          {(['hour', 'acc'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-3 py-1.5 ${mode === m ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {m === 'hour' ? 'Por hora' : 'Acumulado'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 sm:ml-auto">
          <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[#2a78d6] dark:bg-[#3987e5]" />Receita (para cima)</span>
          <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[#eb6834] dark:bg-[#d95926]" />Gasto (para baixo)</span>
        </div>
      </div>

      {(timezoneWarning || incomplete) && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {timezoneWarning && 'Uma ou mais contas não informaram o fuso horário; as horas delas foram tratadas como horário de Brasília. '}
          {incomplete && 'Uma ou mais contas atingiram o limite de requisições da Meta; os valores podem estar incompletos.'}
        </p>
      )}

      {/* Colunas por hora */}
      <div className="mt-8 relative">
        <div className="relative">
          {zones.map((z) => (
            <div key={z.from} className="absolute top-0 bottom-0 bg-orange-500/10 dark:bg-orange-400/15 border-x border-dashed border-orange-400/50 pointer-events-none"
              style={{ left: `${(z.from * 100) / 24}%`, width: `${((z.to - z.from + 1) * 100) / 24}%` }}>
              <span className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap text-[11px] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-orange-400/60 rounded-full px-2">
                {hh(z.from)}–{hh(z.to)} · {valueFormatter(z.spend)} sem venda
              </span>
            </div>
          ))}
          <div className="relative grid h-[220px] sm:h-[250px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
            {HOURS.map((h) => {
              const s = mode === 'hour' ? hours[h].spend : acc[h].spend
              const r = mode === 'hour' ? hours[h].revenue : acc[h].revenue
              return (
                <div
                  key={h}
                  className={`relative hover:bg-gray-100 dark:hover:bg-gray-700/40 ${h > cut ? 'opacity-40' : ''}`}
                  onMouseEnter={() => setHover(h)}
                  onMouseLeave={() => setHover(null)}
                  aria-label={`${hh(h)}: gasto ${valueFormatter(hours[h].spend)}, receita ${valueFormatter(hours[h].revenue)}, ${hours[h].conversions} vendas`}
                >
                  <div className="absolute left-0 right-0 top-0 h-1/2 flex items-end justify-center">
                    <div className="w-[62%] max-w-[26px] rounded-t bg-[#2a78d6] dark:bg-[#3987e5]" style={{ height: `${(r / maxV) * 92}%` }} />
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 h-1/2 flex items-start justify-center">
                    <div className="w-[62%] max-w-[26px] rounded-b bg-[#eb6834] dark:bg-[#d95926]" style={{ height: `${(s / maxV) * 92}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-400/70 pointer-events-none" />
          <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-900 dark:border-gray-100 pointer-events-none" style={{ left: `${((cut + 1) * 100) / 24}%` }}>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] rounded-full px-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">corte {hh(cut)}</span>
          </div>
          <span className="absolute left-0.5 top-0 text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">{valueFormatter(maxV)} ↑</span>
          <span className="absolute left-0.5 bottom-0 text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">↓ {valueFormatter(maxV)}</span>
        </div>
        <div className="grid mt-1 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums text-center" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
          {HOURS.map((h) => (
            <span key={h} className={`whitespace-nowrap ${h % 3 !== 0 ? 'hidden sm:block' : ''}`}>{hh(h)}</span>
          ))}
        </div>
        <div className="min-h-[20px] mt-2 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
          {hoverInfo
            ? `${hh(hover!)}–${hh((hover! + 1) % 24)} · gasto ${valueFormatter(hoverInfo.h.spend)} · receita ${valueFormatter(hoverInfo.h.revenue)} · ${hoverInfo.h.conversions} venda${hoverInfo.h.conversions === 1 ? '' : 's'} · ROI acumulado ${fmtRoi(roiOf(hoverInfo.a.spend, hoverInfo.a.revenue))}`
            : 'Passe o mouse sobre uma hora para ver os detalhes.'}
        </div>
      </div>

      {/* ROI acumulado — linha própria (eixo próprio, em %), alinhada com as colunas acima */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 gap-2">
          <span>ROI acumulado do dia, hora a hora</span>
          <span className="text-right">pico {fmtRoi(hi)} às {hh(peakHour)} · fim do dia {fmtRoi(roiValues[23])}</span>
        </div>
        <div ref={roiRef} className="relative w-full" style={{ height: H }}>
          <svg width={roiWidth} height={H} className="overflow-visible" role="img" aria-label="ROI acumulado por hora">
            {zones.map((z) => (
              <rect key={z.from} x={(z.from * roiWidth) / 24} y={0} width={((z.to - z.from + 1) * roiWidth) / 24} height={H} className="fill-orange-500/10 dark:fill-orange-400/15" />
            ))}
            <line x1={0} x2={roiWidth} y1={yOf(0)} y2={yOf(0)} className="stroke-gray-400" strokeDasharray="3 3" />
            <text x={2} y={yOf(0) - 3} fontSize={10} className="fill-gray-400">ROI 0%</text>
            <line x1={((cut + 1) * roiWidth) / 24} x2={((cut + 1) * roiWidth) / 24} y1={0} y2={H} className="stroke-gray-900 dark:stroke-gray-100" strokeWidth={2} strokeDasharray="4 3" />
            <polyline points={roiValues.map((v, h) => `${xOf(h).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')} fill="none" className="stroke-gray-900 dark:stroke-gray-100" strokeWidth={2} strokeLinejoin="round" />
            {roiValues.map((v, h) => (
              <circle key={h} cx={xOf(h)} cy={yOf(v)} r={h === cut ? 5 : 3} className={`${v >= 0 ? 'fill-[#2a78d6] dark:fill-[#3987e5]' : 'fill-[#eb6834] dark:fill-[#d95926]'} stroke-white dark:stroke-gray-800`} strokeWidth={2} />
            ))}
          </svg>
        </div>
      </div>

      {/* Corte de hora */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="hours-cut" className="text-sm text-gray-700 dark:text-gray-300">
            <b>Corte:</b> até as <b>{hh(cut)}</b>
          </label>
          <input
            id="hours-cut"
            type="range"
            min={0}
            max={23}
            step={1}
            value={cut}
            onChange={(e) => {
              cutTouched.current = true
              setCut(+e.target.value)
            }}
            className="flex-1 min-w-[180px] accent-blue-600"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm tabular-nums">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Até as {hh(cut)}</div>
            Gasto {valueFormatter(before.spend)} · Receita {valueFormatter(before.revenue)} · ROI {fmtRoi(roiOf(before.spend, before.revenue))}
          </div>
          <div className="rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Depois das {hh(cut)}</div>
            Gasto {valueFormatter(afterSpend)} · Receita {valueFormatter(afterRevenue)} · ROI {fmtRoi(roiOf(afterSpend, afterRevenue))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Horário de Brasília. A Meta atribui cada venda à hora em que o anúncio foi exibido, não à hora da compra; as vendas mais recentes podem
        demorar para aparecer. Faixas sombreadas = 3 horas seguidas ou mais com gasto e nenhuma venda.
      </p>
    </div>
  )
}
