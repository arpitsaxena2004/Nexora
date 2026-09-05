import { Types } from 'mongoose';
import { IToolDefinition, ToolCategory } from '../types';

export interface ToolExecutionContext {
  userId: Types.ObjectId;
  workflowId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  agentId?: string;
  userApiKey?: string;
}

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly category: ToolCategory;
  abstract readonly isSensitive: boolean;
  abstract readonly requiredPermissions: string[];
  abstract readonly parametersSchema: Record<string, any>;

  /**
   * Main execution handler for the tool.
   */
  abstract execute(params: Record<string, any>, context: ToolExecutionContext): Promise<Record<string, any>>;

  /**
   * Returns tool metadata definition.
   */
  getDefinition(): IToolDefinition {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      category: this.category,
      isSensitive: this.isSensitive,
      requiredPermissions: this.requiredPermissions,
      parametersSchema: this.parametersSchema,
    };
  }
}
