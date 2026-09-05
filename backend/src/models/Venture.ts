import { Schema, model } from 'mongoose';
import { IVenture } from '../types';

const personaSchema = new Schema(
  {
    personaName: { type: String, required: true },
    role: { type: String, required: true },
    companyProfile: { type: String },
    demographics: { type: Schema.Types.Mixed },
    primaryGoals: [{ type: String }],
    corePainPoints: [{ type: String }],
    triggersToBuy: [{ type: String }],
    willingnessToPay: { type: String },
    preferredChannels: [{ type: String }],
  },
  { _id: false }
);

const competitorSchema = new Schema(
  {
    competitorName: { type: String, required: true },
    website: { type: String },
    targetAudience: { type: String },
    pricingModel: { type: String },
    coreFeatures: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    marketGaps: [{ type: String }],
    differentiationAngle: { type: String },
  },
  { _id: false }
);

const pricingTierSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    billingPeriod: { type: String, default: 'monthly' },
    targetUser: { type: String },
    featuresIncluded: [{ type: String }],
    isPopular: { type: Boolean, default: false },
  },
  { _id: false }
);

const businessModelSchema = new Schema(
  {
    revenueModel: { type: String },
    pricingStrategy: { type: String },
    pricingTiers: [pricingTierSchema],
    unitEconomics: {
      estimatedCAC: { type: String },
      estimatedLTV: { type: String },
      paybackPeriodMonths: { type: Number },
      grossMarginPercent: { type: Number },
    },
    expansionRevenueDrivers: [{ type: String }],
  },
  { _id: false }
);

const mvpStrategySchema = new Schema(
  {
    coreValueHypothesis: { type: String },
    mustHaveFeatures: [{ type: String }],
    shouldHaveFeatures: [{ type: String }],
    outOfScopeForMVP: [{ type: String }],
    recommendedTechStack: {
      frontend: [{ type: String }],
      backend: [{ type: String }],
      aiAndModels: [{ type: String }],
      databaseAndCloud: [{ type: String }],
    },
    launchRoadmap30Days: [
      {
        dayRange: { type: String },
        phaseName: { type: String },
        keyDeliverables: [{ type: String }],
      },
    ],
  },
  { _id: false }
);

const ventureSchema = new Schema<IVenture>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal', index: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    industry: { type: String, required: true, trim: true },
    problemStatement: { type: String, required: true },
    valueProposition: { type: String, required: true },
    targetCustomer: { type: String },
    status: {
      type: String,
      enum: ['ideation', 'validation', 'mvp_build', 'beta_launch', 'growth'],
      default: 'ideation',
      index: true,
    },
    personas: [personaSchema],
    competitors: [competitorSchema],
    businessModel: { type: businessModelSchema },
    mvpStrategy: { type: mvpStrategySchema },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Venture = model<IVenture>('Venture', ventureSchema);
