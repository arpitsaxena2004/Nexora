import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .optional(),
});

// ─── Nexora AI Comprehensive Platform Knowledge Graph ───
const PLATFORM_KNOWLEDGE: Array<{
  keywords: string[];
  title: string;
  response: string;
  action?: { tab: string; label: string };
}> = [
  {
    keywords: ['what is nexora', 'what is agentflow', 'what is ai flow', 'overview', 'about this platform', 'platform features', 'what does this app do', 'tagline', 'pickup line'],
    title: 'Nexora AI Platform Overview',
    response: `**Nexora AI** (*From Ambition to Autonomous Execution*) is an Autonomous Multi-Agent Goal Execution Platform designed to turn high-level career, startup, or business objectives into deterministic, executed reality.

### 🌟 Core Architectural Pillars:
1. **13 Autonomous Specialized Agents**: Divided into Core Strategy, Career Intelligence, and Startup Venture tracks.
2. **3D Neural Constellation**: An interactive 3D WebGL orchestrator showing active agent synchronizations and floating nodes in real-time.
3. **Directed Acyclic Graph (DAG) Execution Engine**: Visual 3D and 2D task pipeline with topological dependency resolution and automated step execution.
4. **RAG Knowledge Hub & 3-Tier Memory**: Semantic vector search with automated multi-page PDF/DOCX text extraction, chunking, and cosine similarity retrieval.
5. **Human-in-the-Loop (HITL) Safety Layer**: Intercepts sensitive actions (live email dispatch, calendar bookings) requiring cryptographic user authorization.`,
    action: { tab: 'dashboard', label: 'Go to Command Center' },
  },
  {
    keywords: ['13 agents', 'agents list', 'autonomous fleet', 'fleet', 'what agents', 'agent list', 'agent registry'],
    title: 'The 13 Specialized Autonomous Agents',
    response: `Nexora AI coordinates **13 specialized autonomous agents** divided across 3 dedicated operational tracks:

### 🟣 Core Track (Orchestration & Quality)
- **Strategy Agent**: Analyzes objectives, extracts missing parameters, and formulates high-level milestones.
- **Market Research Agent**: Scans TAM/SAM, competitive landscapes, and industry benchmarks.
- **Content Agent**: Drafts cold outreach emails, technical dossiers, and structured deliverables.
- **Verification Agent**: Audits generated outputs for quality assurance and compliance before completion.

### 🔵 Career Intelligence Track
- **Resume Agent**: Performs ATS parsing, keyword optimization, and qualification scoring.
- **Job Matching Agent**: Computes semantic match vectors between candidates and target job descriptions.
- **Company Research Agent**: Analyzes employer engineering culture, interview stages, and leadership principles.
- **Interview Prep Agent**: Generates tailored system design and coding mock interview challenges with evaluation rubrics.
- **Skill Gap Agent**: Identifies technical discrepancies and builds customized learning roadmaps.

### 🟢 Startup Venture Track
- **Competitor Matrix Agent**: Pinpoints defensibility moats, feature matrix gaps, and competitor vulnerabilities.
- **Customer Persona Agent**: Formulates ideal customer profiles (ICPs), pain points, and willingness-to-pay triggers.
- **Business Model Agent**: Structures revenue streams, pricing tiers, and go-to-market strategies.
- **MVP Strategy Agent**: Designs 30-day technical architecture roadmaps, database schemas, and milestone plans.`,
    action: { tab: 'agents', label: 'View Full Agent Registry' },
  },
  {
    keywords: ['dag', 'workflow', 'dag workflows', '3d pipeline', 'execute next', 'run all', 'dependencies', 'pipeline'],
    title: 'DAG Workflow Execution Engine & 3D Pipeline',
    response: `The **DAG (Directed Acyclic Graph) Execution Engine** turns abstract goals into an orderly, dependency-driven pipeline of agent tasks.

### ⚙️ Key Workflow Features:
- **3D Neural Pipeline View**: Inspect tasks as 3D holographic pods connected by glowing laser streams indicating data dependencies.
- **Topological Scheduling**: Tasks only run when all prerequisites are satisfied.
- **Execute Next**: Triggers the next ready agent task and updates live status to \`completed\` with verification scores.
- **Run All**: Autonomously executes the entire task pipeline from start to finish.
- **Agent Output Inspector**: Click any task pod in 3D or 2D to view structured JSON telemetry, synthesized deliverables, and execution times.`,
    action: { tab: 'workflows', label: 'Open DAG Workflows' },
  },
  {
    keywords: ['rag', 'knowledge hub', 'upload', 'pdf', 'vector', 'embeddings', 'similarity search', 'memory', 'document'],
    title: 'RAG Knowledge Hub & 3-Tier Vector Memory',
    response: `The **RAG (Retrieval-Augmented Generation) Knowledge Hub** provides long-term semantic memory for the 13-agent fleet.

### 📂 How to Use the RAG Hub:
1. **Document Upload & AI Extraction**: Drag & drop or upload any \`.pdf\`, \`.docx\`, \`.md\`, \`.txt\`, \`.json\`, or \`.csv\` file.
2. **Autonomous Extraction Agent**: Automatically parses text page-by-page, sets the document title, and auto-classifies the category.
3. **Chunking & Vector Embeddings**: Ingesting splits documents into overlapping token chunks and generates vector embeddings.
4. **Semantic Similarity Search**: Test semantic queries using cosine vector distance to inspect what agents retrieve during workflow execution.`,
    action: { tab: 'knowledge', label: 'Open RAG Knowledge Hub' },
  },
  {
    keywords: ['approval', 'human in the loop', 'hitl', 'safety', 'sensitive', 'authorization', 'permission', 'security'],
    title: 'Human-in-the-Loop (HITL) Safety & Sensitive Approvals',
    response: `Nexora AI enforces strict **Human-in-the-Loop Safety** to prevent autonomous agents from taking unverified external actions.

### 🛡️ How Sensitive Interception Works:
- Actions such as **live email dispatch**, **calendar booking**, or **database writes** are intercepted by the safety proxy.
- The action is suspended in an \`approval_required\` state with a cryptographic token.
- You can review the exact payload in the **Approvals & Tools** tab, where you can safely **Approve** or **Reject** with full audit trails.`,
    action: { tab: 'approvals', label: 'Review Approvals Queue' },
  },
  {
    keywords: ['ats', 'resume', 'career suite', 'job match', 'interview', 'company tech dossier', 'career hub'],
    title: 'Career Intelligence Suite',
    response: `The **Career Suite** empowers software engineers and tech professionals to land target roles:
- **ATS Resume Matcher**: Scores candidate resumes against role requirements and highlights missing keywords.
- **Company Tech Dossier**: Deep-dives into employer engineering architectures, tech stacks, and culture.
- **AI Mock Interviewer**: Generates real-time interview questions, accepts your voice/text answers, and provides instant rubric evaluations.`,
    action: { tab: 'career', label: 'Open Career Suite' },
  },
  {
    keywords: ['startup', 'venture', 'mvp', 'icp', 'competitor matrix', 'business model', 'startup workspace'],
    title: 'Startup Venture Engine',
    response: `The **Startup Workspace** helps founders validate, build, and launch new products:
- **Customer Persona Generator**: Identifies B2B buyer profiles, pain points, and decision triggers.
- **Competitor Defensibility Matrix**: Compares key players and highlights your unfair differentiation moat.
- **Business Model & Pricing**: Suggests optimal monetization strategies and pricing tiers.
- **30-Day MVP Roadmap**: Generates sprint milestones, tech stacks, and release timelines.`,
    action: { tab: 'startup', label: 'Open Startup Workspace' },
  },
  {
    keywords: ['3d', 'globe', 'constellation', 'model', 'neural orchestrator', '3d component'],
    title: '3D Neural Orchestrator & Constellation',
    response: `The **3D Neural Orchestrator** on the Dashboard provides a real-time spatial visualization of the AI ecosystem:
- **Central Quantum AI Core**: An animated multi-axis gyroscopic core with volumetric plasma glow and quantum particle fields.
- **Floating Agent Pods**: The 13 specialized agents float with independent harmonic levitation physics across Core, Career, and Startup tracks.
- **Interactive Orbit & Filter**: Filter by agent track (\`Career\`, \`Startup\`, \`Core\`) or drag to rotate and click any agent to view its telemetry dossier.`,
    action: { tab: 'dashboard', label: 'View 3D Dashboard' },
  },
  {
    keywords: ['create goal', 'onboarding', 'how to start', 'first goal', 'get started'],
    title: 'Creating Your First Goal',
    response: `To get started with Nexora AI:
1. Click **"Goal Intake"** or **"Create Your First Goal"** on the Dashboard.
2. Choose your goal category (\`Career\`, \`Startup\`, \`Business\`).
3. Describe your objective in natural language or pick a benchmark preset.
4. The **Goal Understanding Agent** analyzes requirements, computes your readiness score, and assembles an autonomous multi-agent team into a customized DAG workflow!`,
    action: { tab: 'onboarding', label: 'Create a New Goal' },
  },
];

