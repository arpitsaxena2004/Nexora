import { Schema, model } from 'mongoose';
import { IApproval } from '../types';

const approvalSchema = new Schema<IApproval>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    agentId: { type: String, required: true },
    actionType: {
      type: String,
      enum: ['email_send', 'social_publish', 'api_call', 'file_write', 'payment_intent', 'other'],
      required: true,
    },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    targetPayload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'auto_approved'],
      default: 'pending',
      index: true,
    },
    reviewerNotes: { type: String },
    respondedAt: { type: Date },
    executionResult: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Approval = model<IApproval>('Approval', approvalSchema);
