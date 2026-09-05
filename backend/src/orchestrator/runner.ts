import { Types } from 'mongoose';
import { Task, Workflow, Goal, Profile } from '../models';
import { AgentRegistry } from '../agents/registry';
import { AgentExecutionContext, AgentExecutionResult } from '../agents/base.agent';
import { DAGService } from './dag';
import { MemoryManager } from '../memory/memoryManager';
import { ITask } from '../types';

export class TaskRunner {
  /**
   * Executes a single task by ID
   */
  static async executeTask(taskId: string | Types.ObjectId, userId: Types.ObjectId): Promise<ITask> {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const workflow = await Workflow.findById(task.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${task.workflowId} not found`);
    }

    const goal = await Goal.findById(task.goalId);
    if (!goal) {
      throw new Error(`Goal ${task.goalId} not found`);
    }

    const profile = await Profile.findOne({ userId });

    // Transition task to running
    task.status = 'running';
    task.startedAt = new Date();
    await task.save();

    // 1. Collect upstream prerequisite outputs
    const upstreamOutputs: Record<string, any> = {};
    if (task.dependencies && task.dependencies.length > 0) {
      const depTasks = await Task.find({ _id: { $in: task.dependencies } });
      depTasks.forEach((dep) => {
        if (dep.outputPayload) {
          upstreamOutputs[dep.agentType] = dep.outputPayload;
          upstreamOutputs[dep.title] = dep.outputPayload;
        }
      });
    }

    // 2. Fetch agent from Registry
    const agent = AgentRegistry.getAgent(task.agentType);
    if (!agent) {
      task.status = 'failed';
      task.error = `Agent type '${task.agentType}' not registered`;
      await task.save();
      throw new Error(task.error);
    }

    // 3. Assemble 3-Tier Memory & Knowledge RAG Context
    let ragContext = '';
    let memoryContext = '';
    try {
      const memoryResult = await MemoryManager.assembleAgentMemory({
        userId: task.userId,
        goalId: task.goalId,
        workflowId: task.workflowId,
        query: `${task.title} ${task.description} ${goal.title}`,
      });
      ragContext = memoryResult.knowledge.formattedContext;
      memoryContext = memoryResult.assembledPromptContext;
    } catch (e: any) {
      console.warn('Memory assembly warning:', e.message);
    }

    const context: AgentExecutionContext = {
      taskId: task._id,
      workflowId: task.workflowId,
      userId: task.userId,
      taskTitle: task.title,
      taskDescription: task.description,
      inputPayload: task.inputPayload || {},
      upstreamOutputs,
      goal,
      profile,
      ragContext,
      memoryContext,
    };

    let result: AgentExecutionResult;

    try {
      // 3. Execute agent logic
      result = await agent.execute(context);

      // 4. Validate output quality
      const validation = agent.validate(result.outputPayload);
      if (!validation.isValid && task.retryCount < task.maxRetries) {
        task.retryCount += 1;
        task.status = 'ready'; // Mark for retry
        await task.save();
        await agent.logTelemetry(context, 'retrying', result, validation.notes);
        throw new Error(`Task output rejected during validation: ${validation.notes}`);
      }

      // 5. Update Task document
      task.status = 'completed';
      task.outputPayload = result.outputPayload;
      task.verificationScore = result.verificationScore || validation.score;
      task.verificationNotes = result.verificationNotes || validation.notes;
      task.executionTimeMs = result.durationMs;
      task.completedAt = new Date();
      await task.save();

      // 6. Log success telemetry
      await agent.logTelemetry(context, 'succeeded', result);

      // 7. Evaluate and unlock downstream tasks
      const allWorkflowTasks = await Task.find({ workflowId: workflow._id });
      const readyTasks = DAGService.getReadyTasks(allWorkflowTasks);

      for (const rTask of readyTasks) {
        if (rTask.status === 'pending') {
          await Task.findByIdAndUpdate(rTask._id, { status: 'ready' });
        }
      }

      // 8. Update Workflow progress
      const refreshedTasks = await Task.find({ workflowId: workflow._id });
      workflow.progressPercent = DAGService.calculateWorkflowProgress(refreshedTasks);

      const allCompleted = refreshedTasks.every((t) => t.status === 'completed');
      if (allCompleted) {
        workflow.status = 'completed';
        goal.status = 'completed';
        await goal.save();
      }

      await workflow.save();

      return task;
    } catch (err: any) {
      task.status = 'failed';
      task.error = err.message;
      await task.save();
      await agent.logTelemetry(context, 'failed', undefined, err.message);
      throw err;
    }
  }

  /**
   * Finds the next unlocked ready task in the workflow and executes it
   */
  static async executeNext(workflowId: string | Types.ObjectId, userId: Types.ObjectId): Promise<ITask | null> {
    const readyTask = await Task.findOne({
      workflowId,
      userId,
      status: 'ready',
    });

    if (!readyTask) return null;

    return this.executeTask(readyTask._id, userId);
  }

  /**
   * Continuously executes ready tasks until the DAG is fully completed or blocked
   */
  static async runAll(workflowId: string | Types.ObjectId, userId: Types.ObjectId): Promise<{ completedTasks: number; workflowStatus: string }> {
    let completedCount = 0;
    let keepRunning = true;

    while (keepRunning) {
      const nextTask = await Task.findOne({
        workflowId,
        userId,
        status: 'ready',
      });

      if (!nextTask) {
        keepRunning = false;
        break;
      }

      await this.executeTask(nextTask._id, userId);
      completedCount++;
    }

    const workflow = await Workflow.findById(workflowId);
    return {
      completedTasks: completedCount,
      workflowStatus: workflow?.status || 'unknown',
    };
  }
}
