import { Schema, model } from 'mongoose';
import { IWorkflow } from '../types';

const workflowSchema = new Schema<IWorkflow>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'running', 'paused', 'completed', 'failed', 'waiting_approval'],
      default: 'pending',
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    taskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    activeTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    currentMilestone: { type: String },
    summaryResult: { type: Schema.Types.Mixed },
    errors: [
      {
        taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const Workflow = model<IWorkflow>('Workflow', workflowSchema);
