import { Types } from 'mongoose';

// ==========================================
// 1. User & Profile Types
// ==========================================
export type UserRole = 'user' | 'admin' | 'guest';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  apiKeys?: {
    openai?: string;
    gemini?: string;
    anthropic?: string;
    custom?: Record<string, string>;
  };
  preferences?: {
    theme?: 'dark' | 'light' | 'system';
    autoApproveSafeTools?: boolean;
    emailNotifications?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileTrack = 'career' | 'startup' | 'business' | 'custom';

export interface ICareerProfile {
  targetRole?: string;
  targetCompanies?: string[];
  experienceLevel?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
    gpa?: string;
  }>;
  skills?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    highlights?: string[];
  }>;
  resumeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  preferredLocation?: string;
}

export interface IStartupProfile {
  startupName?: string;
  ideaSummary?: string;
  problemStatement?: string;
  targetCustomer?: string;
  industry?: string;
  stage?: 'idea' | 'prototype' | 'mvp' | 'early_traction' | 'scaling';
  budget?: number;
  teamSize?: number;
  existingProductUrl?: string;
  knownCompetitors?: string[];
  revenueModel?: string;
}

export interface IProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  activeTrack: ProfileTrack;
  career?: ICareerProfile;
  startup?: IStartupProfile;
  customData?: Record<string, any>;
  completenessScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 2. Goal Types
// ==========================================
export type GoalType = 'career' | 'startup' | 'business' | 'product_launch' | 'personal_brand' | 'freelance' | 'custom';
export type GoalStatus = 'draft' | 'analyzing' | 'clarification_needed' | 'planned' | 'executing' | 'completed' | 'paused' | 'failed';

export interface IExtractedGoalData {
  goalType: GoalType;
  industry?: string;
  targetRole?: string;
  targetCustomer?: string;
  stage?: string;
  objective?: string;
  timeHorizon?: string;
  budget?: number;
  keyConstraints?: string[];
  successCriteria?: string[];
}

export interface IMissingGoalInfo {
  questionId: string;
  question: string;
  field: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  answer?: string;
  answeredAt?: Date;
}

