import { Router, Request, Response } from 'express';
import { AgentRegistry } from '../agents/registry';
import { AgentDefinition } from '../models';
import { authenticate } from '../middleware/auth';

const router = Router();

// 1. GET /api/agents - List all registered agents
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const agents = AgentRegistry.listAgents().map((a) => a.getDefinition());
    res.json({ agents });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch agent list', message: error.message });
  }
});

// 2. GET /api/agents/:agentId - Get detailed single agent metadata
router.get('/:agentId', authenticate, async (req: Request, res: Response) => {
  try {
    const agent = AgentRegistry.getAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: `Agent ${req.params.agentId} not found` });
      return;
    }

    res.json({ agent: agent.getDefinition() });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch agent details', message: error.message });
  }
});

export default router;
