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

export default function HoursWithoutSalesChart({ rows, loading, valueFormatter, singleDay, timezoneWarning, incomplete }: Props) {
  const [hover, setHover] = useState<number | null>(null)
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
    const totalRevenue = slots.reduce((a, s) => a + s.revenue, 0)

    const zones = findZones(slots)
    const zonesTotal = zones.reduce((a, z) => a + z.spend, 0)
    const salesHoursSpend = slots.reduce((a, s) => a + (s.conversions > 0 ? s.spend : 0), 0)
    const otherNoSaleSpend = Math.max(totalSpend - zonesTotal - salesHoursSpend, 0)

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

    return { slots, acc, zones, zonesTotal, salesHoursSpend, otherNoSaleSpend, totalSpend, totalRevenue, afterLastSale, lastSaleSlot }
  }, [rows, singleDay])

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

  const { slots, acc, zones, zonesTotal, salesHoursSpend, otherNoSaleSpend, totalSpend, afterLastSale, lastSaleSlot } = model
  const maxV = Math.max(...slots.map((s) => Math.max(s.spend, s.revenue)), 1)
  const biggest = zones.slice().sort((a, b) => b.spend - a.spend)[0]
  const zoneLabel = (z: Zone) => `${hh(slots[z.from].hour)}–${hh(slots[z.to].hour)}`

  const roiValues = acc.map((a) => roiOf(a.spend, a.revenue) ?? 0)
  const lo = Math.min(0, ...roiValues)
  const hi = Math.max(0, ...roiValues)
  const H = 110
  const padY = 10
  const yOf = (v: number) => padY + ((hi - v) / (hi - lo || 1)) * (H - padY * 2)
  const xOf = (i: number) => ((i + 0.5) * roiWidth) / 24
  const peakSlot = roiValues.indexOf(hi)

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 gap-3 ${singleDay ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {singleDay && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Gasto após a última venda do dia</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">{valueFormatter(afterLastSale)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {lastSaleSlot === -1
                ? 'Nenhuma venda no dia: todo o gasto está sem venda'
                : `${((afterLastSale / totalSpend) * 100).toFixed(0)}% do gasto · a partir da hora seguinte à última venda (${hh(slots[lastSaleSlot].hour)})`}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Gasto em faixas sem venda</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">{valueFormatter(zonesTotal)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {zones.length} faixa{zones.length === 1 ? '' : 's'} de 3h+ seguidas · {((zonesTotal / totalSpend) * 100).toFixed(0)}% do gasto
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Maior faixa sem venda</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">{biggest ? zoneLabel(biggest) : '–'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {biggest ? `${valueFormatter(biggest.spend)} gastos, nenhuma venda` : 'Nenhuma faixa de 3h+ sem venda'}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-300 tabular-nums">
        <b>Conferência do gasto ({valueFormatter(totalSpend)}):</b> {valueFormatter(salesHoursSpend)} em horas com venda +{' '}
        {valueFormatter(zonesTotal)} em faixas sem venda (3h+) + {valueFormatter(otherNoSaleSpend)} em outras horas sem venda.
      </p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
        <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[#2a78d6] dark:bg-[#3987e5]" />Receita (para cima)</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm bg-[#eb6834] dark:bg-[#d95926]" />Gasto (para baixo)</span>
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
            <div
              key={z.from}
              className="absolute top-0 bottom-0 bg-orange-500/10 dark:bg-orange-400/15 border-x border-dashed border-orange-400/50 pointer-events-none"
              style={{ left: `${(z.from * 100) / 24}%`, width: `${((z.to - z.from + 1) * 100) / 24}%` }}
            >
              <span className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap text-[11px] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-orange-400/60 rounded-full px-2">
                {zoneLabel(z)} · {valueFormatter(z.spend)} sem venda
              </span>
            </div>
          ))}
          <div className="relative grid h-[220px] sm:h-[250px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
            {slots.map((s, i) => (
              <div
                key={i}
                className="relative hover:bg-gray-100 dark:hover:bg-gray-700/40"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                aria-label={`${hh(s.hour)}: gasto ${valueFormatter(s.spend)}, receita ${valueFormatter(s.revenue)}, ${s.conversions} vendas`}
              >
                <div className="absolute left-0 right-0 top-0 h-1/2 flex items-end justify-center">
                  <div className="w-[62%] max-w-[26px] rounded-t bg-[#2a78d6] dark:bg-[#3987e5]" style={{ height: `${(s.revenue / maxV) * 92}%` }} />
                </div>
                <div className="absolute left-0 right-0 bottom-0 h-1/2 flex items-start justify-center">
                  <div className="w-[62%] max-w-[26px] rounded-b bg-[#eb6834] dark:bg-[#d95926]" style={{ height: `${(s.spend / maxV) * 92}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-400/70 pointer-events-none" />
          <span className="absolute left-0.5 top-0 text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">{valueFormatter(maxV)} ↑</span>
          <span className="absolute left-0.5 bottom-0 text-[10px] text-gray-400 dark:text-gray-500 pointer-events-none">↓ {valueFormatter(maxV)}</span>
        </div>
        <div className="grid mt-1 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums text-center" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
          {slots.map((s, i) => (
            <span key={i} className={`whitespace-nowrap ${i % 3 !== 0 ? 'hidden sm:block' : ''}`}>{hh(s.hour)}</span>
          ))}
        </div>
        <div className="min-h-[20px] mt-2 text-xs text-gray-600 dark:text-gray-300 tabular-nums">
          {hover !== null
            ? `${hh(slots[hover].hour)}–${hh((slots[hover].hour + 1) % 24)} · gasto ${valueFormatter(slots[hover].spend)} · receita ${valueFormatter(slots[hover].revenue)} · ${slots[hover].conversions} venda${slots[hover].conversions === 1 ? '' : 's'}${singleDay ? ` · ROI acumulado do dia ${fmtRoi(roiOf(acc[hover].spend, acc[hover].revenue))}` : ''}`
            : 'Passe o mouse sobre uma hora para ver os detalhes.'}
        </div>
      </div>

      {/* ROI acumulado do dia — só em análise de um dia (eixo próprio, em %, alinhado às colunas) */}
      {singleDay && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 gap-2">
            <span>ROI acumulado do dia, hora a hora</span>
            <span className="text-right">pico {fmtRoi(hi)} às {hh(slots[peakSlot].hour)} · fim do dia {fmtRoi(roiValues[23])}</span>
          </div>
          <div ref={roiRef} className="relative w-full" style={{ height: H }}>
            <svg width={roiWidth} height={H} className="overflow-visible" role="img" aria-label="ROI acumulado por hora">
              {zones.map((z) => (
                <rect key={z.from} x={(z.from * roiWidth) / 24} y={0} width={((z.to - z.from + 1) * roiWidth) / 24} height={H} className="fill-orange-500/10 dark:fill-orange-400/15" />
              ))}
              <line x1={0} x2={roiWidth} y1={yOf(0)} y2={yOf(0)} className="stroke-gray-400" strokeDasharray="3 3" />
              <text x={2} y={yOf(0) - 3} fontSize={10} className="fill-gray-400">ROI 0%</text>
              <polyline points={roiValues.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')} fill="none" className="stroke-gray-900 dark:stroke-gray-100" strokeWidth={2} strokeLinejoin="round" />
              {roiValues.map((v, i) => (
                <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} className={`${v >= 0 ? 'fill-[#2a78d6] dark:fill-[#3987e5]' : 'fill-[#eb6834] dark:fill-[#d95926]'} stroke-white dark:stroke-gray-800`} strokeWidth={2} />
              ))}
            </svg>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Horário de Brasília. O gasto é o valor que a Meta registra em cada hora; a venda é atribuída à hora em que o anúncio foi exibido, não à
        hora da compra, e as vendas mais recentes podem demorar para aparecer. Faixas sombreadas = 3 horas seguidas ou mais com gasto e nenhuma venda.
        {singleDay && ' O dia da conta começa às 02h (Brasília), por isso as colunas partem dessa hora.'}
      </p>
    </div>
  )
}
