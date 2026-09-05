import { Schema, model } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'workflow_completed',
        'approval_required',
        'agent_failed',
        'milestone_reached',
        'recommendation_ready',
        'info',
      ],
      default: 'info',
    },
    linkUrl: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>('Notification', notificationSchema);
