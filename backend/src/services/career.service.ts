import { Types } from 'mongoose';
import { Application, InterviewSession, Goal, Profile } from '../models';
import { AgentRegistry } from '../agents/registry';
import { RetrievalService } from '../rag/retrieval';
import { IApplication, IInterviewSession, ApplicationStage } from '../types';

export class CareerService {
  /**
   * Run deep job description matching against candidate profile & RAG documents
   */
  static async evaluateJobMatch(params: {
    userId: Types.ObjectId;
    goalId?: string;
    company: string;
    position: string;
    jobDescription: string;
    saveAsApplication?: boolean;
  }): Promise<any> {
    const { userId, goalId, company, position, jobDescription, saveAsApplication } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'career' });

    // Retrieve relevant resume and career context from RAG Hub
    let knowledgeContext = '';
    try {
      const ragResults = await RetrievalService.retrieve(
        `${position} ${company} skills experience projects qualifications`,
        {
          userId,
          category: 'resume',
          topK: 4,
        }
      );
      knowledgeContext = ragResults.formattedContext || '';
    } catch (e) {
      // Non-blocking if RAG search is empty
    }

    const agent = AgentRegistry.getAgent('job_matching_agent');
    if (!agent) {
      throw new Error('JobMatchingAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: `Career goal for ${position}`, extractedData: { targetRole: position } } as any,
      profile: profile || undefined,
      inputPayload: {
        company,
        position,
        jobDescription,
      },
      knowledgeContext,
    });

    let savedApp: any = null;
    if (saveAsApplication) {
      savedApp = await Application.create({
        userId,
        goalId: goal?._id,
        company,
        position,
        jobDescription,
        status: 'wishlist',
        matchScore: result.outputPayload.matchScore,
        matchedSkills: result.outputPayload.matchedSkills,
        missingSkills: result.outputPayload.missingSkills,
      });
    }

    return {
      evaluation: result.outputPayload,
      verificationScore: result.verificationScore,
      application: savedApp,
    };
  }

  /**
   * Generate an employer intelligence dossier
   */
  static async researchCompany(params: {
    userId: Types.ObjectId;
    goalId?: string;
    company: string;
    targetRole?: string;
  }): Promise<any> {
    const { userId, goalId, company, targetRole } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : await Goal.findOne({ userId, goalType: 'career' });

    const agent = AgentRegistry.getAgent('company_research_agent');
    if (!agent) {
      throw new Error('CompanyResearchAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: `Company research for ${company}`, extractedData: { targetRole: targetRole || 'Software Engineer' } } as any,
      profile: profile || undefined,
      inputPayload: {
        company,
        targetRole: targetRole || goal?.extractedData?.targetRole || profile?.career?.targetRole || 'Software Engineer',
      },
    });

    return {
      dossier: result.outputPayload,
      verificationScore: result.verificationScore,
    };
  }

  /**
   * Create mock interview session with generated questions
   */
  static async startInterviewSession(params: {
    userId: Types.ObjectId;
    goalId?: string;
    targetRole: string;
    targetCompany?: string;
    experienceLevel?: string;
    focusAreas?: string[];
  }): Promise<IInterviewSession> {
    const { userId, goalId, targetRole, targetCompany, experienceLevel, focusAreas } = params;

    const profile = await Profile.findOne({ userId });
    const goal = goalId ? await Goal.findOne({ _id: goalId, userId }) : undefined;

    const agent = AgentRegistry.getAgent('interview_agent');
    if (!agent) {
      throw new Error('InterviewAgent is not registered.');
    }

    const result = await agent.execute({
      goal: goal || { rawPrompt: `Interview prep for ${targetRole}`, extractedData: { targetRole } } as any,
      profile: profile || undefined,
      inputPayload: {
        mode: 'generate',
        targetRole,
        company: targetCompany,
        experienceLevel: experienceLevel || profile?.career?.experienceLevel || 'mid',
        focusAreas,
      },
    });

    const session = await InterviewSession.create({
      userId,
      goalId: goal?._id,
      targetRole,
      targetCompany,
      experienceLevel: experienceLevel || 'mid',
      focusAreas: focusAreas || ['dsa', 'technical', 'system_design', 'behavioral'],
      questions: result.outputPayload.questions || [],
      status: 'created',
    });

    return session;
  }

  /**
   * Submit candidate answers and evaluate interview performance
   */
  static async evaluateInterviewSession(params: {
    userId: Types.ObjectId;
    sessionId: string;
    answers: Array<{ questionId: string; userAnswer: string }>;
  }): Promise<IInterviewSession> {
    const { userId, sessionId, answers } = params;

    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new Error('Interview session not found.');
    }

    const answerMap = new Map<string, string>();
    answers.forEach((a) => answerMap.set(a.questionId, a.userAnswer));

    const questionsToEval = session.questions.map((q) => ({
      questionId: q.questionId,
      category: q.category,
      question: q.question,
      expectedPoints: q.expectedPoints,
      userAnswer: answerMap.get(q.questionId) || q.userAnswer || '',
    }));

    const agent = AgentRegistry.getAgent('interview_agent');
    if (!agent) {
      throw new Error('InterviewAgent is not registered.');
    }

    const result = await agent.execute({
      goal: { rawPrompt: `Evaluate interview for ${session.targetRole}`, extractedData: { targetRole: session.targetRole } } as any,
      inputPayload: {
        mode: 'evaluate',
        targetRole: session.targetRole,
        company: session.targetCompany,
        questions: questionsToEval,
      },
    });

    const evalMap = new Map<string, any>();
    (result.outputPayload.evaluatedQuestions || []).forEach((item: any) => {
      evalMap.set(item.questionId, item);
    });

    // Update questions in session document
    session.questions.forEach((q) => {
      const ans = answerMap.get(q.questionId);
      if (ans !== undefined) q.userAnswer = ans;
      const evaluation = evalMap.get(q.questionId);
      if (evaluation) {
        q.score = evaluation.score;
        q.feedback = evaluation.feedback;
        q.strengths = evaluation.strengths;
        q.improvements = evaluation.improvements;
      }
    });

    session.overallScore = result.outputPayload.overallScore || 85;
    session.overallFeedback = (result.outputPayload.keyTakeaways || []).join(' ');
    session.status = 'evaluated';

    await session.save();
    return session;
  }

  /**
   * Application Pipeline Tracking
   */
  static async listApplications(userId: Types.ObjectId, filters?: { status?: string; goalId?: string }): Promise<IApplication[]> {
    const query: any = { userId };
    if (filters?.status) query.status = filters.status;
    if (filters?.goalId) query.goalId = filters.goalId;
    return Application.find(query).sort({ updatedAt: -1 });
  }

  static async createApplication(userId: Types.ObjectId, data: Partial<IApplication>): Promise<IApplication> {
    return Application.create({
      ...data,
      userId,
    });
  }

  static async updateApplication(
    userId: Types.ObjectId,
    applicationId: string,
    updates: Partial<IApplication>
  ): Promise<IApplication | null> {
    return Application.findOneAndUpdate({ _id: applicationId, userId }, { $set: updates }, { new: true });
  }

  static async deleteApplication(userId: Types.ObjectId, applicationId: string): Promise<boolean> {
    const res = await Application.deleteOne({ _id: applicationId, userId });
    return res.deletedCount > 0;
  }
}
