import { LLMService } from '../services/llm.service';
import { IGoal, IProfile, IExtractedGoalData, IMissingGoalInfo } from '../types';

export interface GoalAnalysisResult {
  extractedData: IExtractedGoalData;
  readinessScore: number;
  missingInformation: IMissingGoalInfo[];
  recommendedTrack: 'career' | 'startup' | 'business' | 'custom';
}

export class GoalAnalyzerAgent {
  static readonly AGENT_ID = 'goal_analyzer';
  static readonly ROLE = 'Goal Understanding & Scope Decomposition Specialist';

  static async analyzeGoal(
    goal: IGoal,
    profile?: IProfile | null,
    userApiKey?: string
  ): Promise<GoalAnalysisResult> {
    const systemPrompt = `You are the Goal Understanding Agent for Nexora AI.
Your role:
1. Parse the user's natural language goal and their profile.
2. Extract the structured goal parameters: goalType (career/startup/business/custom), industry, targetRole, targetCustomer, stage, objective, timeHorizon, budget, keyConstraints, and successCriteria.
3. Evaluate readinessScore (0 to 100) based on how well-defined and feasible the goal is given the profile.
4. Identify missing pieces of critical information and formulate 2-4 targeted, concise questions.

Respond strictly in JSON format with keys:
{
  "extractedData": {
    "goalType": "career" | "startup" | "business" | "custom",
    "industry": "string",
    "targetRole": "string",
    "targetCustomer": "string",
    "stage": "string",
    "objective": "string",
    "timeHorizon": "string",
    "budget": number,
    "keyConstraints": ["string"],
    "successCriteria": ["string"]
  },
  "readinessScore": number,
  "missingInformation": [
    {
      "questionId": "string",
      "question": "string",
      "field": "string",
      "importance": "critical" | "high" | "medium" | "low"
    }
  ],
  "recommendedTrack": "career" | "startup" | "business" | "custom"
}`;

    const userPrompt = `GOAL UNDERSTANDING REQUEST:
Raw Goal Prompt: "${goal.rawPrompt}"
Goal Title: "${goal.title}"
Selected Goal Type: "${goal.goalType}"

USER PROFILE CONTEXT:
Active Track: ${profile?.activeTrack || 'none'}
Profile Completeness: ${profile?.completenessScore || 0}%
Career Data: ${JSON.stringify(profile?.career || {})}
Startup Data: ${JSON.stringify(profile?.startup || {})}
Custom Data: ${JSON.stringify(profile?.customData || {})}

Analyze this goal now and output the JSON result.`;

    const result = await LLMService.generateJSON<GoalAnalysisResult>({
      systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
      apiKey: userApiKey,
    });

    return result;
  }
}
