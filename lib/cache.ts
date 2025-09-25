// Cache simples em memória para reduzir chamadas à API

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em ms
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTtl = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
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

export const cache = new SimpleCache()

// Limpar cache a cada 2 minutos
setInterval(() => {
  cache.cleanup()
}, 2 * 60 * 1000)
