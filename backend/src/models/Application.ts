import { Schema, model } from 'mongoose';
import { IApplication } from '../types';

const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', index: true },
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    jobDescription: { type: String },
    jobUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    salaryRange: { type: String, trim: true },
    status: {
      type: String,
      enum: ['wishlist', 'applied', 'screening', 'technical', 'final_round', 'offer', 'rejected', 'withdrawn'],
      default: 'wishlist',
      index: true,
    },
    matchScore: { type: Number, min: 0, max: 100 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    notes: { type: String },
    appliedDate: { type: Date },
    nextActionDate: { type: Date },
    nextActionType: { type: String },
    outreachEmailDraft: { type: String },
  },
  { timestamps: true }
);

export const Application = model<IApplication>('Application', applicationSchema);
