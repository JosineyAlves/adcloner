'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

// Gráfico "Horas sem Venda" do Dashboard: mostra, hora a hora (horário de Brasília), a receita
// (para cima) e o gasto (para baixo) no período, para enxergar em quais horários o gasto não vira
// venda. Gasto/receita/ROI totais já existem nos cards do topo, então aqui só entra o que é novo.
//
// Em período de VÁRIOS dias: as horas são somadas por hora do dia (padrão médio) e o gráfico mostra
// as faixas de 3h+ seguidas com gasto e nenhuma venda.
// Em período de UM dia (Hoje, Ontem ou data única): além disso aparecem "gasto após a última venda
// do dia" e o ROI acumulado hora a hora, que só fazem sentido numa leitura diária.
//
// Ideias adiadas (documentadas em claude/horas-sem-venda-grafico.md): modo "Acumulado" das
// colunas e régua de corte de hora.

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
  /** Período de um único dia (Hoje, Ontem ou data personalizada única). */
  singleDay: boolean
  /** Alguma conta ficou sem o fuso horário conhecido — as horas dela podem estar deslocadas. */
  timezoneWarning?: boolean
  /** Alguma conta atingiu o limite de requisições da Meta — dados podem estar incompletos. */
  incomplete?: boolean
}

interface Slot {
  hour: number
  spend: number
  revenue: number
  conversions: number
}

interface Zone {
  from: number // índice do slot
  to: number
  spend: number
}

const SLOTS = Array.from({ length: 24 }, (_, i) => i)
const hh = (h: number) => `${String(h).padStart(2, '0')}h`

const roiOf = (spend: number, revenue: number): number | null => (spend > 0 ? ((revenue - spend) / spend) * 100 : null)
const fmtRoi = (v: number | null) => (v === null ? '–' : `${v >= 0 ? '▲ +' : '▼ −'}${Math.abs(v).toFixed(0)}%`)

