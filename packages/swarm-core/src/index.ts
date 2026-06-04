import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export interface AgentBiddingProposal {
  agent_id: string;
  task_id: string;
  cost_estimate: number;
  confidence_score: number;
  proposal_plan: Record<string, any>;
}

export interface SelectionResult {
  winning_proposal_id: string;
  winning_agent_id: string;
  allocated_cost: number;
  score: number;
}

/**
 * Registers or updates an agent capability profile in the swarm registry
 */
export async function register_agent(payload: {
  id: string;
  organization_id: string;
  capabilities: Record<string, any>;
  cost_profile: Record<string, any>;
  specialization_embedding?: number[];
}): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      id: payload.id,
      organization_id: payload.organization_id,
      capability_vector: payload.capabilities,
      cost_profile: payload.cost_profile,
      specialization_embedding: payload.specialization_embedding,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to register agent in swarm: ${error.message}`);
  }
}

/**
 * Submits a competitive bid proposal for a broadcasted task
 */
export async function submit_proposal(
  organization_id: string,
  proposal: AgentBiddingProposal
): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_proposals')
    .insert({
      organization_id,
      agent_id: proposal.agent_id,
      task_id: proposal.task_id,
      cost_estimate: proposal.cost_estimate,
      confidence_score: proposal.confidence_score,
      proposal_plan: proposal.proposal_plan,
      is_winner: false
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to submit proposal bid: ${error?.message || 'Empty response'}`);
  }

  return data.id;
}

/**
 * Deterministically selects the winning agent bid using the optimization metric:
 * score = (confidence_score * reward_value) / cost_estimate
 */
export async function evaluate_and_select_winner(
  organization_id: string,
  task_id: string
): Promise<SelectionResult> {
  const supabase = getSupabase();

  // 1. Fetch the broadcasted task detail
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', task_id)
    .single();

  if (taskError || !task) {
    throw new Error(`Failed to fetch task broadcast: ${taskError?.message}`);
  }

  // 2. Fetch all submitted proposals for the task
  const { data: proposals, error: propError } = await supabase
    .from('agent_proposals')
    .select('*')
    .eq('task_id', task_id);

  if (propError || !proposals || proposals.length === 0) {
    throw new Error(`No proposals submitted for task: ${task_id}`);
  }

  const rewardValue = Number(task.reward_value);
  let bestScore = -1;
  let winner: any = null;

  // 3. Optimize cost-effectiveness score
  for (const prop of proposals) {
    const cost = Number(prop.cost_estimate) || 0.0001; // Avoid divide-by-zero
    const confidence = Number(prop.confidence_score);
    
    // Competitive selection formula
    const score = (confidence * rewardValue) / cost;
    
    if (score > bestScore) {
      bestScore = score;
      winner = prop;
    }
  }

  if (!winner) {
    throw new Error(`Could not determine a valid proposal winner.`);
  }

  // 4. Update winning and losing bids (transaction wrapper simulation)
  await supabase
    .from('agent_proposals')
    .update({ is_winner: false })
    .eq('task_id', task_id);

  await supabase
    .from('agent_proposals')
    .update({ is_winner: true })
    .eq('id', winner.id);

  await supabase
    .from('agent_tasks')
    .update({ status: 'assigned', updated_at: new Date().toISOString() })
    .eq('id', task_id);

  return {
    winning_proposal_id: winner.id,
    winning_agent_id: winner.agent_id,
    allocated_cost: Number(winner.cost_estimate),
    score: bestScore
  };
}

/**
 * Distributes reinforcement rewards to the winning agent
 */
export async function distribute_reward(
  agent_id: string,
  reward_delta: number
): Promise<void> {
  const supabase = getSupabase();
  
  // Fetch current agent score
  const { data, error } = await supabase
    .from('agents')
    .select('reward_score')
    .eq('id', agent_id)
    .single();

  if (error || !data) {
    throw new Error(`Agent profile not found: ${error?.message}`);
  }

  const newScore = Number(data.reward_score) + reward_delta;

  await supabase
    .from('agents')
    .update({ reward_score: newScore, updated_at: new Date().toISOString() })
    .eq('id', agent_id);
}
