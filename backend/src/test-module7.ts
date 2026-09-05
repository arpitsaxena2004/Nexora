import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5060;

async function request(options: {
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...options.headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const data = rawData ? JSON.parse(rawData) : {};
            resolve({ status: res.statusCode || 500, data });
          } catch (e) {
            resolve({ status: res.statusCode || 500, data: rawData });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runModule7Tests() {
  console.log('🧪 Starting Module 7 (Deep Startup Intelligence & Specialized Startup Suite) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `founder_venture_${Date.now()}@example.com`;
    let authToken = '';
    let goalId = '';
    let ventureId = '';
    let workflowId = '';

    // 1. Register Founder User
    console.log('1️⃣  Registering Startup Founder User...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Marcus Startup Founder',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    authToken = regRes.data.token;
    console.log('   ✅ Founder user registered successfully. Token acquired.');

    // 2. Set Up Founder Startup Profile
    console.log('\n2️⃣  Configuring User Profile with Startup Venture Metadata...');
    const profileRes = await request({
      path: '/api/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        activeTrack: 'startup',
        startup: {
          startupName: 'NexusAI CRM',
          ideaSummary: 'Autonomous agentic sales CRM automating lead research, hyper-personalized email sequences, and meeting scheduling for B2B SaaS.',
          problemStatement: 'Sales teams spend 65% of their time on manual prospecting and repetitive administrative CRM data entry instead of closing deals.',
          targetCustomer: 'B2B SaaS and Agency Sales Teams (10-100 employees)',
          industry: 'AI / SalesTech SaaS',
          stage: 'idea',
          budget: 10000,
          knownCompetitors: ['Apollo.io', 'Clay.com', 'Outreach.io'],
          revenueModel: 'Tiered Monthly Subscription with usage add-ons',
        },
      },
    });
    if (profileRes.status !== 200) throw new Error(`Profile update failed: ${JSON.stringify(profileRes.data)}`);
    console.log(`   ✅ Startup profile configured. Completeness score: ${profileRes.data.profile.completenessScore}%`);

    // 3. Create Startup Goal
    console.log('\n3️⃣  Creating Startup Acceleration Goal...');
    const goalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Launch NexusAI Autonomous Agent CRM',
        rawPrompt: 'I want to build, validate, and launch NexusAI - an autonomous AI agent CRM for B2B sales teams - reaching $10k MRR within 6 months.',
        goalType: 'startup',
      },
    });
    if (goalRes.status !== 201) throw new Error(`Goal creation failed: ${JSON.stringify(goalRes.data)}`);
    goalId = goalRes.data.goal._id;
    console.log(`   ✅ Goal Created: "${goalRes.data.goal.title}" (ID: ${goalId})`);

    // 4. Ingest Executive Business Plan Document into RAG Knowledge Hub
    console.log('\n4️⃣  Ingesting Executive Business Plan into RAG Hub for Grounded Retrieval...');
    const sampleBusinessPlan = `# NEXUS AI - EXECUTIVE BUSINESS PLAN
    
## 1. EXECUTIVE SUMMARY
Nexus AI is an autonomous agentic CRM for B2B sales automation. We empower sales teams to orchestrate AI SDR agents that research accounts, draft personalized multi-touch sequences, and automatically schedule qualified meetings.

## 2. MARKET OPPORTUNITY
- Total Addressable Market (TAM): $68 Billion global CRM & Sales Intelligence market.
- Serviceable Addressable Market (SAM): $14 Billion B2B SaaS sales automation segment.
- Key Catalyst: Recent advancements in reasoning LLMs enable fully autonomous agent workflows rather than rigid if-then rules.

## 3. CORE COMPETITIVE ADVANTAGES
1. Multi-Agent DAG Architecture: Autonomous pipeline connecting research agents, copywriters, and CRM automations.
2. Unified 3-Tier Memory: Learns customer brand voice and sales objection handling over time.
3. Transparent Verification & Approval: Human-in-the-loop review ensures 0% hallucinated outreach.`;

    const docIngestRes = await request({
      path: '/api/knowledge/documents',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        filename: 'nexus_ai_executive_business_plan.md',
        category: 'business_plan',
        goalId,
        content: sampleBusinessPlan,
      },
    });
    if (docIngestRes.status !== 201) throw new Error(`Document ingest failed: ${JSON.stringify(docIngestRes.data)}`);
    console.log(`   ✅ Ingested Business Plan: Chunks Count = ${docIngestRes.data.document.chunkCount}`);

    // 5. Test CustomerPersonaAgent
    console.log('\n5️⃣  Executing Customer Persona & ICP Agent (CustomerPersonaAgent)...');
    const personaRes = await request({
      path: '/api/startup/customer-persona',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        idea: 'Autonomous Agent CRM for B2B sales automation',
        targetCustomer: 'B2B SaaS Sales Leaders',
        industry: 'SalesTech / AI',
      },
    });

    if (personaRes.status !== 200) throw new Error(`Persona generation failed: ${JSON.stringify(personaRes.data)}`);
    const personaData = personaRes.data;
    console.log(`   ✅ ICP Summary: "${personaData.icpSummary}"`);
    console.log(`   Primary Persona: "${personaData.primaryPersona?.personaName}" (${personaData.primaryPersona?.role})`);
    console.log(`     - Willingness to Pay: ${personaData.primaryPersona?.willingnessToPay}`);
    console.log(`     - Core Pain Points (${personaData.primaryPersona?.corePainPoints?.length}):`, personaData.primaryPersona?.corePainPoints?.slice(0, 2));
    console.log(`   Secondary Persona: "${personaData.secondaryPersona?.personaName}" (${personaData.secondaryPersona?.role})`);
    console.log(`   Verification Score: ${personaData.verificationScore}%`);

    // 6. Test CompetitorMatrixAgent
    console.log('\n6️⃣  Executing Competitor Intelligence Matrix Agent (CompetitorAgent)...');
    const compRes = await request({
      path: '/api/startup/competitor-matrix',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        idea: 'Autonomous Agent CRM for B2B sales automation',
        industry: 'SalesTech / AI',
        knownCompetitors: ['Apollo.io', 'Clay.com'],
      },
    });

    if (compRes.status !== 200) throw new Error(`Competitor matrix failed: ${JSON.stringify(compRes.data)}`);
    const compData = compRes.data;
    console.log(`   ✅ Competitors Analyzed (${compData.competitors?.length}):`);
    compData.competitors?.forEach((c: any, i: number) => {
      console.log(`     [${i + 1}] ${c.competitorName} | Pricing: ${c.pricingModel} | Moat Angle: ${c.differentiationAngle?.substring(0, 60)}...`);
    });
    console.log(`   Market Gap Summary: "${compData.marketGapSummary?.substring(0, 90)}..."`);
    console.log(`   Defensibility Moat: "${compData.defensibilityMoat?.substring(0, 90)}..."`);

    // 7. Test BusinessModelAgent
    console.log('\n7️⃣  Executing Business Model & Pricing Architecture Agent (BusinessModelAgent)...');
    const bmRes = await request({
      path: '/api/startup/business-model',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        idea: 'Autonomous Agent CRM for B2B sales automation',
        targetCustomer: 'B2B Sales Teams',
        industry: 'SalesTech / AI',
      },
    });

    if (bmRes.status !== 200) throw new Error(`Business model failed: ${JSON.stringify(bmRes.data)}`);
    const bm = bmRes.data.businessModel;
    console.log(`   ✅ Revenue Model: "${bm.revenueModel}"`);
    console.log(`   Pricing Strategy: "${bm.pricingStrategy}"`);
    console.log(`   Pricing Tiers (${bm.pricingTiers?.length}):`);
    bm.pricingTiers?.forEach((tier: any) => {
      console.log(`     - ${tier.name}: ${tier.price}/${tier.billingPeriod} (${tier.targetUser}) [${tier.featuresIncluded?.length} features]`);
    });
    console.log(`   Unit Economics: CAC: ${bm.unitEconomics?.estimatedCAC} | LTV: ${bm.unitEconomics?.estimatedLTV} | Payback: ${bm.unitEconomics?.paybackPeriodMonths} mo | Gross Margin: ${bm.unitEconomics?.grossMarginPercent}%`);

    // 8. Test MVPStrategyAgent
    console.log('\n8️⃣  Executing MVP Scope & 30-Day Launch Roadmap Agent (MVPStrategyAgent)...');
    const mvpRes = await request({
      path: '/api/startup/mvp-roadmap',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        idea: 'Autonomous Agent CRM for B2B sales automation',
        targetCustomer: 'B2B Sales Teams',
        industry: 'SalesTech / AI',
      },
    });

    if (mvpRes.status !== 200) throw new Error(`MVP roadmap failed: ${JSON.stringify(mvpRes.data)}`);
    const mvp = mvpRes.data.mvpStrategy;
    console.log(`   ✅ Core Value Hypothesis: "${mvp.coreValueHypothesis}"`);
    console.log(`   Must-Have MVP Features (${mvp.mustHaveFeatures?.length}):`, mvp.mustHaveFeatures?.slice(0, 2));
    console.log(`   Out of Scope for MVP:`, mvp.outOfScopeForMVP);
    console.log(`   Recommended Backend Stack: ${(mvp.recommendedTechStack?.backend || []).join(', ')}`);
    console.log(`   30-Day Launch Roadmap Phases (${mvp.launchRoadmap30Days?.length}):`);
    mvp.launchRoadmap30Days?.forEach((phase: any) => {
      console.log(`     - ${phase.dayRange} [${phase.phaseName}]: ${phase.keyDeliverables?.length} deliverables`);
    });

    // 9. Test Venture Workspace Model CRUD
    console.log('\n9️⃣  Testing Startup Venture Workspace Lifecycle (CRUD & State Transitions)...');
    
    // Create venture
    const createVentureRes = await request({
      path: '/api/startup/ventures',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        name: 'NexusAI Autonomous Sales CRM',
        tagline: 'Autonomous AI SDR Agents that Research and Book Qualified Meetings',
        industry: 'SalesTech / Enterprise AI',
        problemStatement: 'B2B sales teams waste 60%+ of their working hours on manual prospecting.',
        valueProposition: 'Autonomous agentic multi-touch sales sequences with 3-tier memory and guaranteed human verification.',
        targetCustomer: 'Mid-market B2B SaaS Sales Leaders',
        status: 'validation',
        personas: [personaData.primaryPersona, personaData.secondaryPersona].filter(Boolean),
        competitors: compData.competitors || [],
        businessModel: bm,
        mvpStrategy: mvp,
      },
    });

    if (createVentureRes.status !== 201) throw new Error(`Venture creation failed: ${JSON.stringify(createVentureRes.data)}`);
    ventureId = createVentureRes.data.venture._id;
    console.log(`   ✅ Venture Workspace Created: "${createVentureRes.data.venture.name}" (ID: ${ventureId})`);

    // List ventures
    const listVenturesRes = await request({
      path: '/api/startup/ventures',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (listVenturesRes.status !== 200 || listVenturesRes.data.total < 1) {
      throw new Error(`Expected at least 1 venture, got ${listVenturesRes.data.total}`);
    }
    console.log(`   ✅ Fetched User Ventures Count: ${listVenturesRes.data.total}`);

    // Update venture status to mvp_build
    const patchVentureRes = await request({
      path: `/api/startup/ventures/${ventureId}`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        status: 'mvp_build',
        notes: 'Customer discovery interviews completed (12 interviews). Validated $149/mo willingness to pay. Starting MVP development.',
      },
    });
    if (patchVentureRes.status !== 200 || patchVentureRes.data.venture.status !== 'mvp_build') {
      throw new Error('Update venture failed');
    }
    console.log(`   ✅ Advanced Venture Workspace Status to "${patchVentureRes.data.venture.status}"`);

    // Fetch single venture by ID
    const getVentureRes = await request({
      path: `/api/startup/ventures/${ventureId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (getVentureRes.status !== 200) throw new Error('Failed to fetch venture by ID');
    console.log(`   ✅ Verified Persisted Personas in DB: ${getVentureRes.data.venture.personas?.length}, Competitors: ${getVentureRes.data.venture.competitors?.length}`);

    // 10. Test End-to-End Orchestrated Startup DAG Workflow Execution
    console.log('\n🔟 Testing End-to-End Orchestrated Startup DAG Task Execution...');
    
    // Analyze Goal
    await request({
      path: `/api/goals/${goalId}/analyze`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Create DAG Plan
    const planRes = await request({
      path: `/api/goals/${goalId}/create-plan`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (planRes.status !== 201) throw new Error(`Plan creation failed: ${JSON.stringify(planRes.data)}`);
    workflowId = planRes.data.workflow._id;
    console.log(`   ✅ Multi-Agent Startup Workflow Created: "${planRes.data.workflow.title}" (ID: ${workflowId})`);
    console.log(`   Total Planned Tasks: ${planRes.data.workflow.taskIds?.length}`);

    // Execute first root task (customer_persona_agent)
    const execRes = await request({
      path: `/api/workflows/${workflowId}/execute-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (execRes.status !== 200) throw new Error(`Workflow execution failed: ${JSON.stringify(execRes.data)}`);
    console.log(`   ✅ Executed Root Task: "${execRes.data.task?.title}" (Agent: ${execRes.data.task?.agentType})`);
    console.log(`   Task Status: "${execRes.data.task?.status}", Verification Score: ${execRes.data.task?.verificationScore}%`);
    console.log(`   Workflow Progress: ${execRes.data.workflowProgress}%`);

    // 11. Verify Agent Registry API includes all 13 specialized agents
    console.log('\n1️⃣1️⃣ Verifying Full Specialized Agent Registry (13 Registered Agents)...');
    const agentsRes = await request({
      path: '/api/agents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (agentsRes.status !== 200) throw new Error('Fetch agents failed');
    const agentIds = agentsRes.data.agents.map((a: any) => a.agentId);
    console.log(`   Total Registered Agents in Registry: ${agentIds.length}`);
    console.log(`   Agents List:`, agentIds);

    const requiredAgents = [
      'resume_agent',
      'job_matching_agent',
      'company_research_agent',
      'interview_agent',
      'customer_persona_agent',
      'market_research_agent',
      'competitor_agent',
      'business_model_agent',
      'mvp_strategy_agent',
      'strategy_agent',
      'content_agent',
      'skill_gap_agent',
      'verification_agent',
    ];

    const allPresent = requiredAgents.every((id) => agentIds.includes(id));
    if (!allPresent) {
      throw new Error('Some expected agents are missing from registry');
    }
    console.log('   ✅ Confirmed all 13 specialized agents registered and synchronized with database.');

    console.log('\n✨ ALL MODULE 7 TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err: any) {
    console.error('\n❌ Module 7 Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runModule7Tests();
