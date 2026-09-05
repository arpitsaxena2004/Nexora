import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CareerService } from '../services/career.service';
import { InterviewSession } from '../models';

const router = Router();

const jobMatchSchema = z.object({
  goalId: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position title is required'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  saveAsApplication: z.boolean().optional(),
});

const companyResearchSchema = z.object({
  goalId: z.string().optional(),
  company: z.string().min(1, 'Company name is required'),
  targetRole: z.string().optional(),
});

const startInterviewSchema = z.object({
  goalId: z.string().optional(),
  targetRole: z.string().min(1, 'Target role is required'),
  targetCompany: z.string().optional(),
  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  focusAreas: z.array(z.string()).optional(),
});

const evaluateInterviewSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string(),
      userAnswer: z.string().min(1, 'Answer cannot be empty'),
    })
  ).min(1, 'At least one answer is required for evaluation'),
});

const createApplicationSchema = z.object({
  goalId: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  jobDescription: z.string().optional(),
  jobUrl: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  status: z.enum(['wishlist', 'applied', 'screening', 'technical', 'final_round', 'offer', 'rejected', 'withdrawn']).optional(),
  notes: z.string().optional(),
  appliedDate: z.string().datetime().optional().or(z.date().optional()),
  nextActionDate: z.string().datetime().optional().or(z.date().optional()),
  nextActionType: z.string().optional(),
});

const updateApplicationSchema = createApplicationSchema.partial();

/**
 * @route   POST /api/career/job-match
 * @desc    Run ATS compatibility analysis against candidate profile & RAG resume
 * @access  Private
 */
router.post(
  '/job-match',
  authenticate,
  validate(jobMatchSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await CareerService.evaluateJobMatch({
        userId: req.user!._id,
        goalId: req.body.goalId,
        company: req.body.company,
        position: req.body.position,
        jobDescription: req.body.jobDescription,
        saveAsApplication: req.body.saveAsApplication,
      });

      res.status(200).json({
        message: 'Job match evaluation completed successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Job matching evaluation failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/career/company-research
 * @desc    Generate comprehensive target employer dossier
 * @access  Private
 */
router.post(
  '/company-research',
  authenticate,
  validate(companyResearchSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await CareerService.researchCompany({
        userId: req.user!._id,
        goalId: req.body.goalId,
        company: req.body.company,
        targetRole: req.body.targetRole,
      });

      res.status(200).json({
        message: 'Company research dossier generated successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Company research failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/career/interview/start
 * @desc    Generate personalized mock interview session
 * @access  Private
 */
router.post(
  '/interview/start',
  authenticate,
  validate(startInterviewSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const session = await CareerService.startInterviewSession({
        userId: req.user!._id,
        goalId: req.body.goalId,
        targetRole: req.body.targetRole,
        targetCompany: req.body.targetCompany,
        experienceLevel: req.body.experienceLevel,
        focusAreas: req.body.focusAreas,
      });

      res.status(201).json({
        message: 'Interview simulation session created successfully',
        session,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Interview generation failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/career/interview/evaluate
 * @desc    Evaluate candidate answers and produce scoring breakdown
 * @access  Private
 */
router.post(
  '/interview/evaluate',
  authenticate,
  validate(evaluateInterviewSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const session = await CareerService.evaluateInterviewSession({
        userId: req.user!._id,
        sessionId: req.body.sessionId,
        answers: req.body.answers,
      });

      res.status(200).json({
        message: 'Interview session evaluated successfully',
        session,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Interview evaluation failed', details: err.message });
    }
  }
);

/**
 * @route   GET /api/career/interview/:id
 * @desc    Get interview session details
 * @access  Private
 */
router.get(
  '/interview/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const session = await InterviewSession.findOne({
        _id: req.params.id,
        userId: req.user!._id,
      });

      if (!session) {
        res.status(404).json({ error: 'Interview session not found' });
        return;
      }

      res.status(200).json({ session });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch interview session', details: err.message });
    }
  }
);

/**
 * @route   GET /api/career/applications
 * @desc    List all tracked job applications
 * @access  Private
 */
router.get(
  '/applications',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const applications = await CareerService.listApplications(req.user!._id, {
        status: req.query.status as string,
        goalId: req.query.goalId as string,
      });

      res.status(200).json({
        total: applications.length,
        applications,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch applications', details: err.message });
    }
  }
);

/**
 * @route   POST /api/career/applications
 * @desc    Add a job application to tracking pipeline
 * @access  Private
 */
router.post(
  '/applications',
  authenticate,
  validate(createApplicationSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const application = await CareerService.createApplication(req.user!._id, req.body);
      res.status(201).json({
        message: 'Application added to pipeline successfully',
        application,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to track application', details: err.message });
    }
  }
);

/**
 * @route   PATCH /api/career/applications/:id
 * @desc    Update application stage, match score, or notes
 * @access  Private
 */
router.patch(
  '/applications/:id',
  authenticate,
  validate(updateApplicationSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await CareerService.updateApplication(req.user!._id, req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      res.status(200).json({
        message: 'Application updated successfully',
        application: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update application', details: err.message });
    }
  }
);

/**
 * @route   DELETE /api/career/applications/:id
 * @desc    Delete application from pipeline
 * @access  Private
 */
router.delete(
  '/applications/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deleted = await CareerService.deleteApplication(req.user!._id, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Application not found' });
        return;
      }

      res.status(200).json({ message: 'Application removed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete application', details: err.message });
    }
  }
);

export default router;
