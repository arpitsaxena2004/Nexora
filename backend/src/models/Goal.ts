import { Schema, model } from 'mongoose';
import { IGoal } from '../types';

const missingGoalInfoSchema = new Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    field: { type: String, required: true },
    importance: { 
      type: String, 
      enum: ['critical', 'high', 'medium', 'low'], 
      default: 'high' 
    },
    answer: { type: String },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const extractedGoalDataSchema = new Schema(
  {
    goalType: { type: String, required: true },
    industry: { type: String },
    targetRole: { type: String },
    targetCustomer: { type: String },
    stage: { type: String },
    objective: { type: String },
    timeHorizon: { type: String },
    budget: { type: Number },
    keyConstraints: [{ type: String }],
    successCriteria: [{ type: String }],
  },
  { _id: false }
);

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile' },
    title: { type: String, required: true, trim: true },
    rawPrompt: { type: String, required: true },
    goalType: {
      type: String,
      enum: ['career', 'startup', 'business', 'product_launch', 'personal_brand', 'freelance', 'custom'],
      default: 'career',
    },
    status: {
      type: String,
      enum: ['draft', 'analyzing', 'clarification_needed', 'planned', 'executing', 'completed', 'paused', 'failed'],
      default: 'draft',
    },
    readinessScore: { type: Number, min: 0, max: 100 },
    extractedData: { type: extractedGoalDataSchema },
    missingInformation: [missingGoalInfoSchema],
    targetDate: { type: Date },
    activeWorkflowId: { type: Schema.Types.ObjectId, ref: 'Workflow' },
  },
  { timestamps: true }
);

export const Goal = model<IGoal>('Goal', goalSchema);
