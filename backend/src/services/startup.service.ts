import { Types } from 'mongoose';
import { Venture, Goal, Profile } from '../models';
import { AgentRegistry } from '../agents/registry';
import { RetrievalService } from '../rag/retrieval';
import { IVenture } from '../types';

export class StartupService {
  /**
   * Synthesizes Ideal Customer Profile & buyer personas
   */
  static async generateCustomerPersonas(params: {
    userId: Types.ObjectId;
    goalId?: string;
    ventureId?: string;
    idea?: string;
    targetCustomer?: string;
    industry?: string;
  }): Promise<any> {
    const { userId, goalId, ventureId, idea, targetCustomer, industry } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'startup' });

    let knowledgeContext = '';
    try {
      const ragResults = await RetrievalService.retrieve(
        `${idea || ''} ${targetCustomer || ''} customer market business plan persona target`,
        {
          userId,
          category: 'business_plan',
          topK: 4,
        }
      );
      knowledgeContext = ragResults.formattedContext || '';
    } catch (e) {
      // Non-blocking
    }

    const agent = AgentRegistry.getAgent('customer_persona_agent');
    if (!agent) {
      throw new Error('CustomerPersonaAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: idea || 'Startup Venture', extractedData: { targetCustomer, industry } } as any,
      profile: profile || undefined,
      inputPayload: {
        idea: idea || goal?.rawPrompt || profile?.startup?.ideaSummary || 'AI SaaS Venture',
        targetCustomer: targetCustomer || goal?.extractedData?.targetCustomer || profile?.startup?.targetCustomer || 'Small & Midsize Businesses',
        industry: industry || goal?.extractedData?.industry || profile?.startup?.industry || 'AI / SaaS',
      },
      knowledgeContext,
    });

    const personasList = [
      result.outputPayload.primaryPersona,
      result.outputPayload.secondaryPersona,
    ].filter(Boolean);

    if (ventureId) {
      await Venture.findOneAndUpdate(
        { _id: ventureId, userId },
        { $set: { personas: personasList } }
      );
    }

    return {
      icpSummary: result.outputPayload.icpSummary,
      primaryPersona: result.outputPayload.primaryPersona,
      secondaryPersona: result.outputPayload.secondaryPersona,
      customerDiscoveryQuestions: result.outputPayload.customerDiscoveryQuestions,
      verificationScore: result.verificationScore,
    };
  }

  /**
   * Constructs competitive intelligence matrix & differentiation strategy
   */
  static async generateCompetitorMatrix(params: {
    userId: Types.ObjectId;
    goalId?: string;
    ventureId?: string;
    idea?: string;
    industry?: string;
    knownCompetitors?: string[];
  }): Promise<any> {
    const { userId, goalId, ventureId, idea, industry, knownCompetitors } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'startup' });

    let knowledgeContext = '';
    try {
      const ragResults = await RetrievalService.retrieve(
        `${idea || ''} ${industry || ''} competitors market pricing features gaps`,
        {
          userId,
          category: 'business_plan',
          topK: 4,
        }
      );
      knowledgeContext = ragResults.formattedContext || '';
    } catch (e) {
      // Non-blocking
    }

    const agent = AgentRegistry.getAgent('competitor_agent');
    if (!agent) {
      throw new Error('CompetitorAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: idea || 'Startup Venture', extractedData: { industry } } as any,
      profile: profile || undefined,
      inputPayload: {
        idea: idea || goal?.rawPrompt || profile?.startup?.ideaSummary || 'AI SaaS Venture',
        industry: industry || goal?.extractedData?.industry || profile?.startup?.industry || 'AI / SaaS',
        knownCompetitors: knownCompetitors || profile?.startup?.knownCompetitors || [],
      },
      knowledgeContext,
    });

    if (ventureId && result.outputPayload.competitors) {
      await Venture.findOneAndUpdate(
        { _id: ventureId, userId },
        { $set: { competitors: result.outputPayload.competitors } }
      );
    }

    return {
      competitors: result.outputPayload.competitors,
      marketGapSummary: result.outputPayload.marketGapSummary,
      defensibilityMoat: result.outputPayload.defensibilityMoat,
      verificationScore: result.verificationScore,
    };
  }

  /**
   * Formulates business monetization model, pricing tiers, and unit economics
   */
  static async formulateBusinessModel(params: {
    userId: Types.ObjectId;
    goalId?: string;
    ventureId?: string;
    idea?: string;
    targetCustomer?: string;
    industry?: string;
  }): Promise<any> {
    const { userId, goalId, ventureId, idea, targetCustomer, industry } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'startup' });

    const agent = AgentRegistry.getAgent('business_model_agent');
    if (!agent) {
      throw new Error('BusinessModelAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: idea || 'Startup Venture', extractedData: { targetCustomer, industry } } as any,
      profile: profile || undefined,
      inputPayload: {
        idea: idea || goal?.rawPrompt || profile?.startup?.ideaSummary || 'AI SaaS Venture',
        targetCustomer: targetCustomer || goal?.extractedData?.targetCustomer || profile?.startup?.targetCustomer || 'B2B Customers',
        industry: industry || goal?.extractedData?.industry || profile?.startup?.industry || 'AI / SaaS',
      },
    });

    if (ventureId) {
      await Venture.findOneAndUpdate(
        { _id: ventureId, userId },
        { $set: { businessModel: result.outputPayload } }
      );
    }

    return {
      businessModel: result.outputPayload,
      verificationScore: result.verificationScore,
    };
  }

  /**
   * Defines lean MVP scope and 30-day Go-To-Market launch roadmap
   */
  static async designMVPStrategy(params: {
    userId: Types.ObjectId;
    goalId?: string;
    ventureId?: string;
    idea?: string;
    targetCustomer?: string;
    industry?: string;
  }): Promise<any> {
    const { userId, goalId, ventureId, idea, targetCustomer, industry } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'startup' });

    const agent = AgentRegistry.getAgent('mvp_strategy_agent');
    if (!agent) {
      throw new Error('MVPStrategyAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: idea || 'Startup Venture', extractedData: { targetCustomer, industry } } as any,
      profile: profile || undefined,
      inputPayload: {
        idea: idea || goal?.rawPrompt || profile?.startup?.ideaSummary || 'AI SaaS Venture',
        targetCustomer: targetCustomer || goal?.extractedData?.targetCustomer || profile?.startup?.targetCustomer || 'B2B Customers',
        industry: industry || goal?.extractedData?.industry || profile?.startup?.industry || 'AI / SaaS',
      },
    });

    if (ventureId) {
      await Venture.findOneAndUpdate(
        { _id: ventureId, userId },
        { $set: { mvpStrategy: result.outputPayload } }
      );
    }

    return {
      mvpStrategy: result.outputPayload,
      verificationScore: result.verificationScore,
    };
  }

  /**
   * Venture Workspace CRUD
   */
  static async listVentures(userId: Types.ObjectId, goalId?: string): Promise<IVenture[]> {
    const query: any = { userId };
    if (goalId) query.goalId = goalId;
    return Venture.find(query).sort({ updatedAt: -1 });
  }

  static async getVenture(userId: Types.ObjectId, ventureId: string): Promise<IVenture | null> {
    return Venture.findOne({ _id: ventureId, userId });
  }

  static async createVenture(userId: Types.ObjectId, data: Partial<IVenture>): Promise<IVenture> {
    return Venture.create({
      ...data,
      userId,
    });
  }

  static async updateVenture(
    userId: Types.ObjectId,
    ventureId: string,
    updates: Partial<IVenture>
  ): Promise<IVenture | null> {
    return Venture.findOneAndUpdate({ _id: ventureId, userId }, { $set: updates }, { new: true });
  }

  static async deleteVenture(userId: Types.ObjectId, ventureId: string): Promise<boolean> {
    const res = await Venture.deleteOne({ _id: ventureId, userId });
    return res.deletedCount > 0;
  }
}
