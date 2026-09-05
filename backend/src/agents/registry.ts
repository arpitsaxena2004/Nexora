import { BaseAgent } from './base.agent';
import { AgentDefinition } from '../models';
import { ResumeAgent } from './implementations/ResumeAgent';
import { MarketResearchAgent } from './implementations/MarketResearchAgent';
import { CompetitorAgent } from './implementations/CompetitorAgent';
import { SkillGapAgent } from './implementations/SkillGapAgent';
import { StrategyAgent } from './implementations/StrategyAgent';
import { ContentAgent } from './implementations/ContentAgent';
import { VerificationAgent } from './implementations/VerificationAgent';
import { JobMatchingAgent } from './implementations/JobMatchingAgent';
import { CompanyResearchAgent } from './implementations/CompanyResearchAgent';
import { InterviewAgent } from './implementations/InterviewAgent';
import { CustomerPersonaAgent } from './implementations/CustomerPersonaAgent';
import { BusinessModelAgent } from './implementations/BusinessModelAgent';
import { MVPStrategyAgent } from './implementations/MVPStrategyAgent';

export class AgentRegistry {
  private static agents = new Map<string, BaseAgent>();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const defaultAgents: BaseAgent[] = [
      new ResumeAgent(),
      new MarketResearchAgent(),
      new CompetitorAgent(),
      new SkillGapAgent(),
      new StrategyAgent(),
      new ContentAgent(),
      new VerificationAgent(),
      new JobMatchingAgent(),
      new CompanyResearchAgent(),
      new InterviewAgent(),
      new CustomerPersonaAgent(),
      new BusinessModelAgent(),
      new MVPStrategyAgent(),
    ];

    defaultAgents.forEach((agent) => {
      this.agents.set(agent.agentId, agent);
    });

    this.initialized = true;
    console.log(`🤖 Agent Registry initialized with ${this.agents.size} specialized agents.`);
  }

  static getAgent(agentId: string): BaseAgent | undefined {
    if (!this.initialized) this.initialize();
    return this.agents.get(agentId);
  }

  static registerAgent(agent: BaseAgent): void {
    if (!this.initialized) this.initialize();
    this.agents.set(agent.agentId, agent);
  }

  static listAgents(): BaseAgent[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.agents.values());
  }

  /**
   * Syncs agent definitions into MongoDB collection
   */
  static async seedAgentDefinitions(): Promise<void> {
    if (!this.initialized) this.initialize();

    for (const agent of this.agents.values()) {
      const def = agent.getDefinition();
      await AgentDefinition.findOneAndUpdate(
        { agentId: agent.agentId },
        { $set: def },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Agent definitions synchronized with database.');
  }
}
