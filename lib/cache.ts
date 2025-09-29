// Cache inteligente em memória para reduzir chamadas à API
// TTL otimizado conforme recomendações do Meta

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em ms
}

// TTL otimizado baseado na frequência de mudanças dos dados
const CACHE_TTL = {
  campaigns: 15 * 60 * 1000,    // 15 minutos - campanhas mudam menos
  adsets: 10 * 60 * 1000,       // 10 minutos - adsets mudam moderadamente  
  ads: 8 * 60 * 1000,           // 8 minutos - ads mudam mais frequentemente
  insights: 20 * 60 * 1000,     // 20 minutos - insights são mais estáveis
  accounts: 30 * 60 * 1000,     // 30 minutos - contas mudam raramente
  default: 5 * 60 * 1000        // 5 minutos - padrão
} as const

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTtl = CACHE_TTL.default

  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Define cache com TTL inteligente baseado no tipo de dados
   */
  setWithIntelligentTTL<T>(key: string, data: T, dataType: keyof typeof CACHE_TTL = 'default'): void {
    const ttl = CACHE_TTL[dataType]
    this.set(key, data, ttl)
    console.log(`💾 Cache definido para ${dataType}: TTL ${ttl / 60000}min`)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Verifica se existe cache válido para a chave
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    })

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      hitRate: validEntries / this.cache.size * 100
    }
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Gerar chave de cache baseada em parâmetros
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `${prefix}:${sortedParams}`
  }
}

export const cache = new IntelligentCache()

// Limpar cache a cada 2 minutos e logar estatísticas
setInterval(() => {
  cache.cleanup()
  const stats = cache.getStats()
  if (stats.total > 0) {
    console.log(`📊 Cache Stats: ${stats.valid}/${stats.total} válidos (${stats.hitRate.toFixed(1)}% hit rate)`)
  }
}, 2 * 60 * 1000)

