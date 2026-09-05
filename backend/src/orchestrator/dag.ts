import { ITask } from '../types';

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    id: string;
    title: string;
    description: string;
    agentType: string;
    status: string;
    retryCount: number;
    verificationScore?: number;
    executionTimeMs?: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export class DAGService {
  /**
   * Evaluates task prerequisites and returns tasks that are now ready to run.
   */
  static getReadyTasks(tasks: ITask[]): ITask[] {
    const completedTaskIds = new Set(
      tasks
        .filter((t) => t.status === 'completed')
        .map((t) => t._id.toString())
    );

    return tasks.filter((task) => {
      if (task.status === 'ready') return true;
      if (task.status !== 'pending') return false;

      // If task has no dependencies, it is ready immediately
      if (!task.dependencies || task.dependencies.length === 0) return true;

      // Check if every dependency is completed
      return task.dependencies.every((depId) => completedTaskIds.has(depId.toString()));
    });
  }

  /**
   * Calculates overall workflow progress percentage (0 to 100).
   */
  static calculateWorkflowProgress(tasks: ITask[]): number {
    if (!tasks || tasks.length === 0) return 0;
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completedCount / tasks.length) * 100);
  }

  /**
   * Serializes tasks and dependencies into React Flow nodes and edges layout.
   */
  static serializeToReactFlow(tasks: ITask[]): FlowGraph {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    // Calculate hierarchical column/row layout
    const levels = new Map<string, number>();
    const taskMap = new Map<string, ITask>();
    tasks.forEach((t) => taskMap.set(t._id.toString(), t));

    function getLevel(taskId: string, visited = new Set<string>()): number {
      if (visited.has(taskId)) return 0; // Avoid cycles
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task || !task.dependencies || task.dependencies.length === 0) return 0;

      let maxDepLevel = 0;
      for (const depId of task.dependencies) {
        maxDepLevel = Math.max(maxDepLevel, getLevel(depId.toString(), new Set(visited)) + 1);
      }
      return maxDepLevel;
    }

    // Determine level for each task
    tasks.forEach((task) => {
      levels.set(task._id.toString(), getLevel(task._id.toString()));
    });

    // Group tasks by level to compute Y-offsets
    const levelGroups = new Map<number, ITask[]>();
    tasks.forEach((task) => {
      const lvl = levels.get(task._id.toString()) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(task);
    });

    const X_GAP = 280;
    const Y_GAP = 140;

    levelGroups.forEach((groupTasks, level) => {
      const totalInLevel = groupTasks.length;
      groupTasks.forEach((task, index) => {
        const xPos = 100 + level * X_GAP;
        const yPos = 100 + (index - (totalInLevel - 1) / 2) * Y_GAP + 100;

        nodes.push({
          id: task._id.toString(),
          type: 'agentNode',
          position: { x: xPos, y: yPos },
          data: {
            id: task._id.toString(),
            title: task.title,
            description: task.description,
            agentType: task.agentType,
            status: task.status,
            retryCount: task.retryCount,
            verificationScore: task.verificationScore,
            executionTimeMs: task.executionTimeMs,
          },
        });

        // Add edges from dependencies
        if (task.dependencies) {
          task.dependencies.forEach((depId) => {
            edges.push({
              id: `e-${depId.toString()}-${task._id.toString()}`,
              source: depId.toString(),
              target: task._id.toString(),
              animated: task.status === 'running',
              style: {
                stroke: task.status === 'completed' ? '#10B981' : task.status === 'running' ? '#6366F1' : '#64748B',
                strokeWidth: 2,
              },
            });
          });
        }
      });
    });

    return { nodes, edges };
  }
}
