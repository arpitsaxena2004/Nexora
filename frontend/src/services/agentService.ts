import { AgentData } from '../components/3d/AgentNetwork';
import { AgentStatus } from '../components/3d/AgentNode';

// ─── All 13 registered agents with their categories ───

export interface AgentDefinition {
  name: string;
  displayName: string;
  category: 'career' | 'startup' | 'core';
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // Core agents (top hemisphere crown)
  { name: 'content_agent', displayName: 'Content', category: 'core' },
  { name: 'strategy_agent', displayName: 'Strategy', category: 'core' },
  { name: 'market_research_agent', displayName: 'Research', category: 'core' },
  { name: 'verification_agent', displayName: 'Verification', category: 'core' },

  // Career track agents (left arc)
  { name: 'resume_agent', displayName: 'Resume', category: 'career' },
  { name: 'job_matching_agent', displayName: 'Job Match', category: 'career' },
  { name: 'company_research_agent', displayName: 'Company Intel', category: 'career' },
  { name: 'interview_agent', displayName: 'Interview', category: 'career' },
  { name: 'skill_gap_agent', displayName: 'Skill Gap', category: 'career' },

  // Startup track agents (right arc)
  { name: 'mvp_strategy_agent', displayName: 'MVP', category: 'startup' },
  { name: 'business_model_agent', displayName: 'Biz Model', category: 'startup' },
  { name: 'customer_persona_agent', displayName: 'Persona', category: 'startup' },
  { name: 'competitor_agent', displayName: 'Competitor', category: 'startup' },
];

// Perfectly scaled 3D positions that stay safely within container bounds
const HARMONIC_POSITIONS: Record<string, [number, number, number]> = {
  // Top Core Crown (balanced arc above core)
  content_agent: [-1.4, 1.45, -0.1],
  strategy_agent: [-0.5, 1.85, 0.1],
  market_research_agent: [0.5, 1.85, -0.1],
  verification_agent: [1.4, 1.45, 0.1],

  // Left Career Arc (sweeping left from top to bottom)
  resume_agent: [-2.05, 0.75, 0.15],
  job_matching_agent: [-2.35, -0.05, -0.15],
  company_research_agent: [-2.1, -0.85, 0.15],
  interview_agent: [-1.5, -1.55, -0.1],
  skill_gap_agent: [-0.6, -1.95, 0.1],

  // Right Startup Arc (sweeping right from top to bottom)
  mvp_strategy_agent: [2.05, 0.75, -0.15],
  business_model_agent: [2.35, -0.05, 0.15],
  customer_persona_agent: [2.1, -0.85, -0.15],
  competitor_agent: [0.75, -1.9, 0.15],
};

// ─── Compute 3D constellation positions ───

export function computeConstellationPositions(
  agents: AgentDefinition[],
  scaleFactor: number = 1,
): AgentData[] {
  return agents.map((agent) => {
    const rawPos = HARMONIC_POSITIONS[agent.name] || [0, 1.5, 0];
    const scaledPos: [number, number, number] = [
      rawPos[0] * scaleFactor,
      rawPos[1] * scaleFactor,
      rawPos[2] * scaleFactor,
    ];

    return {
      name: agent.name,
      displayName: agent.displayName,
      category: agent.category,
      status: 'idle',
      position: scaledPos,
    };
  });
}

// ─── Get status color for CSS usage ───

export function getAgentStatusColor(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    idle: '#818cf8',
    running: '#06b6d4',
    completed: '#10b981',
    failed: '#ef4444',
    approval_required: '#f59e0b',
  };
  return map[status] || '#818cf8';
}

// ─── Which agents activate for a given goal type ───

export function getActiveAgentsForGoal(goalType: string): string[] {
  const career = [
    'strategy_agent',
    'resume_agent',
    'job_matching_agent',
    'company_research_agent',
    'interview_agent',
    'skill_gap_agent',
    'market_research_agent',
    'content_agent',
    'verification_agent',
  ];

  const startup = [
    'strategy_agent',
    'market_research_agent',
    'competitor_agent',
    'customer_persona_agent',
    'business_model_agent',
    'mvp_strategy_agent',
    'content_agent',
    'verification_agent',
  ];

  switch (goalType) {
    case 'career':
      return career;
    case 'startup':
      return startup;
    default:
      return AGENT_DEFINITIONS.map((a) => a.name);
  }
}

// ─── Build constellation with live statuses merged ───

export function buildLiveConstellation(
  backendAgents: Array<{ name?: string; agentId?: string; status?: string }> = [],
  goalType?: string,
): AgentData[] {
  const constellation = computeConstellationPositions(AGENT_DEFINITIONS, 1);
  const activeNames = goalType ? getActiveAgentsForGoal(goalType) : null;

  return constellation.map((node) => {
    const match = backendAgents.find(
      (b) => b.name === node.name || b.agentId === node.name,
    );

    let status: AgentStatus = 'idle';
    if (match?.status) {
      if (['running', 'executing'].includes(match.status)) status = 'running';
      else if (['completed', 'done'].includes(match.status)) status = 'completed';
      else if (['failed', 'error'].includes(match.status)) status = 'failed';
      else if (['approval_required', 'pending_approval'].includes(match.status)) status = 'approval_required';
    }

    if (activeNames && !activeNames.includes(node.name)) {
      status = 'idle';
    }

    return { ...node, status };
  });
}
