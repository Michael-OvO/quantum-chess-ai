/**
 * @file rateLimiter.ts
 * @purpose Rate limiting middleware for API endpoints
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.8
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (req: NextRequest) => string;  // Function to generate rate limit key
}

interface RateLimitEntry {
  requests: number;
  resetTime: number;
}

// In-memory store for rate limiting (consider Redis for production)
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  
  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry
      const newEntry: RateLimitEntry = {
        requests: 1,
        resetTime: now + windowMs
      };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    // Increment existing entry
    entry.requests++;
    return entry;
  }
  
  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }
  
  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimitStore.cleanup(), 60000);
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  return `rate-limit:${ip}:${req.nextUrl.pathname}`;
}

/**
 * Rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator
  } = config;
  
  return async function rateLimiter(req: NextRequest): Promise<{ 
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = keyGenerator(req);
    const entry = rateLimitStore.increment(key, windowMs);
    
    const allowed = entry.requests <= maxRequests;
    const remaining = Math.max(0, maxRequests - entry.requests);
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  general: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100
  }),
  
  // Game creation: 10 games per minute
  createGame: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10
  }),
  
  // Move making: 60 moves per minute
  makeMove: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60
  }),
  
  // Game fetching: 300 requests per minute
  getGame: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 300
  })
};

/**
 * Helper function to apply rate limiting to an API handler
 */
export async function withRateLimit(
  req: NextRequest,
  rateLimiter: ReturnType<typeof createRateLimiter>
): Promise<Response | null> {
  const { allowed, remaining, resetTime } = await rateLimiter(req);
  
  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': retryAfter.toString()
        }
      }
    );
  }
  
  // Add rate limit headers to successful responses
  if (typeof req.headers.set === 'function') {
    req.headers.set('X-RateLimit-Remaining', remaining.toString());
    req.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  }
  
  return null;  // Continue with request
}