import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ToolRegistry } from '../tools/toolRegistry';
import { PermissionManager } from '../tools/permissionManager';

const router = Router();

const executeToolSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  input: z.record(z.any()),
  agentId: z.string().optional(),
  workflowId: z.string().optional(),
  taskId: z.string().optional(),
  approvalTitle: z.string().optional(),
  approvalSummary: z.string().optional(),
});

/**
 * @route   GET /api/tools
 * @desc    List all registered automation tools, parameters, and permission levels
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  (_req: AuthenticatedRequest, res: Response): void => {
    try {
      const tools = ToolRegistry.listTools();
      res.status(200).json({
        total: tools.length,
        tools,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list tools', details: err.message });
    }
  }
);

/**
 * @route   POST /api/tools/execute
 * @desc    Execute a tool or queue for human approval if marked sensitive
 * @access  Private
 */
router.post(
  '/execute',
  authenticate,
  validate(executeToolSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { toolName, input, agentId, workflowId, taskId, approvalTitle, approvalSummary } = req.body;

      const result = await PermissionManager.executeTool({
        toolName,
        input,
        context: {
          userId: req.user!._id,
          agentId,
          workflowId: workflowId as any,
          taskId: taskId as any,
        },
        approvalTitle,
        approvalSummary,
      });

      if (!result.success) {
        res.status(403).json({
          error: result.error || 'Tool execution rejected by permission manager',
          result,
        });
        return;
      }

      if (result.requiresApproval) {
        res.status(202).json({
          message: 'Sensitive action requires human approval. Queued in approval registry.',
          approvalId: result.approvalId,
          result,
        });
        return;
      }

      res.status(200).json({
        message: 'Tool executed successfully',
        result,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Tool execution failed', details: err.message });
    }
  }
);

export default router;
