// Simple in-memory rate limiter and cache
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly maxRequests = 10 // Max requests per minute
  private readonly windowMs = 60 * 1000 // 1 minute window
  private readonly cacheMs = 5 * 60 * 1000 // 5 minutes cache

  canMakeRequest(key: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }

  getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.cacheMs) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  getTimeUntilReset(key: string): number {
    const requests = this.requests.get(key) || []
    if (requests.length === 0) return 0

    const oldestRequest = Math.min(...requests)
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest)
    return Math.max(0, timeUntilReset)
  }
}

export const rateLimiter = new RateLimiter()