function findZones(slots: Slot[]): Zone[] {
  const zones: Zone[] = []
  let i = 0
  while (i < slots.length) {
    if (slots[i].spend > 0 && slots[i].conversions === 0) {
      let j = i
      let spend = 0
      while (j < slots.length && slots[j].spend > 0 && slots[j].conversions === 0) {
        spend += slots[j].spend
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

const PLOT_H = 180

function HourLabels({ slots }: { slots: Slot[] }) {
  return (
    <div className="grid mt-1 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums text-center" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
      {slots.map((s, i) => (
        <span key={i} className={`whitespace-nowrap ${i % 3 !== 0 ? 'invisible' : ''}`}>{hh(s.hour)}</span>
      ))}
    </div>
  )
}

export default function HoursWithoutSalesChart({ rows, loading, valueFormatter, singleDay, timezoneWarning, incomplete }: Props) {
  const roiRef = useRef<HTMLDivElement>(null)
  const [roiWidth, setRoiWidth] = useState(400)

  useEffect(() => {
    const el = roiRef.current
    if (!el) return
    const update = () => setRoiWidth(el.clientWidth || 400)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, rows.length, singleDay])

  const model = useMemo(() => {
    const byHour = SLOTS.map((h) => ({ hour: h, spend: 0, revenue: 0, conversions: 0 }))
    let firstKey = ''
    let firstHour = 0
    for (const r of rows) {
      const h = byHour[r.hour]
      if (!h) continue
      h.spend += r.spend
      h.revenue += r.conversionValues
      h.conversions += r.conversions
      const key = `${r.date}|${String(r.hour).padStart(2, '0')}`
      if (!firstKey || key < firstKey) {
        firstKey = key
        firstHour = r.hour
      }
    }

    // Um dia da conta (ex.: "Hoje" em EST) começa às 02h de Brasília e termina às 01h do dia
    // seguinte; no modo de um dia as colunas seguem essa ordem cronológica para o ROI acumulado
    // fazer sentido. Em vários dias as horas são somadas por hora do dia (00h → 23h).
    const start = singleDay ? firstHour : 0
    const slots: Slot[] = SLOTS.map((i) => byHour[(start + i) % 24])

    const totalSpend = slots.reduce((a, s) => a + s.spend, 0)
    const zones = findZones(slots)
    const zonesTotal = zones.reduce((a, z) => a + z.spend, 0)

    // Gasto depois da última venda do dia (só no modo de um dia). Sem nenhuma venda no dia, o gasto
    // inteiro conta como "sem venda".
    let lastSaleSlot = -1
    slots.forEach((s, i) => {
      if (s.conversions > 0) lastSaleSlot = i
    })
    const afterLastSale = slots.slice(lastSaleSlot + 1).reduce((a, s) => a + s.spend, 0)

    const acc: { spend: number; revenue: number }[] = []
    let cs = 0
    let cr = 0
    slots.forEach((s) => {
      cs += s.spend
      cr += s.revenue
      acc.push({ spend: cs, revenue: cr })
    })

    return { slots, acc, zones, zonesTotal, totalSpend, afterLastSale, lastSaleSlot }
  }, [rows, singleDay])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
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

  const { slots, acc, zones, zonesTotal, totalSpend, afterLastSale, lastSaleSlot } = model
  const maxV = Math.max(...slots.map((s) => Math.max(s.spend, s.revenue)), 1)
  const zoneLabel = (z: Zone) => `${hh(slots[z.from].hour)}–${hh(slots[z.to].hour)}`

  const roiValues = acc.map((a) => roiOf(a.spend, a.revenue) ?? 0)
  const lo = Math.min(0, ...roiValues)
  const hi = Math.max(0, ...roiValues)
  const padY = 12
  const yOf = (v: number) => padY + ((hi - v) / (hi - lo || 1)) * (PLOT_H - padY * 2)
  const xOf = (i: number) => ((i + 0.5) * roiWidth) / 24

  const zoneBand = 'absolute top-0 bottom-0 bg-gray-100 dark:bg-gray-700/40 border-x border-dashed border-gray-300 dark:border-gray-600 pointer-events-none'

  return (
    <div className="space-y-4">
      {/* Indicadores novos (gasto, receita e ROI totais já estão nos cards do topo) */}
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {singleDay && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gasto após a última venda do dia</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{valueFormatter(afterLastSale)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lastSaleSlot === -1 ? 'Nenhuma venda no dia' : `${((afterLastSale / totalSpend) * 100).toFixed(0)}% do gasto · última venda às ${hh(slots[lastSaleSlot].hour)}`}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gasto em faixas sem venda (3h+ seguidas)</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{valueFormatter(zonesTotal)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {zones.length === 0
              ? 'Nenhuma faixa'
              : `${((zonesTotal / totalSpend) * 100).toFixed(0)}% do gasto · ${zones.map((z) => `${zoneLabel(z)} (${valueFormatter(z.spend)})`).join(' · ')}`}
          </p>
        </div>
      </div>

      {(timezoneWarning || incomplete) && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {timezoneWarning && 'Uma ou mais contas não informaram o fuso horário; as horas delas foram tratadas como horário de Brasília. '}
          {incomplete && 'Uma ou mais contas atingiram o limite de requisições da Meta; os valores podem estar incompletos.'}
        </p>
      )}

      <div className={`grid grid-cols-1 gap-6 ${singleDay ? 'lg:grid-cols-2' : ''}`}>
        {/* Receita × Gasto por hora */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Receita × Gasto por hora</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-brand-500" />Receita</span>
              <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />Gasto</span>
            </div>
          </div>
          <div className="relative" style={{ height: PLOT_H }}>
            {zones.map((z) => (
              <div key={z.from} className={zoneBand} style={{ left: `${(z.from * 100) / 24}%`, width: `${((z.to - z.from + 1) * 100) / 24}%` }} />
            ))}
            <div className="relative grid h-full" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {slots.map((s, i) => (
                <div
                  key={i}
                  className="relative hover:bg-gray-100/70 dark:hover:bg-gray-700/40"
                  title={`${hh(s.hour)}–${hh((s.hour + 1) % 24)} · gasto ${valueFormatter(s.spend)} · receita ${valueFormatter(s.revenue)} · ${s.conversions} venda${s.conversions === 1 ? '' : 's'}`}
                >
                  <div className="absolute left-0 right-0 top-0 h-1/2 flex items-end justify-center">
                    <div className="w-[62%] max-w-[22px] rounded-t bg-brand-500" style={{ height: `${(s.revenue / maxV) * 92}%` }} />
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 h-1/2 flex items-start justify-center">
                    <div className="w-[62%] max-w-[22px] rounded-b bg-gray-400 dark:bg-gray-500" style={{ height: `${(s.spend / maxV) * 92}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300 dark:bg-gray-600 pointer-events-none" />
          </div>
          <HourLabels slots={slots} />
        </div>

        {/* ROI acumulado do dia — só em análise de um dia */}
        {singleDay && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">ROI acumulado do dia</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">até cada hora</span>
            </div>
            <div ref={roiRef} className="relative w-full" style={{ height: PLOT_H }}>
              <svg width={roiWidth} height={PLOT_H} className="overflow-visible" role="img" aria-label="ROI acumulado por hora">
                {zones.map((z) => (
                  <rect key={z.from} x={(z.from * roiWidth) / 24} y={0} width={((z.to - z.from + 1) * roiWidth) / 24} height={PLOT_H} className="fill-gray-100 dark:fill-gray-700/40" />
                ))}
                <line x1={0} x2={roiWidth} y1={yOf(0)} y2={yOf(0)} className="stroke-gray-300 dark:stroke-gray-600" strokeDasharray="3 3" />
                <text x={2} y={yOf(0) - 3} fontSize={10} className="fill-gray-400">0%</text>
                <polyline points={roiValues.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')} fill="none" className="stroke-gray-700 dark:stroke-gray-200" strokeWidth={2} strokeLinejoin="round" />
                {roiValues.map((v, i) => (
                  <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3.5} className={`${v >= 0 ? 'fill-brand-600' : 'fill-gray-400'} stroke-white dark:stroke-gray-800`} strokeWidth={2}>
                    <title>{`${hh(slots[i].hour)} · ROI acumulado ${fmtRoi(roiOf(acc[i].spend, acc[i].revenue))}`}</title>
                  </circle>
                ))}
              </svg>
            </div>
            <HourLabels slots={slots} />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Horário de Brasília · gasto registrado pela Meta em cada hora · vendas atribuídas à hora em que o anúncio foi exibido · faixa cinza = 3h+ seguidas sem venda.
      </p>
    </div>
  )
}
