// Sistema de Debounce para evitar múltiplos refreshs simultâneos
// Conforme recomendação do Meta: "Espalhe as consultas de maneira uniforme"

interface DebounceOptions {
  delay: number
  maxWait?: number
  leading?: boolean
  trailing?: boolean
}

export class DebounceManager {
  private timers = new Map<string, NodeJS.Timeout>()
  private lastExecuted = new Map<string, number>()

  /**
   * Debounce uma função para evitar execuções múltiplas
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    options: DebounceOptions = { delay: 3000 }
  ): T {
    const { delay, maxWait = delay * 2, leading = false, trailing = true } = options

    return ((...args: Parameters<T>) => {
      const now = Date.now()
      const lastExec = this.lastExecuted.get(key) || 0
      const timeSinceLastExec = now - lastExec

      // Se passou muito tempo desde a última execução, executar imediatamente
      if (timeSinceLastExec > maxWait) {
        this.clearTimer(key)
        this.lastExecuted.set(key, now)
        console.log(`⚡ Debounce: Executando ${key} imediatamente (maxWait excedido)`)
        return func(...args)
      }

      // Se leading é true e é a primeira chamada, executar imediatamente
      if (leading && !this.timers.has(key)) {
        this.lastExecuted.set(key, now)
        console.log(`⚡ Debounce: Executando ${key} imediatamente (leading)`)
        return func(...args)
      }

      // Limpar timer anterior
      this.clearTimer(key)

      // Criar novo timer
      const timer = setTimeout(() => {
        if (trailing) {
          this.lastExecuted.set(key, Date.now())
          console.log(`⏰ Debounce: Executando ${key} após delay`)
          func(...args)
        }
        this.timers.delete(key)
      }, delay)

      this.timers.set(key, timer)
      console.log(`⏳ Debounce: Agendando ${key} para ${delay}ms`)
    }) as T
  }

  /**
   * Throttle uma função para limitar execuções por tempo
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number = 1000
  ): T {
    return ((...args: Parameters<T>) => {
      const now = Date.now()
      const lastExec = this.lastExecuted.get(key) || 0

      if (now - lastExec >= delay) {
        this.lastExecuted.set(key, now)
        console.log(`🚀 Throttle: Executando ${key}`)
        return func(...args)
      } else {
        console.log(`⏸️ Throttle: Ignorando ${key} (muito recente)`)
      }
    }) as T
  }

  /**
   * Limpar timer específico
   */
  clearTimer(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  /**
   * Limpar todos os timers
   */
  clearAllTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.lastExecuted.clear()
  }

  /**
   * Verificar se há timer ativo para uma chave
   */
  hasActiveTimer(key: string): boolean {
    return this.timers.has(key)
  }

  /**
   * Obter estatísticas dos timers
   */
  getStats() {
    return {
      activeTimers: this.timers.size,
      lastExecuted: Object.fromEntries(this.lastExecuted)
    }
  }
}

// Instância global do debounce manager
export const debounceManager = new DebounceManager()

// Hook personalizado para React
export function useDebounce<T extends (...args: any[]) => any>(
  key: string,
  func: T,
  delay: number = 3000
): T {
  return debounceManager.debounce(key, func, { delay })
}

// Hook personalizado para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  key: string,
  func: T,
  delay: number = 1000
): T {
  return debounceManager.throttle(key, func, delay)
}
