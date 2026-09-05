import { Schema, model } from 'mongoose';
import { IAnalytics } from '../types';

const analyticsSchema = new Schema<IAnalytics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    agentId: { type: String, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow' },
    metricType: {
      type: String,
      enum: [
        'execution_time',
        'token_usage',
        'cost',
        'verification_score',
        'retry_count',
        'user_approval_rate',
      ],
      required: true,
      index: true,
    },
    metricValue: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const Analytics = model<IAnalytics>('Analytics', analyticsSchema);
