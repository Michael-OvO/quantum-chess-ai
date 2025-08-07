/**
 * @file __mocks__/@vercel/kv.ts
 * @purpose Mock implementation of Vercel KV for testing
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

// Mock implementation of Vercel KV for testing
export const kv = {
  ping: jest.fn().mockResolvedValue('PONG'),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  incr: jest.fn().mockResolvedValue(1),
  mget: jest.fn().mockResolvedValue([]),
  scan: jest.fn().mockResolvedValue([0, []]),
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
};