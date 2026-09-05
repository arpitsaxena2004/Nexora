import { Types, HydratedDocument } from 'mongoose';
import { LLMService } from '../services/llm.service';
import { IGoal, IProfile, IWorkflow, ITask } from '../types';
import { Workflow, Task, Goal } from '../models';

export interface PlannedTaskDraft {
  tempId: string; // e.g. "task_1", "task_2"
  title: string;
  description: string;
  agentType: string;
  dependsOn: string[]; // e.g. ["task_1"]
  inputPayload: Record<string, any>;
}

export interface PlanGenerationResult {
  workflowTitle: string;
  description: string;
  tasks: PlannedTaskDraft[];
}

export class TaskPlanner {
  static async createWorkflowPlan(
    goal: HydratedDocument<IGoal>,
    profile?: IProfile | null,
    userApiKey?: string
  ): Promise<{ workflow: IWorkflow; tasks: ITask[] }> {
    const goalType = goal.extractedData?.goalType || goal.goalType || 'career';

    const systemPrompt = `You are the AI Orchestrator & Task Planner for Nexora AI.
Your role: Convert a structured goal definition and user profile into an executable, dependency-aware Directed Acyclic Graph (DAG) of discrete agent tasks.

Available Agents:
- resume_agent (Analyze ATS score, optimize resume bullet points, extract key projects)
- job_matching_agent (Evaluate compatibility with specific job postings, missing qualification audit)
- company_research_agent (Deep-dive into target employer tech stack, culture values, interview pipeline)
- interview_agent (Generate curated DSA/System Design questions and evaluate candidate responses)
- customer_persona_agent (Formulate Ideal Customer Profile ICP, buyer personas, pain points, willingness to pay)
- market_research_agent (Job market trends, hiring requirements, startup industry trends)
- competitor_agent (Competitor matrix, market gaps, pricing comparisons)
- business_model_agent (Monetization architectures, subscription pricing tiers, unit economics)
- mvp_strategy_agent (MVP scope matrix, architecture, 30-day Go-To-Market execution milestones)
- strategy_agent (Synthesize research into 30/60/90 day execution roadmap)
- content_agent (Generate cover letters, outreach messages, launch posts)
- verification_agent (Validate results, quality control check)

Rules:
1. Define a clear dependency graph (e.g. market_research -> skill_gap -> strategy).
2. Each task must have a unique tempId (task_1, task_2, etc.).
3. Each task must declare which prior tasks it depends on in 'dependsOn' array.
4. Provide structured inputPayload for each task.

Respond STRICTLY in JSON format with keys:
{
  "workflowTitle": "string",
  "description": "string",
  "tasks": [
    {
      "tempId": "task_1",
      "title": "string",
      "description": "string",
      "agentType": "resume_agent" | "job_matching_agent" | "company_research_agent" | "interview_agent" | "customer_persona_agent" | "market_research_agent" | "competitor_agent" | "business_model_agent" | "mvp_strategy_agent" | "strategy_agent" | "content_agent" | "verification_agent",
      "dependsOn": [],
      "inputPayload": {}
    }
  ]
}`;

    const userPrompt = `GOAL SPECIFICATION:
Title: "${goal.title}"
Prompt: "${goal.rawPrompt}"
Goal Type: "${goalType}"
Extracted Objective: "${goal.extractedData?.objective || goal.title}"
Target Role / Customer: "${goal.extractedData?.targetRole || goal.extractedData?.targetCustomer || 'General'}"
Key Constraints: ${JSON.stringify(goal.extractedData?.keyConstraints || [])}

USER PROFILE CONTEXT:
Active Track: ${profile?.activeTrack || 'none'}
Profile Data: ${JSON.stringify(profile?.career || profile?.startup || {})}

Generate the multi-agent DAG task plan now in JSON format.`;

    let planData: PlanGenerationResult;

    try {
      planData = await LLMService.generateJSON<PlanGenerationResult>({
        systemPrompt,
        prompt: userPrompt,
        temperature: 0.2,
        apiKey: userApiKey,
      });
    } catch (err) {
      console.warn('Fallback default plan due to LLM parsing:', err);
      planData = this.getDefaultPlanForGoal(goal);
    }

    // If plan has no tasks or failed, supply default structured plan
    if (!planData || !planData.tasks || planData.tasks.length === 0) {
      planData = this.getDefaultPlanForGoal(goal);
    }

    // 1. Create Workflow in MongoDB
    const workflow = new Workflow({
      userId: goal.userId,
      goalId: goal._id,
      title: planData.workflowTitle || `Plan: ${goal.title}`,
      description: planData.description || 'Autonomous multi-agent execution workflow',
      status: 'pending',
      progressPercent: 0,
      taskIds: [],
    });

    await workflow.save();

    // 2. Map tempIds to MongoDB ObjectIds
    const tempIdToObjectId = new Map<string, Types.ObjectId>();
    planData.tasks.forEach((t) => {
      tempIdToObjectId.set(t.tempId, new Types.ObjectId());
    });

    // 3. Create all Task documents
    const taskDocs: any[] = [];

    for (const t of planData.tasks) {
      const taskId = tempIdToObjectId.get(t.tempId)!;
      const dependencies = (t.dependsOn || [])
        .map((depId) => tempIdToObjectId.get(depId))
        .filter((id): id is Types.ObjectId => Boolean(id));

      const isRootTask = dependencies.length === 0;

      const task = new Task({
        _id: taskId,
        workflowId: workflow._id,
        goalId: goal._id,
        userId: goal.userId,
        title: t.title,
        description: t.description,
        agentType: t.agentType,
        dependencies,
        status: isRootTask ? 'ready' : 'pending',
        inputPayload: t.inputPayload || {},
        retryCount: 0,
        maxRetries: 3,
      });

      await task.save();
      taskDocs.push(task);
    }

    // 4. Update Workflow with Task IDs
    workflow.taskIds = taskDocs.map((t) => t._id);
    workflow.status = 'running';
    await workflow.save();

    // 5. Update Goal with activeWorkflowId
    goal.activeWorkflowId = workflow._id;
    goal.status = 'planned';
    await goal.save();

    return { workflow, tasks: taskDocs };
  }

