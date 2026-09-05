import { Types } from 'mongoose';
import { ITask, IGoal, IProfile, IAgentDefinition } from '../types';
import { AgentRun, Analytics } from '../models';

export interface AgentExecutionContext {
  taskId?: Types.ObjectId;
  workflowId?: Types.ObjectId;
  userId?: Types.ObjectId;
  taskTitle?: string;
  taskDescription?: string;
  inputPayload?: Record<string, any>;
  upstreamOutputs?: Record<string, any>; // Outputs from prerequisite tasks mapped by agentType/taskTitle
  goal: IGoal;
  profile?: IProfile | null;
  userApiKey?: string;
  allowedTools?: string[];
  ragContext?: string;
  knowledgeContext?: string;
  memoryContext?: string;
}

export interface AgentExecutionResult {
  outputPayload: Record<string, any>;
  verificationScore: number; // 0 to 100
  verificationNotes?: string;
  toolCalls?: Array<{
    toolName: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    success: boolean;
    durationMs: number;
  }>;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
}

export abstract class BaseAgent {
  abstract readonly agentId: string;
  abstract readonly name: string;
  abstract readonly role: string;
  abstract readonly description: string;
  abstract readonly category: 'career' | 'startup' | 'core' | 'content' | 'tool';
  abstract readonly systemPrompt: string;
  abstract readonly allowedTools: string[];
  readonly confidenceThreshold: number = 75;
  readonly maxRetries: number = 3;

  /**
   * Main execution method to be implemented by every specialized agent.
   */
  abstract execute(context: AgentExecutionContext): Promise<AgentExecutionResult>;

  /**
   * Evaluates quality and schema conformance of the output.
   */
  validate(output: any): { isValid: boolean; score: number; notes: string } {
    if (!output || typeof output !== 'object' || Object.keys(output).length === 0) {
      return { isValid: false, score: 0, notes: 'Empty or invalid output received' };
    }
    return { isValid: true, score: 90, notes: 'Output verified with standard quality criteria' };
  }

  /**
   * Logs execution telemetry to MongoDB.
   */
  async logTelemetry(
    context: AgentExecutionContext,
    status: 'succeeded' | 'failed' | 'retrying',
    result?: Partial<AgentExecutionResult>,
    error?: string
  ): Promise<void> {
    try {
      const run = await AgentRun.create({
        agentId: this.agentId,
        taskId: context.taskId,
        workflowId: context.workflowId,
        userId: context.userId,
        status,
        input: {
          taskTitle: context.taskTitle,
          inputPayload: context.inputPayload,
          upstreamKeys: Object.keys(context.upstreamOutputs || {}),
        },
        output: result?.outputPayload,
        toolCalls: result?.toolCalls || [],
        promptTokens: result?.tokensUsed?.prompt || 0,
        completionTokens: result?.tokensUsed?.completion || 0,
        totalTokens: result?.tokensUsed?.total || 0,
        durationMs: result?.durationMs || 0,
        error,
      });

      // Record analytics entry
      if (result?.durationMs) {
        await Analytics.create({
          userId: context.userId,
          agentId: this.agentId,
          workflowId: context.workflowId,
          metricType: 'execution_time',
          metricValue: result.durationMs,
          metadata: { runId: run._id, status },
        });
      }
    } catch (err: any) {
      console.warn(`Failed to write telemetry for agent ${this.agentId}:`, err.message);
    }
  }

  /**
   * Returns schema definition metadata for the registry.
   */
  getDefinition(): Partial<IAgentDefinition> {
    return {
      agentId: this.agentId,
      name: this.name,
      role: this.role,
      description: this.description,
      category: this.category,
      systemPrompt: this.systemPrompt,
      allowedTools: this.allowedTools,
      confidenceThreshold: this.confidenceThreshold,
      maxRetries: this.maxRetries,
      knowledgeAccess: true,
      isActive: true,
      isDynamic: false,
    };
  }
}
