import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Notification } from '../models';

const router = Router();

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['workflow_completed', 'approval_required', 'agent_failed', 'milestone_reached', 'recommendation_ready', 'info']).default('info'),
  linkUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * @route   GET /api/notifications
 * @desc    Fetch notifications and unread count for authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!._id;
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });

      res.status(200).json({
        total: notifications.length,
        unreadCount,
        notifications,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
    }
  }
);

/**
 * @route   POST /api/notifications
 * @desc    Create a notification for user
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createNotificationSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const notification = await Notification.create({
        ...req.body,
        userId: req.user!._id,
        isRead: false,
      });

      res.status(201).json({
        message: 'Notification created successfully',
        notification,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create notification', details: err.message });
    }
  }
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user!._id },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.status(200).json({
        message: 'Notification marked as read',
        notification: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update notification', details: err.message });
    }
  }
);

/**
 * @route   POST /api/notifications/mark-all-read
 * @desc    Mark all user notifications as read
 * @access  Private
 */
router.post(
  '/mark-all-read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      await Notification.updateMany({ userId: req.user!._id, isRead: false }, { $set: { isRead: true } });
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update notifications', details: err.message });
    }
  }
);

export default router;
