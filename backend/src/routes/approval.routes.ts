import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Approval } from '../models';
import { PermissionManager } from '../tools/permissionManager';

const router = Router();

const respondApprovalSchema = z.object({
  reviewerNotes: z.string().optional(),
});

/**
 * @route   GET /api/approvals
 * @desc    List approval requests for authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const query: any = { userId: req.user!._id };
      if (req.query.status) {
        query.status = req.query.status;
      }
      if (req.query.workflowId) {
        query.workflowId = req.query.workflowId;
      }

      const approvals = await Approval.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        total: approvals.length,
        pendingCount: approvals.filter((a) => a.status === 'pending').length,
        approvals,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch approvals', details: err.message });
    }
  }
);

/**
 * @route   GET /api/approvals/:id
 * @desc    Get specific approval request details
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const approval = await Approval.findOne({
        _id: req.params.id,
        userId: req.user!._id,
      });

      if (!approval) {
        res.status(404).json({ error: 'Approval request not found' });
        return;
      }

      res.status(200).json({ approval });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch approval details', details: err.message });
    }
  }
);

/**
 * @route   POST /api/approvals/:id/approve
 * @desc    Approve and immediately trigger execution of the queued sensitive action
 * @access  Private
 */
router.post(
  '/:id/approve',
  authenticate,
  validate(respondApprovalSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await PermissionManager.approveAction({
        approvalId: req.params.id,
        userId: req.user!._id,
        reviewerNotes: req.body.reviewerNotes,
      });

      res.status(200).json({
        message: 'Action successfully approved and executed',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Approval execution failed', details: err.message });
    }
  }
);

/**
 * @route   POST /api/approvals/:id/reject
 * @desc    Reject queued sensitive action
 * @access  Private
 */
router.post(
  '/:id/reject',
  authenticate,
  validate(respondApprovalSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await PermissionManager.rejectAction({
        approvalId: req.params.id,
        userId: req.user!._id,
        reviewerNotes: req.body.reviewerNotes,
      });

      res.status(200).json({
        message: 'Action rejected',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Rejection failed', details: err.message });
    }
  }
);

export default router;
