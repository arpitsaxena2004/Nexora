import { Schema, model } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    agentType: { type: String, required: true, index: true },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    status: {
      type: String,
      enum: ['pending', 'ready', 'running', 'verification', 'approval_required', 'completed', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    inputPayload: { type: Schema.Types.Mixed, default: {} },
    outputPayload: { type: Schema.Types.Mixed },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    verificationScore: { type: Number, min: 0, max: 100 },
    verificationNotes: { type: String },
    executionTimeMs: { type: Number },
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

export const Task = model<ITask>('Task', taskSchema);
