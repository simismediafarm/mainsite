import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';
import lodash from 'lodash';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { mergeWith, isArray, isPlainObject } = lodash;

export interface ConfigContext {
  organization_id?: string;
  domain_id?: string;     // maps to niche_id in schema
  brand_id?: string;
  site_id?: string;
  campaign_id?: string;   // maps to monetization_config_id in schema
  key: string;
}

// Global configurations (System defaults fallback)
export const GLOBAL_CONFIG: Record<string, any> = {
  timeout_ms: 10000,
  max_retries: 3,
  default_language: 'en',
  default_region: 'US',
  posthog_host: 'https://us.i.posthog.com',
  quota_daily_limit_usd: 10.0000,
  layout_template_id: 'default',
  seo_title_template: '{{title}} | {{brand_name}}',
  seo_meta_description_template: '{{description}}',
  cost_priority: 'balanced' // 'cost', 'balanced', 'performance'
};

// Lazy-initialized clients
let supabaseClient: SupabaseClient | null = null;
let redisClient: Redis | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      console.warn('Warning: SUPABASE_URL or keys are missing from environment.');
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

function getRedis(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      redisClient = new Redis({ url, token });
    } else {
      console.warn('Warning: UPSTASH_REDIS_REST_URL or TOKEN is missing. Redis cache will be bypassed.');
    }
  }
  return redisClient;
}

// Custom lodash merge customizer to support array merge instructions
function mergeCustomizer(objValue: any, srcValue: any): any {
  if (isArray(objValue) && isArray(srcValue)) {
    // Check if the child (srcValue) array contains an element: { _merge: true }
    const hasMergeMarker = srcValue.some(
      (item) => isPlainObject(item) && (item as any)._merge === true
    );
    if (hasMergeMarker) {
      const filteredChild = srcValue.filter(
        (item) => !(isPlainObject(item) && (item as any)._merge === true)
      );
      return [...objValue, ...filteredChild];
    }
    // Default array strategy is to override
    return srcValue;
  }
}

// Deep merge two configurations
export function mergeConfigs(parent: any, child: any): any {
  if (isPlainObject(parent) && isPlainObject(child)) {
    return mergeWith({}, parent, child, mergeCustomizer);
  }
  return child !== undefined ? child : parent;
}

/**
 * Resolves a config value by checking hierarchical scopes:
 * Campaign -> Site -> Brand -> Domain -> Org -> Global
 */
