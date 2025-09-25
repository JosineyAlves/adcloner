interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  backoffMs: number
}

class RateLimiter {
  private requests: number[] = []
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    
    // Remove requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    )

    // If we're at the limit, wait
    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.config.windowMs - (now - oldestRequest) + 100 // Add 100ms buffer
      
      console.log(`⏳ Rate limit reached. Waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Clean up after waiting
      this.requests = []
    }

    // Record this request
    this.requests.push(now)
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitIfNeeded()
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // Check if it's a rate limit error
        if (error.message?.includes('80004') || error.message?.includes('rate limit')) {
          const backoffTime = this.config.backoffMs * Math.pow(2, attempt - 1)
          console.log(`🔄 Rate limit error (attempt ${attempt}/${maxRetries}). Waiting ${backoffTime}ms...`)
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, backoffTime))
            continue
          }
        }
        
        // If it's not a rate limit error or we've exhausted retries, throw
        throw error
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }
}

// Create rate limiter instances for different API endpoints
export const facebookRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 requests per window
  windowMs: 60000, // 1 minute window
  backoffMs: 1000  // Start with 1 second backoff
})

export const facebookStrictRateLimiter = new RateLimiter({
  maxRequests: 5,  // 5 requests per window for heavy operations
  windowMs: 60000, // 1 minute window
  backoffMs: 2000  // Start with 2 second backoff
})

export default RateLimiter
