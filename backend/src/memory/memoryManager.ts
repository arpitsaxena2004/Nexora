import { Types } from 'mongoose';
import { Profile } from '../models/Profile';
import { Goal } from '../models/Goal';
import { Workflow } from '../models/Workflow';
import { Task } from '../models/Task';
import { RetrievalService, RetrievedChunk } from '../rag/retrieval';

export interface ShortTermMemoryContext {
  activeGoalTitle?: string;
  workflowStatus?: string;
  completedTasksCount: number;
  totalTasksCount: number;
  recentTaskOutputs: Array<{ title: string; agentType: string; outputPreview: string }>;
}

export interface LongTermMemoryContext {
  userTrack?: string;
  careerTargetRole?: string;
  careerSkills?: string[];
  startupName?: string;
  startupIndustry?: string;
  startupStage?: string;
  profileCompleteness: number;
}

export interface AgentMemoryContext {
  shortTerm: ShortTermMemoryContext;
  longTerm: LongTermMemoryContext;
  knowledge: {
    chunksFound: number;
    formattedContext: string;
    chunks: RetrievedChunk[];
  };
  assembledPromptContext: string;
}

export class MemoryManager {
  /**
   * Retrieves Short-Term memory (active workflow state and recent task outputs).
   */
  static async getShortTermMemory(userId: string | Types.ObjectId, goalId?: string | Types.ObjectId, workflowId?: string | Types.ObjectId): Promise<ShortTermMemoryContext> {
    const memory: ShortTermMemoryContext = {
      completedTasksCount: 0,
      totalTasksCount: 0,
      recentTaskOutputs: [],
    };

    if (goalId) {
      const gId = typeof goalId === 'string' ? new Types.ObjectId(goalId) : goalId;
      const goal = await Goal.findById(gId).lean();
      if (goal) {
        memory.activeGoalTitle = goal.title;
      }

      const workflowQuery: Record<string, any> = { goalId: gId };
      if (workflowId) {
        workflowQuery._id = typeof workflowId === 'string' ? new Types.ObjectId(workflowId) : workflowId;
      }

      const workflow = await Workflow.findOne(workflowQuery).sort({ createdAt: -1 }).lean();
      if (workflow) {
        memory.workflowStatus = workflow.status;

        const tasks = await Task.find({ workflowId: workflow._id }).lean();
        memory.totalTasksCount = tasks.length;
        memory.completedTasksCount = tasks.filter(t => t.status === 'completed').length;

        const completedTasks = tasks.filter(t => t.status === 'completed' && t.outputPayload);
        memory.recentTaskOutputs = completedTasks.slice(-3).map(t => ({
          title: t.title,
          agentType: t.agentType,
          outputPreview: JSON.stringify(t.outputPayload).substring(0, 180) + '...',
        }));
      }
    }

    return memory;
  }

  /**
   * Retrieves Long-Term memory (user profile, preferences, track records).
   */
  static async getLongTermMemory(userId: string | Types.ObjectId): Promise<LongTermMemoryContext> {
    const uId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const profile = await Profile.findOne({ userId: uId }).lean();

    if (!profile) {
      return { profileCompleteness: 0 };
    }

    return {
      userTrack: profile.activeTrack,
      careerTargetRole: profile.career?.targetRole,
      careerSkills: profile.career?.skills,
      startupName: profile.startup?.startupName,
      startupIndustry: profile.startup?.industry,
      startupStage: profile.startup?.stage,
      profileCompleteness: profile.completenessScore || 0,
    };
  }

  /**
   * Synthesizes all three memory tiers (Short-Term, Long-Term, Knowledge) for agent prompt injection.
   */
  static async assembleAgentMemory(params: {
    userId: string | Types.ObjectId;
    goalId?: string | Types.ObjectId;
    workflowId?: string | Types.ObjectId;
    query?: string;
    topKKnowledge?: number;
  }): Promise<AgentMemoryContext> {
    const [shortTerm, longTerm, knowledge] = await Promise.all([
      this.getShortTermMemory(params.userId, params.goalId, params.workflowId),
      this.getLongTermMemory(params.userId),
      params.query
        ? RetrievalService.retrieve(params.query, {
            userId: params.userId,
            goalId: params.goalId,
            topK: params.topKKnowledge || 4,
          })
        : Promise.resolve({ query: '', chunksFound: 0, chunks: [], formattedContext: '' }),
    ]);

    // Format assembled context text for LLM system prompt
    const parts: string[] = [];

    // Long-Term
    if (longTerm.userTrack) {
      parts.push(`[LONG-TERM USER PROFILE]: Track: ${longTerm.userTrack}${
        longTerm.careerTargetRole ? `, Target: ${longTerm.careerTargetRole}` : ''
      }${longTerm.careerSkills?.length ? `, Skills: ${longTerm.careerSkills.join(', ')}` : ''}${
        longTerm.startupName ? `, Startup: ${longTerm.startupName} (${longTerm.startupIndustry})` : ''
      }`);
    }

    // Short-Term
    if (shortTerm.activeGoalTitle) {
      parts.push(`[SHORT-TERM WORKFLOW STATE]: Goal: "${shortTerm.activeGoalTitle}" (${shortTerm.completedTasksCount}/${shortTerm.totalTasksCount} tasks completed)`);
      if (shortTerm.recentTaskOutputs.length > 0) {
        const recentOuts = shortTerm.recentTaskOutputs.map(o => `${o.agentType}: ${o.outputPreview}`).join(' | ');
        parts.push(`[RECENT AGENT OUTPUTS]: ${recentOuts}`);
      }
    }

    // Knowledge Memory (RAG)
    if (knowledge.formattedContext) {
      parts.push(`[KNOWLEDGE BASE (RAG CONTEXT)]:\n${knowledge.formattedContext}`);
    }

    return {
      shortTerm,
      longTerm,
      knowledge: {
        chunksFound: knowledge.chunksFound,
        formattedContext: knowledge.formattedContext,
        chunks: knowledge.chunks,
      },
      assembledPromptContext: parts.join('\n\n'),
    };
  }
}
