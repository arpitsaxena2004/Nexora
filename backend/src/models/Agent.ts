import { Schema, model } from 'mongoose';
import { IAgentDefinition, IAgentRun } from '../types';

const agentDefinitionSchema = new Schema<IAgentDefinition>(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['career', 'startup', 'core', 'content', 'tool'],
      required: true,
    },
    systemPrompt: { type: String, required: true },
    allowedTools: [{ type: String }],
    knowledgeAccess: { type: Boolean, default: true },
    inputSchema: { type: Schema.Types.Mixed, default: {} },
    outputSchema: { type: Schema.Types.Mixed, default: {} },
    confidenceThreshold: { type: Number, default: 80, min: 0, max: 100 },
    maxRetries: { type: Number, default: 3 },
    isDynamic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const agentRunSchema = new Schema<IAgentRun>(
  {
    agentId: { type: String, required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['started', 'succeeded', 'failed', 'retrying'],
      required: true,
    },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed },
    toolCalls: [
      {
        toolName: { type: String, required: true },
        input: { type: Schema.Types.Mixed },
        output: { type: Schema.Types.Mixed },
        success: { type: Boolean, required: true },
        durationMs: { type: Number, required: true },
      },
    ],
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },
    durationMs: { type: Number },
    error: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AgentDefinition = model<IAgentDefinition>('AgentDefinition', agentDefinitionSchema);
export const AgentRun = model<IAgentRun>('AgentRun', agentRunSchema);