// Fallback response for off-topic queries
const OFF_TOPIC_RESPONSE = `I am the **Nexora AI Assistant**, dedicated specifically to guiding you through this platform, its **13 Autonomous Agents**, **3D DAG Workflows**, **RAG Knowledge Hub**, **Career Suite**, **Startup Workspace**, and **HITL Safety Approvals**.

I can only answer questions related to Nexora AI (*From Ambition to Autonomous Execution*). 

### What would you like to explore?
- 🚀 **Platform Overview & How It Works**
- 🤖 **The 13 Specialized AI Agents**
- ⚡ **3D Neural DAG Workflow Execution**
- 📂 **RAG Knowledge Hub & Multi-Page PDF Ingestion**
- 🛡️ **Human-in-the-Loop Safety Approvals**
- 🎯 **How to Create & Launch a Goal**`;

// ─── POST /api/assistant/chat ───
router.post('/chat', authenticate, validate(chatSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    const lowerMessage = message.toLowerCase().trim();

    // 1. Guardrail Check: Match against Platform Knowledge
    let bestMatch: (typeof PLATFORM_KNOWLEDGE)[0] | null = null;
    let highestScore = 0;

    for (const item of PLATFORM_KNOWLEDGE) {
      let score = 0;
      for (const kw of item.keywords) {
        if (lowerMessage.includes(kw)) {
          score += kw.length * 2;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    // 2. Off-topic check (e.g. general trivia, weather, cooking, unrelated tasks)
    const offTopicKeywords = [
      'weather', 'recipe', 'cook', 'chocolate', 'movie', 'president', 'capital of',
      'who is the king', 'bitcoin price', 'tell me a joke', 'write code for python game',
      'translate to spanish', 'horoscope', 'celebrity'
    ];
    const isExplicitlyOffTopic = offTopicKeywords.some(kw => lowerMessage.includes(kw));

    if (isExplicitlyOffTopic && highestScore < 5) {
      res.json({
        reply: OFF_TOPIC_RESPONSE,
        isOffTopic: true,
        suggestions: [
          'What are the 13 autonomous agents?',
          'How does the 3D DAG Workflow work?',
          'How do I upload a resume to RAG Hub?',
          'How do safety approvals work?',
        ],
      });
      return;
    }

    // 3. If we have a direct platform knowledge match
    if (bestMatch && highestScore >= 3) {
      res.json({
        reply: bestMatch.response,
        action: bestMatch.action,
        suggestions: [
          'What are the 13 autonomous agents?',
          'How does the 3D DAG Workflow work?',
          'How do I upload a resume to RAG Hub?',
          'Explain Human-in-the-Loop approvals',
        ],
      });
      return;
    }

    // 4. Fallback contextual synthesis for platform-related inquiries
    if (
      lowerMessage.includes('nexora') ||
      lowerMessage.includes('agent') ||
      lowerMessage.includes('flow') ||
      lowerMessage.includes('goal') ||
      lowerMessage.includes('task') ||
      lowerMessage.includes('step') ||
      lowerMessage.includes('3d') ||
      lowerMessage.includes('how') ||
      lowerMessage.includes('help') ||
      lowerMessage.includes('start')
    ) {
      res.json({
        reply: `**Nexora AI** (*From Ambition to Autonomous Execution*) helps you turn ambitious objectives into automated reality through our 13 specialized agents and visual DAG pipelines.

### Quick Actions to Get Started:
1. **Define a Goal**: Visit [Goal Intake] to describe your career or startup target.
2. **Execute DAG**: Open [DAG Workflows] to step through autonomous agent tasks in 3D.
3. **Add Knowledge**: Upload resumes or decks to the [RAG Knowledge Hub] for semantic vector retrieval.
4. **Safety Verification**: Review any intercepted sensitive actions in [Approvals & Tools].

What specific feature would you like to learn more about?`,
        suggestions: [
          'Explain the 13 Autonomous Agents',
          'How does 3D DAG execution work?',
          'How does the RAG Knowledge Hub work?',
          'How to launch a startup venture plan?',
        ],
      });
      return;
    }

    // 5. Default polite guardrail fallback
    res.json({
      reply: OFF_TOPIC_RESPONSE,
      isOffTopic: true,
      suggestions: [
        'What are the 13 autonomous agents?',
        'How does the 3D DAG Workflow work?',
        'How do I upload a resume to RAG Hub?',
        'How do safety approvals work?',
      ],
    });
  } catch (error: any) {
    console.error('Assistant chat error:', error);
    res.status(500).json({
      error: 'Assistant failed to respond',
      message: error.message,
    });
  }
});

export default router;
