import { Schema, model } from 'mongoose';
import { IProfile } from '../types';

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    activeTrack: { 
      type: String, 
      enum: ['career', 'startup', 'business', 'custom'], 
      default: 'career' 
    },
    career: {
      targetRole: { type: String },
      targetCompanies: [{ type: String }],
      experienceLevel: { 
        type: String, 
        enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'] 
      },
      education: [
        {
          institution: { type: String },
          degree: { type: String },
          fieldOfStudy: { type: String },
          startYear: { type: Number },
          endYear: { type: Number },
          gpa: { type: String },
        },
      ],
      skills: [{ type: String }],
      projects: [
        {
          name: { type: String },
          description: { type: String },
          technologies: [{ type: String }],
          link: { type: String },
        },
      ],
      experience: [
        {
          company: { type: String },
          role: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          highlights: [{ type: String }],
        },
      ],
      resumeUrl: { type: String },
      portfolioUrl: { type: String },
      githubUrl: { type: String },
      linkedinUrl: { type: String },
      preferredLocation: { type: String },
    },
    startup: {
      startupName: { type: String },
      ideaSummary: { type: String },
      problemStatement: { type: String },
      targetCustomer: { type: String },
      industry: { type: String },
      stage: { 
        type: String, 
        enum: ['idea', 'prototype', 'mvp', 'early_traction', 'scaling'], 
        default: 'idea' 
      },
      budget: { type: Number },
      teamSize: { type: Number },
      existingProductUrl: { type: String },
      knownCompetitors: [{ type: String }],
      revenueModel: { type: String },
    },
    customData: { type: Schema.Types.Mixed },
    completenessScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export const Profile = model<IProfile>('Profile', profileSchema);
