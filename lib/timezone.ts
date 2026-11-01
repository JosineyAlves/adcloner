// Conversão de (data, hora) entre fusos usando só Intl — sem dependência extra. Usada pelo gráfico
// "Horas sem Venda" do Dashboard: a Meta devolve as horas no fuso da conta de anúncio (ex.: "EST"),
// mas quem lê o gráfico pensa em horário de Brasília.

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'

// Diferença (em ms) entre o relógio de parede de `tz` e o UTC no instante `ts`.
function zoneOffsetMs(ts: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(new Date(ts))
  const p: Record<string, string> = {}
  for (const part of parts) p[part.type] = part.value
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
  return asUtc - Math.floor(ts / 1000) * 1000
}

export function isValidTimezone(tz: string | null | undefined): tz is string {
  if (!tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Converte "AAAA-MM-DD" + hora cheia (0-23) do fuso `fromTz` para data e hora no fuso `toTz`.
 * Ex.: ('2026-10-31', 9, 'EST') -> { date: '2026-10-31', hour: 11 } em Brasília.
 */
export function convertDateHour(
  date: string,
  hour: number,
  fromTz: string,
  toTz: string = BRAZIL_TIMEZONE
): { date: string; hour: number } {
  const [y, m, d] = date.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, hour)
  // Dois passos para acertar o offset mesmo quando há mudança de horário de verão no meio.
  let utc = guess - zoneOffsetMs(guess, fromTz)
  utc = guess - zoneOffsetMs(utc, fromTz)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: toTz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit'
  }).formatToParts(new Date(utc))
  const p: Record<string, string> = {}
  for (const part of parts) p[part.type] = part.value
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour % 24 }
}
