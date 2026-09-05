import { Types } from 'mongoose';
import { ToolRegistry } from './toolRegistry';
import { ToolExecutionContext } from './base.tool';
import { Approval, Task, User } from '../models';
import { AgentRegistry } from '../agents/registry';
import { IToolCallResult, IPermissionCheckResult, SensitiveActionType } from '../types';

export class PermissionManager {
  /**
   * Checks whether a requested tool can be executed by the given agent or user context
   */
  static async checkPermission(params: {
    toolName: string;
    agentId?: string;
    userId: Types.ObjectId;
  }): Promise<IPermissionCheckResult> {
    const { toolName, agentId, userId } = params;

    const tool = ToolRegistry.getTool(toolName);
    if (!tool) {
      return { allowed: false, isSensitive: false, reason: `Tool "${toolName}" is not registered.` };
    }

    // Check Agent allowed tools if invoked from agent context
    if (agentId) {
      const agent = AgentRegistry.getAgent(agentId);
      if (agent) {
        const allowed = agent.allowedTools.includes(toolName) || agent.allowedTools.includes('*');
        if (!allowed) {
          return {
            allowed: false,
            isSensitive: tool.isSensitive,
            reason: `Agent "${agentId}" does not have permission to execute tool "${toolName}". Allowed: [${agent.allowedTools.join(', ')}]`,
          };
        }
      }
    }

    // Check User Auto-Approve preferences
    const user = await User.findById(userId);
    const isAutoApproved = user?.preferences?.autoApproveSafeTools && !tool.isSensitive;

    return {
      allowed: true,
      isSensitive: tool.isSensitive && !isAutoApproved,
    };
  }

  /**
   * Intercepts tool calls, queueing human approval for sensitive actions or executing safe actions directly
   */
  static async executeTool(params: {
    toolName: string;
    input: Record<string, any>;
    context: ToolExecutionContext;
    skipApprovalCheck?: boolean;
    approvalTitle?: string;
    approvalSummary?: string;
  }): Promise<IToolCallResult> {
    const { toolName, input, context, skipApprovalCheck, approvalTitle, approvalSummary } = params;
    const startTime = Date.now();

    const tool = ToolRegistry.getTool(toolName);
    if (!tool) {
      return {
        toolName,
        input,
        success: false,
        durationMs: Date.now() - startTime,
        error: `Tool "${toolName}" not found in registry.`,
      };
    }

    // 1. Check Permissions
    const perm = await this.checkPermission({
      toolName,
      agentId: context.agentId,
      userId: context.userId,
    });

    if (!perm.allowed) {
      return {
        toolName,
        input,
        success: false,
        durationMs: Date.now() - startTime,
        error: perm.reason || 'Permission denied',
      };
    }

    // 2. Sensitive Action Interception (Queue Approval & Pause Task)
    if (tool.isSensitive && !skipApprovalCheck) {
      const actionType: SensitiveActionType =
        toolName === 'email_dispatch'
          ? 'email_send'
          : toolName === 'calendar_schedule'
          ? 'api_call'
          : 'other';

      const title = approvalTitle || `Authorize Tool Execution: ${tool.displayName}`;
      const summary =
        approvalSummary ||
        `Action "${tool.displayName}" requested by ${context.agentId || 'User'}. Target: ${JSON.stringify(input)}`;

      const approval = await Approval.create({
        userId: context.userId,
        workflowId: context.workflowId,
        taskId: context.taskId,
        agentId: context.agentId || 'system_tool_runner',
        actionType,
        title,
        summary,
        targetPayload: {
          toolName,
          input,
        },
        status: 'pending',
      });

      // If associated with a DAG task, put task into approval_required status
      if (context.taskId) {
        await Task.findByIdAndUpdate(context.taskId, {
          status: 'approval_required',
          outputPayload: {
            approvalId: approval._id,
            pendingTool: toolName,
            message: 'Paused waiting for human-in-the-loop approval',
          },
        });
      }

      return {
        toolName,
        input,
        success: true,
        durationMs: Date.now() - startTime,
        requiresApproval: true,
        approvalId: approval._id,
      };
    }

    // 3. Direct Tool Execution (Safe or Pre-Approved)
    try {
      const output = await tool.execute(input, context);
      const durationMs = Date.now() - startTime;

      return {
        toolName,
        input,
        output,
        success: true,
        durationMs,
        requiresApproval: false,
      };
    } catch (err: any) {
      return {
        toolName,
        input,
        success: false,
        durationMs: Date.now() - startTime,
        error: err.message || 'Tool execution failed',
      };
    }
  }

  /**
   * Approves a queued sensitive action, runs execution, and updates the task/workflow
   */
  static async approveAction(params: {
    approvalId: string;
    userId: Types.ObjectId;
    reviewerNotes?: string;
  }): Promise<any> {
    const { approvalId, userId, reviewerNotes } = params;

    const approval = await Approval.findOne({ _id: approvalId, userId });
    if (!approval) {
      throw new Error('Approval request not found.');
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval is already in "${approval.status}" state.`);
    }

    const { toolName, input } = approval.targetPayload;
    const tool = ToolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" is not registered.`);
    }

    // Execute tool directly with approval bypass
    const executionOutput = await tool.execute(input, {
      userId: approval.userId,
      workflowId: approval.workflowId,
      taskId: approval.taskId,
      agentId: approval.agentId,
    });

    // Update Approval document
    approval.status = 'approved';
    approval.reviewerNotes = reviewerNotes || 'Approved by user';
    approval.respondedAt = new Date();
    approval.executionResult = executionOutput;
    await approval.save();

    // If linked to a task, update task to completed with output
    if (approval.taskId) {
      await Task.findByIdAndUpdate(approval.taskId, {
        status: 'completed',
        outputPayload: {
          approved: true,
          executionResult: executionOutput,
        },
        completedAt: new Date(),
      });
    }

    return {
      approval,
      executionResult: executionOutput,
    };
  }

  /**
   * Rejects a queued action
   */
  static async rejectAction(params: {
    approvalId: string;
    userId: Types.ObjectId;
    reviewerNotes?: string;
  }): Promise<any> {
    const { approvalId, userId, reviewerNotes } = params;

    const approval = await Approval.findOne({ _id: approvalId, userId });
    if (!approval) {
      throw new Error('Approval request not found.');
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval is already in "${approval.status}" state.`);
    }

    approval.status = 'rejected';
    approval.reviewerNotes = reviewerNotes || 'Rejected by user';
    approval.respondedAt = new Date();
    await approval.save();

    // If linked to a task, set task to skipped or failed
    if (approval.taskId) {
      await Task.findByIdAndUpdate(approval.taskId, {
        status: 'skipped',
        outputPayload: {
          approved: false,
          rejectionReason: approval.reviewerNotes,
        },
      });
    }

    return {
      approval,
      message: 'Action rejected successfully',
    };
  }
}
