// Rate limiter para Facebook API
// Limite: 200 chamadas/hora por usuário

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export class FacebookRateLimiter {
  private maxCallsPerHour = 200
  private windowMs = 60 * 60 * 1000 // 1 hora

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    userId: string = 'default',
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Verificar rate limit
        if (this.isRateLimited(userId)) {
          const waitTime = this.getWaitTime(userId)
          console.log(`Rate limit atingido para usuário ${userId}. Aguardando ${waitTime}ms`)
          await this.delay(waitTime)
        }

        // Executar operação
        const result = await operation()
        
        // Registrar chamada bem-sucedida
        this.recordCall(userId)
        
        return result
      } catch (error: any) {
        // Se for erro de rate limit, aguardar e tentar novamente
        if (error.status === 429 || error.code === 613 || error.message?.includes('rate limit')) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000) // Backoff exponencial, max 30s
          console.log(`Rate limit error. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${waitTime}ms`)
          await this.delay(waitTime)
          continue
        }
        
        // Se não for erro de rate limit, re-throw
        throw error
      }
    }
    
    throw new Error('Máximo de tentativas de rate limit atingido')
  }

  private isRateLimited(userId: string): boolean {
    const entry = rateLimitMap.get(userId)
    if (!entry) return false

    const now = Date.now()
    
    // Se passou da janela de tempo, resetar
    if (now > entry.resetTime) {
      rateLimitMap.delete(userId)
      return false
    }

    return entry.count >= this.maxCallsPerHour
  }

  private getWaitTime(userId: string): number {
    const entry = rateLimitMap.get(userId)
    if (!entry) return 0

    const now = Date.now()
    return Math.max(entry.resetTime - now, 0)
  }

  private recordCall(userId: string): void {
    const now = Date.now()
    const entry = rateLimitMap.get(userId)

    if (!entry || now > entry.resetTime) {
      // Nova janela de tempo
      rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + this.windowMs
      })
    } else {
      // Incrementar contador
      entry.count++
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Limpar entradas expiradas (chamado periodicamente)
  cleanup(): void {
    const now = Date.now()
    for (const [userId, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(userId)
      }
    }
  }
}

export const facebookRateLimiter = new FacebookRateLimiter()

// Limpar cache a cada 5 minutos
setInterval(() => {
  facebookRateLimiter.cleanup()
}, 5 * 60 * 1000)