export async function resolve_config(context: ConfigContext): Promise<any> {
  const {
    organization_id,
    domain_id,
    brand_id,
    site_id,
    campaign_id,
    key
  } = context;

  const redis = getRedis();
  const cacheKey = `config:${organization_id ?? '_'}:${domain_id ?? '_'}:${brand_id ?? '_'}:${site_id ?? '_'}:${campaign_id ?? '_'}:${key}`;

  // 1. Try to read from Upstash Redis cache
  if (redis) {
    try {
      const cachedValue = await redis.get(cacheKey);
      if (cachedValue !== null) {
        return cachedValue;
      }
    } catch (err) {
      console.error('Redis read error:', err);
    }
  }

  // 2. Fetch raw hierarchical configurations from database
  const values: any[] = [];

  // Global Config is always base
  values.push(GLOBAL_CONFIG[key]);

  const supabase = getSupabase();

  // Organization Level Configuration
  if (organization_id) {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization_id)
        .single();
      if (data) {
        // Look up key in columns or check properties jsonb
        const orgVal = data[key] ?? (data.properties ? data.properties[key] : undefined);
        if (orgVal !== undefined) values.push(orgVal);
      }
    } catch (err) {
      console.error(`Error fetching organization config:`, err);
    }
  }

  // Domain Level Configuration (Niche)
  if (domain_id) {
    try {
      const { data } = await supabase
        .from('niches')
        .select('*')
        .eq('id', domain_id)
        .single();
      if (data) {
        const domainVal = data[key] ?? (data.properties ? data.properties[key] : undefined);
        if (domainVal !== undefined) values.push(domainVal);
      }
    } catch (err) {
      console.error(`Error fetching domain config:`, err);
    }
  }

  // Brand Level Configuration
  if (brand_id) {
    try {
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brand_id)
        .single();
      if (data) {
        const brandVal = data[key] ?? (data.properties ? data.properties[key] : undefined);
        if (brandVal !== undefined) values.push(brandVal);
      }
    } catch (err) {
      console.error(`Error fetching brand config:`, err);
    }
  }

  // Site Level Configuration
  if (site_id) {
    try {
      const { data } = await supabase
        .from('sites')
        .select('*')
        .eq('id', site_id)
        .single();
      if (data) {
        const siteVal = data[key] ?? (data.properties ? data.properties[key] : undefined);
        if (siteVal !== undefined) values.push(siteVal);
      }
    } catch (err) {
      console.error(`Error fetching site config:`, err);
    }
  }

  // Campaign Level Configuration (Monetization config tracking parameters)
  if (campaign_id) {
    try {
      const { data } = await supabase
        .from('monetization_configs')
        .select('*')
        .eq('id', campaign_id)
        .single();
      if (data) {
        const campaignVal = data[key] ?? (data.tracking_parameters ? data.tracking_parameters[key] : undefined);
        if (campaignVal !== undefined) values.push(campaignVal);
      }
    } catch (err) {
      console.error(`Error fetching campaign config:`, err);
    }
  }

  // 3. Resolve using inheritance (reduce right-to-left or left-to-right depending on array order)
  // Our values array is ordered: [Global, Org, Domain, Brand, Site, Campaign]
  // We want to merge them sequentially from Global (least priority) up to Campaign (highest priority)
  let resolvedValue = values[0];
  for (let i = 1; i < values.length; i++) {
    resolvedValue = mergeConfigs(resolvedValue, values[i]);
  }

  // 4. Write back to Redis cache
  if (redis && resolvedValue !== undefined) {
    try {
      // Set dynamic TTL: 60s for campaign and site keys, 300s for organization/global keys
      const ttl = campaign_id || site_id ? 60 : 300;
      await redis.set(cacheKey, resolvedValue, { ex: ttl });
    } catch (err) {
      console.error('Redis write error:', err);
    }
  }

  return resolvedValue;
}

/**
 * Invalidates Redis cache keys matching the updated configuration level
 */
export async function invalidate_cache(payload: {
  organization_id?: string;
  domain_id?: string;
  brand_id?: string;
  site_id?: string;
  campaign_id?: string;
}): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const orgPattern = payload.organization_id ?? '*';
  const domainPattern = payload.domain_id ?? '*';
  const brandPattern = payload.brand_id ?? '*';
  const sitePattern = payload.site_id ?? '*';
  const campaignPattern = payload.campaign_id ?? '*';

  // Match key: config:{org}:{domain}:{brand}:{site}:{campaign}:{key}
  const pattern = `config:${orgPattern}:${domainPattern}:${brandPattern}:${sitePattern}:${campaignPattern}:*`;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`Successfully invalidated ${keys.length} configuration cache keys in Redis.`);
    }
  } catch (err) {
    console.error('Failed to invalidate Redis config cache keys:', err);
  }
}

export function getRedisConfig() {
  const url = process.env.REDIS_URL;
  if (url) {
    return {
      url,
      options: {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        }
      }
    };
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;

  return {
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    }
  };
}

export function createRedisClient(customOptions?: any): IORedis {
  const config = getRedisConfig();
  if ('url' in config && typeof config.url === 'string') {
    return new IORedis(config.url, {
      ...config.options,
      ...customOptions
    });
  }
  const fallbackConfig = config as any;
  return new IORedis({
    host: fallbackConfig.host,
    port: fallbackConfig.port,
    password: fallbackConfig.password,
    maxRetriesPerRequest: fallbackConfig.maxRetriesPerRequest,
    retryStrategy: fallbackConfig.retryStrategy,
    ...customOptions
  });
}
