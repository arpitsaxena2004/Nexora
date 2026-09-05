import { BaseTool } from './base.tool';
import { SearchTool } from './implementations/search.tool';
import { EmailTool } from './implementations/email.tool';
import { GitHubTool } from './implementations/github.tool';
import { CalendarTool } from './implementations/calendar.tool';
import { IToolDefinition } from '../types';

export class ToolRegistry {
  private static tools = new Map<string, BaseTool>();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const defaultTools: BaseTool[] = [
      new SearchTool(),
      new EmailTool(),
      new GitHubTool(),
      new CalendarTool(),
    ];

    defaultTools.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });

    this.initialized = true;
    console.log(`🛠️ Tool Registry initialized with ${this.tools.size} automation tools.`);
  }

  static getTool(name: string): BaseTool | undefined {
    if (!this.initialized) this.initialize();
    return this.tools.get(name);
  }

  static registerTool(tool: BaseTool): void {
    if (!this.initialized) this.initialize();
    this.tools.set(tool.name, tool);
  }

  static listTools(): IToolDefinition[] {
    if (!this.initialized) this.initialize();
    return Array.from(this.tools.values()).map((t) => t.getDefinition());
  }
}
