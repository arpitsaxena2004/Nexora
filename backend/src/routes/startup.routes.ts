import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { StartupService } from '../services/startup.service';

const router = Router();

const generatePersonaSchema = z.object({
  goalId: z.string().optional(),
  ventureId: z.string().optional(),
  idea: z.string().optional(),
  targetCustomer: z.string().optional(),
  industry: z.string().optional(),
});

const generateCompetitorMatrixSchema = z.object({
  goalId: z.string().optional(),
  ventureId: z.string().optional(),
  idea: z.string().optional(),
  industry: z.string().optional(),
  knownCompetitors: z.array(z.string()).optional(),
});

const generateBusinessModelSchema = z.object({
  goalId: z.string().optional(),
  ventureId: z.string().optional(),
  idea: z.string().optional(),
  targetCustomer: z.string().optional(),
  industry: z.string().optional(),
});

const generateMVPRoadmapSchema = z.object({
  goalId: z.string().optional(),
  ventureId: z.string().optional(),
  idea: z.string().optional(),
  targetCustomer: z.string().optional(),
  industry: z.string().optional(),
});

const createVentureSchema = z.object({
  goalId: z.string().optional(),
  name: z.string().min(1, 'Venture name is required'),
  tagline: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  problemStatement: z.string().min(5, 'Problem statement must be at least 5 characters'),
  valueProposition: z.string().min(5, 'Value proposition must be at least 5 characters'),
  targetCustomer: z.string().optional(),
  status: z.enum(['ideation', 'validation', 'mvp_build', 'beta_launch', 'growth']).optional(),
  personas: z.array(z.any()).optional(),
  competitors: z.array(z.any()).optional(),
  businessModel: z.any().optional(),
  mvpStrategy: z.any().optional(),
  notes: z.string().optional(),
}).passthrough();

const updateVentureSchema = createVentureSchema.partial();

/**
 * @route   POST /api/startup/customer-persona
 * @desc    Generate Ideal Customer Profile & high-fidelity buyer personas
 * @access  Private
 */
router.post(
  '/customer-persona',
  authenticate,
  validate(generatePersonaSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await StartupService.generateCustomerPersonas({
        userId: req.user!._id,
        goalId: req.body.goalId,
        ventureId: req.body.ventureId,
        idea: req.body.idea,
        targetCustomer: req.body.targetCustomer,
        industry: req.body.industry,
      });

      res.status(200).json({
        message: 'Customer persona synthesis completed successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Customer persona synthesis failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/startup/competitor-matrix
 * @desc    Generate competitive intelligence matrix and differentiation angles
 * @access  Private
 */
router.post(
  '/competitor-matrix',
  authenticate,
  validate(generateCompetitorMatrixSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await StartupService.generateCompetitorMatrix({
        userId: req.user!._id,
        goalId: req.body.goalId,
        ventureId: req.body.ventureId,
        idea: req.body.idea,
        industry: req.body.industry,
        knownCompetitors: req.body.knownCompetitors,
      });

      res.status(200).json({
        message: 'Competitor intelligence matrix generated successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Competitor matrix generation failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/startup/business-model
 * @desc    Generate monetization structure, tiered pricing, and unit economics
 * @access  Private
 */
router.post(
  '/business-model',
  authenticate,
  validate(generateBusinessModelSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await StartupService.formulateBusinessModel({
        userId: req.user!._id,
        goalId: req.body.goalId,
        ventureId: req.body.ventureId,
        idea: req.body.idea,
        targetCustomer: req.body.targetCustomer,
        industry: req.body.industry,
      });

      res.status(200).json({
        message: 'Business model & pricing architecture formulated successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Business model formulation failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/startup/mvp-roadmap
 * @desc    Design lean MVP scope and 30-day Go-To-Market launch roadmap
 * @access  Private
 */
router.post(
  '/mvp-roadmap',
  authenticate,
  validate(generateMVPRoadmapSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await StartupService.designMVPStrategy({
        userId: req.user!._id,
        goalId: req.body.goalId,
        ventureId: req.body.ventureId,
        idea: req.body.idea,
        targetCustomer: req.body.targetCustomer,
        industry: req.body.industry,
      });

      res.status(200).json({
        message: 'MVP scope & 30-day GTM roadmap designed successfully',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'MVP roadmap design failed', details: err.message });
    }
  }
);

/**
 * @route   GET /api/startup/ventures
 * @desc    List all startup ventures for authenticated user
 * @access  Private
 */
router.get(
  '/ventures',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ventures = await StartupService.listVentures(
        req.user!._id,
        req.query.goalId as string
      );

      res.status(200).json({
        total: ventures.length,
        ventures,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch ventures', details: err.message });
    }
  }
);

/**
 * @route   POST /api/startup/ventures
 * @desc    Create new startup venture workspace
 * @access  Private
 */
router.post(
  '/ventures',
  authenticate,
  validate(createVentureSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const venture = await StartupService.createVenture(req.user!._id, req.body);
      res.status(201).json({
        message: 'Startup venture workspace created successfully',
        venture,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create venture', details: err.message });
    }
  }
);

/**
 * @route   GET /api/startup/ventures/:id
 * @desc    Get specific startup venture workspace by ID
 * @access  Private
 */
router.get(
  '/ventures/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const venture = await StartupService.getVenture(req.user!._id, req.params.id);
      if (!venture) {
        res.status(404).json({ error: 'Venture not found' });
        return;
      }

      res.status(200).json({ venture });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch venture', details: err.message });
    }
  }
);

/**
 * @route   PATCH /api/startup/ventures/:id
 * @desc    Update startup venture workspace details
 * @access  Private
 */
router.patch(
  '/ventures/:id',
  authenticate,
  validate(updateVentureSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await StartupService.updateVenture(
        req.user!._id,
        req.params.id,
        req.body
      );

      if (!updated) {
        res.status(404).json({ error: 'Venture not found' });
        return;
      }

      res.status(200).json({
        message: 'Venture updated successfully',
        venture: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update venture', details: err.message });
    }
  }
);

/**
 * @route   DELETE /api/startup/ventures/:id
 * @desc    Delete startup venture workspace
 * @access  Private
 */
router.delete(
  '/ventures/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deleted = await StartupService.deleteVenture(req.user!._id, req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Venture not found' });
        return;
      }

      res.status(200).json({ message: 'Venture workspace deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete venture', details: err.message });
    }
  }
);

export default router;
