import { Router, Response } from 'express';
import { Goal, Profile, Workflow, Task } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { GoalAnalyzerAgent } from '../agents/goalAnalyzer';
import { TaskPlanner } from '../orchestrator/planner';
import { DAGService } from '../orchestrator/dag';

const router = Router();

// 1. POST /api/goals/:id/analyze - Run Goal Understanding Agent
router.post('/goals/:id/analyze', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const goal = await Goal.findOne({ _id: req.params.id, userId });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const profile = await Profile.findOne({ userId });
    const userApiKey = req.user?.apiKeys?.gemini || req.user?.apiKeys?.openai;

    goal.status = 'analyzing';
    await goal.save();

    const analysis = await GoalAnalyzerAgent.analyzeGoal(goal, profile, userApiKey);

    goal.extractedData = analysis.extractedData || (analysis as any);
    goal.readinessScore = analysis.readinessScore ?? 70;
    goal.missingInformation = analysis.missingInformation || [];
    goal.status = (goal.missingInformation.length > 0) ? 'clarification_needed' : 'planned';

    await goal.save();

    res.json({
      message: 'Goal analyzed successfully',
      goal,
      analysis,
    });
  } catch (error: any) {
    console.error('Goal analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze goal', message: error.message });
  }
});

// 2. POST /api/goals/:id/create-plan - Run Task Planner & Generate DAG
router.post('/goals/:id/create-plan', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const goal = await Goal.findOne({ _id: req.params.id, userId });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const profile = await Profile.findOne({ userId });
    const userApiKey = req.user?.apiKeys?.gemini || req.user?.apiKeys?.openai;

    const { workflow, tasks } = await TaskPlanner.createWorkflowPlan(goal, profile, userApiKey);
    const flowGraph = DAGService.serializeToReactFlow(tasks);

    res.status(201).json({
      message: 'Workflow plan created successfully',
      workflow,
      tasks,
      graph: flowGraph,
    });
  } catch (error: any) {
    console.error('Task planning error:', error);
    res.status(500).json({ error: 'Failed to generate workflow plan', message: error.message });
  }
});

// 2.5. GET /api/workflows - List all workflows for authenticated user
router.get('/workflows', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const workflows = await Workflow.find({ userId })
      .populate('taskIds')
      .sort({ createdAt: -1 });

    res.json({ workflows });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list workflows', message: error.message });
  }
});

// 3. GET /api/workflows/:id - Fetch full workflow details
router.get('/workflows/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const workflow = await Workflow.findOne({ _id: req.params.id, userId });

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const tasks = await Task.find({ workflowId: workflow._id });
    const readyTasks = DAGService.getReadyTasks(tasks);
    const progress = DAGService.calculateWorkflowProgress(tasks);

    res.json({
      workflow,
      tasks,
      readyTasksCount: readyTasks.length,
      progress,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve workflow', message: error.message });
  }
});

// 4. GET /api/workflows/:id/graph - React Flow formatted node & edge graph
router.get('/workflows/:id/graph', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const workflow = await Workflow.findOne({ _id: req.params.id, userId });

    if (!workflow) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }

    const tasks = await Task.find({ workflowId: workflow._id });
    const graph = DAGService.serializeToReactFlow(tasks);

    res.json({
      workflowId: workflow._id,
      title: workflow.title,
      progress: workflow.progressPercent,
      graph,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to serialize workflow graph', message: error.message });
  }
});

// 5. POST /api/workflows/:id/execute-next - Execute next ready task
router.post('/workflows/:id/execute-next', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { TaskRunner } = await import('../orchestrator/runner');
    const task = await TaskRunner.executeNext(req.params.id, userId);

    if (!task) {
      res.status(200).json({
        message: 'No ready tasks available to execute in workflow',
        task: null,
      });
      return;
    }

    const workflow = await Workflow.findById(req.params.id);

    res.json({
      message: `Task "${task.title}" executed successfully`,
      task,
      workflowProgress: workflow?.progressPercent || 0,
    });
  } catch (error: any) {
    console.error('Execute next task error:', error);
    res.status(500).json({ error: 'Failed to execute next task', message: error.message });
  }
});

// 6. POST /api/workflows/:id/run - Run entire workflow to completion
router.post('/workflows/:id/run', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { TaskRunner } = await import('../orchestrator/runner');
    const result = await TaskRunner.runAll(req.params.id, userId);
    const workflow = await Workflow.findById(req.params.id);
    const tasks = await Task.find({ workflowId: req.params.id });

    res.json({
      message: 'Workflow execution cycle completed',
      completedTasksCount: result.completedTasks,
      workflowStatus: result.workflowStatus,
      progress: workflow?.progressPercent || 0,
      tasks,
    });
  } catch (error: any) {
    console.error('Workflow run error:', error);
    res.status(500).json({ error: 'Failed to run workflow', message: error.message });
  }
});

// 7. GET /api/workflows/:id/tasks/:taskId/runs - Get task telemetry runs
router.get('/workflows/:id/tasks/:taskId/runs', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { AgentRun } = await import('../models');
    const runs = await AgentRun.find({ taskId: req.params.taskId }).sort({ createdAt: -1 });
    res.json({ runs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve agent runs', message: error.message });
  }
});

export default router;
