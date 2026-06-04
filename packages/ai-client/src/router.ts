// @ts-ignore — resolved by exports field in kernel-graph/package.json
import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { resolve_config } from '@simis/config';
import dotenv from 'dotenv';

dotenv.config();

export interface SelectionCriteria {
  organization_id: string;
  task_type: 'generation' | 'extraction' | 'embeddings' | 'search';
  supportsVision?: boolean;
  supportsToolCalling?: boolean;
  maxContextTokens?: number;
  estimated_cost?: number;
}

export interface ProviderRecord {
  id: string;
  organization_id: string;
  category: string;
  name: string;
  capabilities: {
    supportsVision?: boolean;
    supportsToolCalling?: boolean;
    maxContextTokens?: number;
    [key: string]: any;
  };
  priority: number;
  is_active: boolean;
  quota_daily_limit_usd: number;
  quota_daily_used_usd: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  cooldown_expires_at: string | null;
}

export type ProviderState = 'ACTIVE' | 'DEGRADED' | 'FAILED';

// Strict model bindings matching specific tasks to fixed engines
const LLM_ROUTER_POLICY: Record<string, { model: string; fallback: string }> = {
  'content.generate_brief': { model: 'Gemini 2.0 Pro', fallback: 'OpenRouter Claude 3.7 Sonnet' },
  'content.generate_draft': { model: 'Gemini 2.0 Pro', fallback: 'OpenRouter Llama 3.3' },
  'content.classify_entities': { model: 'Groq Llama 3.3', fallback: 'Gemini 2.0 Flash' },
  'content.extract_claims': { model: 'Groq Llama 3.3', fallback: 'Gemini 2.0 Flash' },
  'learning.run_calibration': { model: 'OpenRouter Claude 3.7 Sonnet', fallback: 'Gemini 2.0 Pro' },
  'system.auto_heal': { model: 'OpenRouter Claude 3.7 Sonnet', fallback: 'Gemini 2.0 Pro' }
};

/**
 * Checks budget allowance for an organization and provider, returning a decision:
 * 'allow' | 'block' | 'downgrade'
 */
export async function check_budget_allowance(
  organization_id: string,
  provider: ProviderRecord,
  estimated_cost: number = 0.0
): Promise<'allow' | 'block' | 'downgrade'> {
  const supabase = getSupabase();

  // If daily used exceeds limit, block
  const projectedUsed = Number(provider.quota_daily_used_usd) + estimated_cost;
  const limit = Number(provider.quota_daily_limit_usd);

  if (projectedUsed > limit) {
    // Log budget violation alert to system alerts table
    await supabase.from('system_alerts').insert({
      organization_id,
      severity: 'critical',
      message: `Budget cap violation: Provider ${provider.name} has consumed $${provider.quota_daily_used_usd} of $${limit} daily limit. Request blocked.`,
      is_resolved: false
    });
    return 'block';
  }

  // Downgrade threshold: used is at 80% or more of daily limit
  if (limit > 0 && projectedUsed / limit >= 0.8) {
    await supabase.from('system_alerts').insert({
      organization_id,
      severity: 'warning',
      message: `Daily budget threshold near limit: Provider ${provider.name} is at ${(projectedUsed / limit * 100).toFixed(1)}% of daily limit ($${provider.quota_daily_used_usd} of $${limit}). Downgrading to fallback tier.`,
      is_resolved: false
    });
    return 'downgrade';
  }

  return 'allow';
}

export async function select_provider(criteria: SelectionCriteria): Promise<ProviderRecord> {
  const { organization_id, task_type, estimated_cost = 0.0 } = criteria;
  const supabase = getSupabase();

  const currentIntentType = criteria.task_type;
  const policy = LLM_ROUTER_POLICY[currentIntentType];

  let primaryName = policy ? policy.model : 'Groq Llama 3';
  let fallbackName = policy ? policy.fallback : 'Gemini 1.5 Flash';

  const { data: rawProviders } = await supabase
    .from('providers')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('is_active', true);

  if (!rawProviders || rawProviders.length === 0) {
    throw new Error(`No active providers found for organization ${organization_id}`);
  }

  // Cast and assert provider states — standard circuit breaker semantics:
  // CLOSED = healthy/ACTIVE, HALF_OPEN = recovering/DEGRADED, OPEN = tripped/FAILED
  const providers = rawProviders.map((p: any) => ({
    ...p,
    state: p.state === 'CLOSED' ? 'ACTIVE' : (p.state === 'HALF_OPEN' ? 'DEGRADED' : 'FAILED')
  })) as Array<Omit<ProviderRecord, 'state'> & { state: ProviderState }>;

  const primaryProvider = providers.find((p) => p.name.toLowerCase() === primaryName.toLowerCase());
  const fallbackProvider = providers.find((p) => p.name.toLowerCase() === fallbackName.toLowerCase());

  const candidates = [];
  
  // Rule check: ACTIVE must be preferred, DEGRADED used only if necessary, FAILED completely bypassed
  if (primaryProvider && primaryProvider.state === 'ACTIVE') candidates.push(primaryProvider);
  if (fallbackProvider && fallbackProvider.state === 'ACTIVE') candidates.push(fallbackProvider);
  
  if (primaryProvider && primaryProvider.state === 'DEGRADED') candidates.push(primaryProvider);
  if (fallbackProvider && fallbackProvider.state === 'DEGRADED') candidates.push(fallbackProvider);

  // Append other candidates
  const remaining = providers
    .filter((p) => p.id !== primaryProvider?.id && p.id !== fallbackProvider?.id && p.state !== 'FAILED')
    .sort((a, b) => a.priority - b.priority);
  candidates.push(...remaining);

  for (const candidate of candidates) {
    const budgetDecision = await check_budget_allowance(organization_id, candidate as any, estimated_cost);
    if (budgetDecision === 'allow') {
      return candidate as any;
    }
  }

  throw new Error(`Provider selection blocked: all matching candidates violated daily budgets.`);
}