export interface IGoal {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  profileId?: Types.ObjectId;
  title: string;
  rawPrompt: string;
  goalType: GoalType;
  status: GoalStatus;
  readinessScore?: number;
  extractedData?: IExtractedGoalData;
  missingInformation: IMissingGoalInfo[];
  targetDate?: Date;
  activeWorkflowId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 3. Workflow & Task Types (DAG Engine)
// ==========================================
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'waiting_approval';

export interface IWorkflow {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  title: string;
  description?: string;
  status: WorkflowStatus;
  progressPercent: number; // 0 to 100
  taskIds: Types.ObjectId[];
  activeTaskId?: Types.ObjectId;
  currentMilestone?: string;
  summaryResult?: Record<string, any>;
  errors?: Array<{
    taskId?: Types.ObjectId;
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 
  | 'pending'           // Waiting for dependencies to finish
  | 'ready'             // Dependencies satisfied, ready to run
  | 'running'           // Agent actively processing
  | 'verification'      // Under evaluation by Verification Agent
  | 'approval_required' // Sensitive action needs user approval
  | 'completed'         // Successfully completed
  | 'failed'            // Exhausted retries or critical failure
  | 'skipped';          // Skipped conditionally

export interface ITask {
  _id: Types.ObjectId;
  workflowId: Types.ObjectId;
  goalId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  agentType: string;
  dependencies: Types.ObjectId[]; // Tasks that must complete before this runs
  status: TaskStatus;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  verificationScore?: number; // 0 to 100
  verificationNotes?: string;
  executionTimeMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 4. Agent Registry & Execution Telemetry
// ==========================================
export interface IAgentDefinition {
  _id: Types.ObjectId;
  agentId: string; // e.g. "resume_agent", "market_research_agent"
  name: string;
  role: string;
  description: string;
  category: 'career' | 'startup' | 'core' | 'content' | 'tool';
  systemPrompt: string;
  allowedTools: string[];
  knowledgeAccess: boolean;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  confidenceThreshold: number; // e.g. 80%
  maxRetries: number;
  isDynamic: boolean; // True if generated by Dynamic Agent Builder
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentRun {
  _id: Types.ObjectId;
  agentId: string;
  taskId: Types.ObjectId;
  workflowId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'started' | 'succeeded' | 'failed' | 'retrying';
  input: Record<string, any>;
  output?: Record<string, any>;
  toolCalls: Array<{
    toolName: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    success: boolean;
    durationMs: number;
  }>;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  error?: string;
  createdAt: Date;
}

// ==========================================
// 5. RAG Knowledge Hub Types
// ==========================================
export type DocumentStatus = 'uploaded' | 'processing' | 'indexed' | 'failed';

export interface IDocumentChunk {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  goalId?: Types.ObjectId;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding?: number[]; // Vector embeddings for similarity search
  metadata: {
    pageNumber?: number;
    sectionTitle?: string;
    sourceFilename: string;
    fileType: string;
  };
  createdAt: Date;
}

export interface IDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId?: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  status: DocumentStatus;
  chunkCount: number;
  summary?: string;
  category?: 'resume' | 'business_plan' | 'financial' | 'job_description' | 'research' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 6. Human Approval & Tool Permission Types
// ==========================================
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';
export type SensitiveActionType = 'email_send' | 'social_publish' | 'api_call' | 'file_write' | 'payment_intent' | 'other';

export interface IApproval {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  workflowId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  agentId: string;
  actionType: SensitiveActionType;
  title: string;
  summary: string;
  targetPayload: Record<string, any>; // e.g. { recipient: "hr@company.com", subject: "Application", body: "..." }
  status: ApprovalStatus;
  reviewerNotes?: string;
  respondedAt?: Date;
  executionResult?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type ToolCategory = 'search' | 'communication' | 'developer' | 'productivity' | 'custom';

export interface IToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  isSensitive: boolean;
  requiredPermissions: string[];
  parametersSchema: Record<string, any>;
}

export interface IToolCallResult {
  toolName: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  success: boolean;
  durationMs: number;
  requiresApproval?: boolean;
  approvalId?: Types.ObjectId;
  error?: string;
}

export interface IPermissionCheckResult {
  allowed: boolean;
  isSensitive: boolean;
  reason?: string;
}

// ==========================================
// 7. Notification & Analytics Types
// ==========================================
export type NotificationType = 
  | 'workflow_completed' 
  | 'approval_required' 
  | 'agent_failed' 
  | 'milestone_reached' 
  | 'recommendation_ready'
  | 'info';

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IAnalytics {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  agentId?: string;
  workflowId?: Types.ObjectId;
  metricType: 'execution_time' | 'token_usage' | 'cost' | 'verification_score' | 'retry_count' | 'user_approval_rate';
  metricValue: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// ==========================================
// 8. Career Intelligence & Interview Types
// ==========================================
export type ApplicationStage = 
  | 'wishlist' 
  | 'applied' 
  | 'screening' 
  | 'technical' 
  | 'final_round' 
  | 'offer' 
  | 'rejected' 
  | 'withdrawn';

export interface IApplication {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId?: Types.ObjectId;
  company: string;
  position: string;
  jobDescription?: string;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  status: ApplicationStage;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  notes?: string;
  appliedDate?: Date;
  nextActionDate?: Date;
  nextActionType?: string;
  outreachEmailDraft?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewQuestionCategory = 'dsa' | 'technical' | 'system_design' | 'behavioral';

export interface IInterviewQuestionItem {
  questionId: string;
  category: InterviewQuestionCategory;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints: string[];
  userAnswer?: string;
  score?: number; // 0 to 100
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

export interface IInterviewSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId?: Types.ObjectId;
  targetRole: string;
  targetCompany?: string;
  experienceLevel?: string;
  focusAreas?: string[];
  questions: IInterviewQuestionItem[];
  overallScore?: number;
  overallFeedback?: string;
  status: 'created' | 'in_progress' | 'evaluated';
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 9. Startup Intelligence & Venture Types
// ==========================================
export interface ICustomerPersona {
  personaName: string;
  role: string;
  companyProfile?: string;
  demographics?: Record<string, any>;
  primaryGoals: string[];
  corePainPoints: string[];
  triggersToBuy: string[];
  willingnessToPay: string;
  preferredChannels: string[];
}

export interface ICompetitorMatrixItem {
  competitorName: string;
  website?: string;
  targetAudience: string;
  pricingModel: string;
  coreFeatures: string[];
  strengths: string[];
  weaknesses: string[];
  marketGaps: string[];
  differentiationAngle: string;
}

export interface IPricingTier {
  name: string;
  price: string;
  billingPeriod: string;
  targetUser: string;
  featuresIncluded: string[];
  isPopular?: boolean;
}

export interface IBusinessModelSpec {
  revenueModel: string;
  pricingStrategy: string;
  pricingTiers: IPricingTier[];
  unitEconomics: {
    estimatedCAC?: string;
    estimatedLTV?: string;
    paybackPeriodMonths?: number;
    grossMarginPercent?: number;
  };
  expansionRevenueDrivers: string[];
}

export interface IMVPStrategy {
  coreValueHypothesis: string;
  mustHaveFeatures: string[];
  shouldHaveFeatures: string[];
  outOfScopeForMVP: string[];
  recommendedTechStack: {
    frontend: string[];
    backend: string[];
    aiAndModels: string[];
    databaseAndCloud: string[];
  };
  launchRoadmap30Days: Array<{
    dayRange: string;
    phaseName: string;
    keyDeliverables: string[];
  }>;
}

export type VentureStatus = 'ideation' | 'validation' | 'mvp_build' | 'beta_launch' | 'growth';

export interface IVenture {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  goalId?: Types.ObjectId;
  name: string;
  tagline?: string;
  industry: string;
  problemStatement: string;
  valueProposition: string;
  targetCustomer?: string;
  status: VentureStatus;
  personas: ICustomerPersona[];
  competitors: ICompetitorMatrixItem[];
  businessModel?: IBusinessModelSpec;
  mvpStrategy?: IMVPStrategy;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
