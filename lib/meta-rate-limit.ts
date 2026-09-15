// Estado de rate limit por conta de anúncio, compartilhado entre as rotas do Meta Business
// (accounts/campaigns/adsets/ads).
//
// Problema que isso resolve: quando a Meta retorna "User request limit reached" (código 17,
// subcódigo 2446079 — ou os equivalentes de Business Use Case 80000/80004), as rotas apenas
// repassavam o erro pro cliente e não guardavam nada. Isso significa que um clique em
// "Atualizar" logo depois disparava a MESMA chamada de novo, e a própria documentação da Meta
// avisa que continuar chamando só aumenta o tempo de bloqueio
// (https://developers.facebook.com/docs/graph-api/overview/rate-limiting/).
//
// Estratégia: por conta de anúncio, guardamos (a) até quando devemos evitar chamar a Meta de
// novo, calculado a partir do header X-Business-Use-Case-Usage quando disponível, e (b) o
// último resultado bem-sucedido ("last known good"), para servir como fallback em vez de
// devolver telas vazias enquanto o bloqueio dura.

interface RateLimitBlock {
  blockedUntil: number // epoch ms
  reason: string
}

interface StaleEntry<T> {
  data: T
  savedAt: number
}

const blocks = new Map<string, RateLimitBlock>()
const lastGood = new Map<string, StaleEntry<any>>()

// Usado quando a Meta não informa estimated_time_to_regain_access no header de uso.
const DEFAULT_BLOCK_MINUTES = 5
const MAX_BLOCK_MINUTES = 60
const MIN_BLOCK_MINUTES = 1

export function getRateLimitBlock(accountId: string): RateLimitBlock | null {
  const block = blocks.get(accountId)
  if (!block) return null

  if (Date.now() >= block.blockedUntil) {
    blocks.delete(accountId)
    return null
  }

  return block
}

export function setRateLimitBlock(accountId: string, estimatedMinutes: number | null, reason: string): RateLimitBlock {
  const minutes = Math.min(
    Math.max(estimatedMinutes ?? DEFAULT_BLOCK_MINUTES, MIN_BLOCK_MINUTES),
    MAX_BLOCK_MINUTES
  )

  const block: RateLimitBlock = {
    blockedUntil: Date.now() + minutes * 60 * 1000,
    reason
  }

  blocks.set(accountId, block)
  console.warn(`🚫 Bloqueando novas chamadas à Meta para a conta ${accountId} por ${minutes}min: ${reason}`)

  return block
}

export function saveLastGood<T>(key: string, data: T): void {
  lastGood.set(key, { data, savedAt: Date.now() })
}

export function getLastGood<T>(key: string): StaleEntry<T> | null {
  return (lastGood.get(key) as StaleEntry<T>) || null
}

// Detecta se um corpo de erro da Graph API é especificamente um erro de rate limit —
// código 17/subcódigo 2446079 (Marketing API "Limited Access") ou 80000/80004
// (Business Use Case, para tokens de sistema/página) — em vez de qualquer outro erro 400.
export function isRateLimitErrorBody(errorData: any): boolean {
  const err = errorData?.error
  if (!err) return false

  if (err.code === 17 && err.error_subcode === 2446079) return true
  if (err.code === 80000 || err.code === 80004) return true
  if (typeof err.message === 'string' && err.message.toLowerCase().includes('request limit reached')) return true

  return false
}

export function retryAfterSecondsFor(accountId: string): number {
  const block = getRateLimitBlock(accountId)
  if (!block) return 0
  return Math.max(Math.ceil((block.blockedUntil - Date.now()) / 1000), 1)
}
