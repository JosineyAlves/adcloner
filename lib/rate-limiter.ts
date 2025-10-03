// Sistema de Rate Limiting para API do Meta
// Baseado nos limites oficiais da documentação do Meta

interface RateLimitInfo {
  count: number
  resetTime: number
  windowStart: number
}

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requisições por janela
  blockDurationMs: number // Duração do bloqueio em ms
}

class RateLimiter {
  private requests: Map<string, RateLimitInfo> = new Map()
  private blocked: Map<string, number> = new Map()
  
  // Configurações baseadas na documentação do Meta
  private readonly configs = {
    // Nível de desenvolvimento (padrão)
    development: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 50, // 50 requisições por hora (conservador)
      blockDurationMs: 60 * 1000 // 1 minuto de bloqueio
    },
    // Nível padrão (quando disponível)
    standard: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 1000, // 1000 requisições por hora
      blockDurationMs: 30 * 1000 // 30 segundos de bloqueio
    }
  }
  
  private currentConfig: RateLimitConfig = this.configs.development
  
  constructor() {
    // Auto-limpeza de dados expirados a cada 5 minutos
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }
  
  /**
   * Verifica se uma requisição pode ser feita
   */
  canMakeRequest(key: string): { allowed: boolean; remainingTime?: number; remainingRequests?: number } {
    const now = Date.now()
    
    // Verificar se está bloqueado
    const blockedUntil = this.blocked.get(key)
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remainingTime: Math.ceil((blockedUntil - now) / 1000)
      }
    }
    
    // Remover bloqueio se expirou
    if (blockedUntil && now >= blockedUntil) {
      this.blocked.delete(key)
    }
    
    // Obter informações da janela atual
    const requestInfo = this.requests.get(key)
    
    if (!requestInfo) {
      // Primeira requisição
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.currentConfig.windowMs,
        windowStart: now
      })
      
      return {
        allowed: true,
        remainingRequests: this.currentConfig.maxRequests - 1
      }
    }
    
    // Verificar se a janela expirou
    if (now >= requestInfo.resetTime) {
      // Resetar contador
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.currentConfig.windowMs,
        windowStart: now
      })
      
      return {
        allowed: true,
        remainingRequests: this.currentConfig.maxRequests - 1
      }
    }
    
    // Verificar se excedeu o limite
    if (requestInfo.count >= this.currentConfig.maxRequests) {
      // Bloquear por um tempo
      this.blocked.set(key, now + this.currentConfig.blockDurationMs)
      
      return {
        allowed: false,
        remainingTime: Math.ceil(this.currentConfig.blockDurationMs / 1000)
      }
    }
    
    // Incrementar contador
    requestInfo.count++
    this.requests.set(key, requestInfo)
    
    return {
      allowed: true,
      remainingRequests: this.currentConfig.maxRequests - requestInfo.count
    }
  }
  
  /**
   * Registra uma requisição (para logging)
   */
  recordRequest(key: string, success: boolean) {
    if (!success) {
      console.warn(`⚠️ Rate limiter: Requisição falhou para ${key}`)
    }
  }
  
  /**
   * Obtém estatísticas de rate limiting
   */
  getStats(key: string) {
    const now = Date.now()
    const requestInfo = this.requests.get(key)
    const blockedUntil = this.blocked.get(key)
    
    return {
      isBlocked: blockedUntil ? now < blockedUntil : false,
      blockedUntil: blockedUntil || null,
      remainingTime: blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0,
      requestCount: requestInfo?.count || 0,
      maxRequests: this.currentConfig.maxRequests,
      windowStart: requestInfo?.windowStart || null,
      windowEnd: requestInfo?.resetTime || null
    }
  }
  
  /**
   * Define o nível de acesso (development ou standard)
   */
  setAccessLevel(level: 'development' | 'standard') {
    this.currentConfig = this.configs[level]
    console.log(`🔄 Rate limiter configurado para nível: ${level}`)
  }
  
  /**
   * Limpa dados expirados
   */
  private cleanup() {
    const now = Date.now()
    
    // Limpar requisições expiradas
    const expiredRequests: string[] = []
    this.requests.forEach((info, key) => {
      if (now >= info.resetTime) {
        expiredRequests.push(key)
      }
    })
    expiredRequests.forEach(key => this.requests.delete(key))
    
    // Limpar bloqueios expirados
    const expiredBlocks: string[] = []
    this.blocked.forEach((blockedUntil, key) => {
      if (now >= blockedUntil) {
        expiredBlocks.push(key)
      }
    })
    expiredBlocks.forEach(key => this.blocked.delete(key))
  }
  
  /**
   * Reseta todos os dados (para testes)
   */
  reset() {
    this.requests.clear()
    this.blocked.clear()
    console.log('🔄 Rate limiter resetado')
  }
}

// Instância global do rate limiter
export const rateLimiter = new RateLimiter()

// Função auxiliar para gerar chave única baseada na conta e tipo de requisição
export function generateRateLimitKey(accountId: string, requestType: string): string {
  return `${accountId}:${requestType}`
}

// Função auxiliar para verificar rate limiting antes de fazer requisições
export async function checkRateLimit(accountId: string, requestType: string): Promise<{
  allowed: boolean
  remainingTime?: number
  remainingRequests?: number
}> {
  const key = generateRateLimitKey(accountId, requestType)
  return rateLimiter.canMakeRequest(key)
}

// Função auxiliar para registrar resultado da requisição
export function recordRequestResult(accountId: string, requestType: string, success: boolean): void {
  const key = generateRateLimitKey(accountId, requestType)
  rateLimiter.recordRequest(key, success)
}