  private static getDefaultPlanForGoal(goal: IGoal): PlanGenerationResult {
    const isStartup = goal.goalType === 'startup';

    if (isStartup) {
      return {
        workflowTitle: `Startup Venture Strategy: ${goal.title}`,
        description: 'Comprehensive ICP validation, competitor gap analysis, monetization design, and 30-day MVP GTM roadmap',
        tasks: [
          {
            tempId: 'task_1',
            title: 'Ideal Customer Profile & Persona Formulation',
            description: 'Define primary buyer personas, core pain points, and willingness to pay.',
            agentType: 'customer_persona_agent',
            dependsOn: [],
            inputPayload: { focus: 'icp_personas' },
          },
          {
            tempId: 'task_2',
            title: 'Target Market Research & Sizing',
            description: 'Analyze TAM, SAM, SOM and industry growth drivers.',
            agentType: 'market_research_agent',
            dependsOn: ['task_1'],
            inputPayload: { depth: 'comprehensive' },
          },
          {
            tempId: 'task_3',
            title: 'Competitor Intelligence Matrix & Moat',
            description: 'Map top direct/indirect competitors, pricing tiers, and feature gaps.',
            agentType: 'competitor_agent',
            dependsOn: ['task_2'],
            inputPayload: { includeGaps: true },
          },
          {
            tempId: 'task_4',
            title: 'Monetization Architecture & Pricing Tiers',
            description: 'Formulate SaaS subscription packages, unit economics (CAC/LTV), and expansion levers.',
            agentType: 'business_model_agent',
            dependsOn: ['task_3'],
            inputPayload: { focus: 'pricing_architecture' },
          },
          {
            tempId: 'task_5',
            title: 'MVP Scope Definition & 30-Day Launch Roadmap',
            description: 'Synthesize lean MVP feature set, architecture, and weekly GTM milestones.',
            agentType: 'mvp_strategy_agent',
            dependsOn: ['task_4'],
            inputPayload: { outputRoadmap: true },
          },
        ],
      };
    }

    // Career default
    return {
      workflowTitle: `Career Acceleration Plan: ${goal.title}`,
      description: 'Resume optimization, skill gap analysis, and tailored interview preparation strategy',
      tasks: [
        {
          tempId: 'task_1',
          title: 'Resume & Profile Deep Scan',
          description: 'Evaluate ATS keyword compatibility, highlight measurable impact, and score strength.',
          agentType: 'resume_agent',
          dependsOn: [],
          inputPayload: { targetRole: goal.extractedData?.targetRole || 'Software Engineer' },
        },
        {
          tempId: 'task_2',
          title: 'Target Company & Market Research',
          description: 'Analyze hiring bars, interview topics, and active requirements for target roles.',
          agentType: 'market_research_agent',
          dependsOn: ['task_1'],
          inputPayload: { targetRole: goal.extractedData?.targetRole },
        },
        {
          tempId: 'task_3',
          title: 'Skill Gap & Learning Syllabus',
          description: 'Identify technical deficits (DSA, System Design, Tech Stack) and generate prep schedule.',
          agentType: 'skill_gap_agent',
          dependsOn: ['task_2'],
          inputPayload: { format: 'weekly_syllabus' },
        },
        {
          tempId: 'task_4',
          title: 'Application Outreach & Interview Strategy',
          description: 'Craft personalized recruiter outreach templates and mock interview question bank.',
          agentType: 'content_agent',
          dependsOn: ['task_3'],
          inputPayload: { includeTemplates: true },
        },
      ],
    };
  }
}
