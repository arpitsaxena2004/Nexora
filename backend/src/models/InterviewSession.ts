import { Schema, model } from 'mongoose';
import { IInterviewSession } from '../types';

const questionItemSchema = new Schema(
  {
    questionId: { type: String, required: true },
    category: {
      type: String,
      enum: ['dsa', 'technical', 'system_design', 'behavioral'],
      required: true,
    },
    question: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    expectedPoints: [{ type: String }],
    userAnswer: { type: String },
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
  },
  { _id: false }
);

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', index: true },
    targetRole: { type: String, required: true, trim: true },
    targetCompany: { type: String, trim: true },
    experienceLevel: { type: String, default: 'mid' },
    focusAreas: [{ type: String }],
    questions: [questionItemSchema],
    overallScore: { type: Number, min: 0, max: 100 },
    overallFeedback: { type: String },
    status: {
      type: String,
      enum: ['created', 'in_progress', 'evaluated'],
      default: 'created',
      index: true,
    },
  },
  { timestamps: true }
);

export const InterviewSession = model<IInterviewSession>('InterviewSession', interviewSessionSchema);
