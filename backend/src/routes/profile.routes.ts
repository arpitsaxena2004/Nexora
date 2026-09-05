import { Router, Response } from 'express';
import { z } from 'zod';
import { Profile } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { IProfile } from '../types';

const router = Router();

// Validation Schemas
const updateProfileSchema = z.object({
  activeTrack: z.enum(['career', 'startup', 'business', 'custom']).optional(),
  career: z
    .object({
      targetRole: z.string().optional(),
      targetCompanies: z.array(z.string()).optional(),
      experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']).optional(),
      education: z
        .array(
          z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string().optional(),
            startYear: z.number().optional(),
            endYear: z.number().optional(),
            gpa: z.string().optional(),
          })
        )
        .optional(),
      skills: z.array(z.string()).optional(),
      projects: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
            technologies: z.array(z.string()),
            link: z.string().optional(),
          })
        )
        .optional(),
      experience: z
        .array(
          z.object({
            company: z.string(),
            role: z.string(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            highlights: z.array(z.string()).optional(),
          })
        )
        .optional(),
      resumeUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      githubUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
      preferredLocation: z.string().optional(),
    })
    .optional(),
  startup: z
    .object({
      startupName: z.string().optional(),
      ideaSummary: z.string().optional(),
      problemStatement: z.string().optional(),
      targetCustomer: z.string().optional(),
      industry: z.string().optional(),
      stage: z.enum(['idea', 'prototype', 'mvp', 'early_traction', 'scaling']).optional(),
      budget: z.number().optional(),
      teamSize: z.number().optional(),
      existingProductUrl: z.string().optional(),
      knownCompetitors: z.array(z.string()).optional(),
      revenueModel: z.string().optional(),
    })
    .optional(),
  customData: z.record(z.any()).optional(),
});

// Helper function to calculate completeness score
function calculateProfileCompleteness(profile: Partial<IProfile>): number {
  let score = 0;
  const track = profile.activeTrack || 'career';

  if (track === 'career' && profile.career) {
    const c = profile.career;
    if (c.targetRole) score += 20;
    if (c.skills && c.skills.length > 0) score += 20;
    if (c.experienceLevel) score += 15;
    if (c.education && c.education.length > 0) score += 15;
    if (c.projects && c.projects.length > 0) score += 15;
    if (c.targetCompanies && c.targetCompanies.length > 0) score += 10;
    if (c.resumeUrl || c.githubUrl || c.linkedinUrl) score += 5;
  } else if (track === 'startup' && profile.startup) {
    const s = profile.startup;
    if (s.startupName || s.ideaSummary) score += 25;
    if (s.problemStatement) score += 20;
    if (s.targetCustomer) score += 20;
    if (s.industry) score += 15;
    if (s.stage) score += 10;
    if (s.knownCompetitors && s.knownCompetitors.length > 0) score += 10;
  } else {
    score = 50; // Custom baseline
  }

  return Math.min(100, score);
}

// 1. GET /api/profile
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let profile = await Profile.findOne({ userId: req.user!._id });

    if (!profile) {
      profile = await Profile.create({
        userId: req.user!._id,
        activeTrack: 'career',
        completenessScore: 0,
      });
    }

    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// 2. PUT /api/profile
router.put('/', authenticate, validate(updateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const updateData = req.body;

    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({ userId });
    }

    if (updateData.activeTrack) profile.activeTrack = updateData.activeTrack;
    if (updateData.career) {
      profile.career = { ...((profile.career as any)?.toObject?.() || profile.career || {}), ...updateData.career };
    }
    if (updateData.startup) {
      profile.startup = { ...((profile.startup as any)?.toObject?.() || profile.startup || {}), ...updateData.startup };
    }
    if (updateData.customData) profile.customData = { ...(profile.customData || {}), ...updateData.customData };

    profile.completenessScore = calculateProfileCompleteness(profile);

    await profile.save();

    res.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

export default router;
