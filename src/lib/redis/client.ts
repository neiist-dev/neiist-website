import Redis from "ioredis";
import type { RedisOptions } from "ioredis";

const baseOptions: RedisOptions = {
  enableReadyCheck: false,
  retryStrategy(times: number) {
    return Math.min(times * 100, 3000);
  },
};

const globalForRedis = globalThis as unknown as {
  __neiistRedis?: Redis;
};

function attachErrorHandler(client: Redis, label: string): Redis {
  client.on("error", (err) => {
    if (process.env.NEXT_PHASE !== "phase-production-build")
      console.error(`[${label}] Error:`, err);
  });
  return client;
}

export function getRedisClient(): Redis {
  if (!globalForRedis.__neiistRedis) {
    globalForRedis.__neiistRedis = attachErrorHandler(
      new Redis(process.env.REDIS_URL as string, baseOptions),
      "Redis Client"
    );
  }
  return globalForRedis.__neiistRedis;
}

export function createDedicatedRedisClient(): Redis {
  return attachErrorHandler(
    new Redis(process.env.REDIS_URL as string, {
      ...baseOptions,
      maxRetriesPerRequest: null,
    }),
    "Redis Worker"
  );
}
