import { Router, Response } from 'express';
import { z } from 'zod';
import { Goal, Profile, Workflow, Task } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation Schemas
const createGoalSchema = z.object({
  title: z.string().min(3, 'Goal title must be at least 3 characters'),
  rawPrompt: z.string().min(5, 'Goal description must be at least 5 characters'),
  goalType: z.enum([
    'career',
    'startup',
    'business',
    'product_launch',
    'personal_brand',
    'freelance',
    'custom',
  ]).default('career'),
  targetDate: z.string().datetime().optional().or(z.string().optional()),
});

const submitAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().min(1, 'Answer cannot be empty'),
    })
  ),
});

// 1. POST /api/goals - Ingest new goal
router.post('/', authenticate, validate(createGoalSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { title, rawPrompt, goalType, targetDate } = req.body;

    const userProfile = await Profile.findOne({ userId });

    const goal = await Goal.create({
      userId,
      profileId: userProfile?._id,
      title,
      rawPrompt,
      goalType,
      status: 'draft',
      targetDate: targetDate ? new Date(targetDate) : undefined,
      missingInformation: [],
    });

    res.status(201).json({
      message: 'Goal registered successfully',
      goal,
    });
  } catch (error: any) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal', message: error.message });
  }
});

// 2. GET /api/goals - List user goals
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const goals = await Goal.find({ userId })
      .populate('activeWorkflowId', 'status progressPercent currentMilestone')
      .sort({ createdAt: -1 });

    res.json({ goals });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch goals', message: error.message });
  }
});

// 3. GET /api/goals/:id - Get single goal details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const goal = await Goal.findOne({ _id: req.params.id, userId }).populate({
      path: 'activeWorkflowId',
      populate: { path: 'taskIds' },
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ goal });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve goal', message: error.message });
  }
});

// 4. PUT & POST /api/goals/:id/answers & /api/goals/:id/answer - Submit answers to missing information
const handleAnswerSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { answers } = req.body;

    const goal = await Goal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    if (Array.isArray(answers)) {
      const answerMap = new Map<string, string>(
        answers.map((a: { questionId: string; answer: string }) => [a.questionId, a.answer])
      );

      // Update matching questions
      goal.missingInformation = goal.missingInformation.map((item) => {
        if (answerMap.has(item.questionId)) {
          return {
            ...item,
            answer: answerMap.get(item.questionId),
            answeredAt: new Date(),
          };
        }
        return item;
      });
    }

    // If all questions are answered, mark as ready for replanning/orchestration
    const allAnswered = goal.missingInformation.every((q) => Boolean(q.answer));
    if (allAnswered && goal.status === 'clarification_needed') {
      goal.status = 'analyzing';
    }

    await goal.save();

    res.json({
      message: 'Answers recorded successfully',
      goal,
    });
  } catch (error: any) {
    console.error('Answer submission error:', error);
    res.status(500).json({ error: 'Failed to update goal answers', message: error.message });
  }
};

router.put('/:id/answers', authenticate, validate(submitAnswersSchema), handleAnswerSubmission);
router.post('/:id/answers', authenticate, validate(submitAnswersSchema), handleAnswerSubmission);
router.put('/:id/answer', authenticate, validate(submitAnswersSchema), handleAnswerSubmission);
router.post('/:id/answer', authenticate, validate(submitAnswersSchema), handleAnswerSubmission);

// 5. DELETE /api/goals/:id - Delete goal & cascade clean workflows
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    // Clean associated workflows and tasks
    const workflows = await Workflow.find({ goalId: goal._id });
    const workflowIds = workflows.map((w) => w._id);

    await Task.deleteMany({ workflowId: { $in: workflowIds } });
    await Workflow.deleteMany({ goalId: goal._id });

    res.json({ message: 'Goal and associated workflow data deleted successfully' });
  } catch (error: any) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal', message: error.message });
  }
});

export default router;
