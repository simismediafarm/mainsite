import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      redisClient = new Redis({ url, token });
    }
  }
  return redisClient;
}
