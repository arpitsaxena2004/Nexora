import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5058;

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

async function runModule5Tests() {
  console.log('🧪 Starting Module 5 (RAG Knowledge Hub & Multi-Tier Memory Engine) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `rag_memory_user_${Date.now()}@example.com`;
    let authToken = '';
    let goalId = '';
    let resumeDocId = '';
    let businessDocId = '';

    // 1. Register User
    console.log('1️⃣  Registering User for RAG & Memory Testing...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Alex RAG Engineer',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error('Registration failed');
    authToken = regRes.data.token;
    console.log('   ✅ Registered user successfully. Token acquired.');

    // 2. Create Goal
    console.log('\n2️⃣  Creating Career Goal to link with Documents...');
    const goalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Senior AI Engineer at Top Tech',
        rawPrompt: 'I want to land a Senior AI & Full-Stack Engineer role within 6 months.',
        goalType: 'career',
      },
    });
    if (goalRes.status !== 201) throw new Error('Goal creation failed');
    goalId = goalRes.data.goal._id;
    console.log(`   ✅ Goal Created: "${goalRes.data.goal.title}" (ID: ${goalId})`);

    // 3. Ingest Resume Document
    console.log('\n3️⃣  Ingesting Candidate Resume Document into RAG Hub...');
    const sampleResume = `# ALEX RAG ENGINEER
Email: alex.rag@example.com | GitHub: github.com/alex-rag | LinkedIn: linkedin.com/in/alex-rag

## PROFESSIONAL SUMMARY
Senior Full-Stack & AI Systems Engineer with 5+ years building scalable distributed microservices, LLM orchestration pipelines, vector databases, and responsive React/TypeScript user interfaces.

## TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frontend: React, Next.js, Redux Toolkit, TailwindCSS
- Backend: Node.js, Express, FastAPI, GraphQL, gRPC
- Databases & Search: MongoDB, PostgreSQL, Redis, Pinecone, Milvus, Vector Similarity Search
- Cloud & DevOps: Docker, Kubernetes, AWS (ECS, Lambda, S3), CI/CD GitHub Actions
- AI / LLM: LangChain, LlamaIndex, OpenAI API, Gemini API, RAG Pipelines, Multi-Agent Architectures

## WORK EXPERIENCE
### Lead Full-Stack Engineer | CloudMatrix Inc. (2022 - Present)
- Architected enterprise multi-agent workflow orchestration platform serving 150,000+ monthly active users.
- Designed high-throughput vector embedding retrieval engine reducing search latency from 450ms to 42ms.
- Mentored a team of 8 junior and mid-level engineers in distributed systems design and unit testing.

### Software Engineer | DataWave Systems (2019 - 2022)
- Built real-time analytics streaming pipelines using Node.js, Kafka, and MongoDB handling 25M events/day.
- Integrated automated ATS scoring and resume parsing reducing recruiter triage time by 60%.

## EDUCATION
- B.S. in Computer Science, University of California (GPA: 3.85/4.0)`;

    const resumeIngestRes = await request({
      path: '/api/knowledge/documents',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        filename: 'alex_senior_ai_resume.md',
        category: 'resume',
        goalId,
        content: sampleResume,
        maxChunkSize: 350,
        chunkOverlap: 60,
      },
    });

    if (resumeIngestRes.status !== 201) {
      throw new Error(`Resume ingestion failed: ${JSON.stringify(resumeIngestRes.data)}`);
    }
    resumeDocId = resumeIngestRes.data.document._id;
    console.log(`   ✅ Ingested Resume: Chunks Count = ${resumeIngestRes.data.document.chunkCount}, Summary: "${resumeIngestRes.data.document.summary?.substring(0, 80)}..."`);

    // 4. Ingest Business Plan Document
    console.log('\n4️⃣  Ingesting Startup Business Plan Document into RAG Hub...');
    const sampleBusinessPlan = `# NEXUS AI - EXECUTIVE BUSINESS PLAN

## 1. EXECUTIVE SUMMARY
Nexus AI is an autonomous agentic CRM for B2B sales automation. We empower sales teams to orchestrate AI SDR agents that research accounts, draft personalized multi-touch sequences, and automatically schedule qualified meetings.

## 2. MARKET OPPORTUNITY & TAM
- Total Addressable Market (TAM): $48 Billion global CRM & Sales Automation software market.
- Serviceable Addressable Market (SAM): $12 Billion North America & European mid-market B2B tech segment.
- Compound Annual Growth Rate (CAGR): 24.5% projected through 2030.

## 3. PRICING & REVENUE MODEL
- Starter Tier: $99/seat/month for 500 autonomous outreach credits.
- Growth Tier: $299/seat/month for 2,500 credits, multi-agent workflows, and CRM integrations.
- Enterprise: Custom pricing starting at $1,500/month with dedicated vector search and SOC2 compliance.

## 4. COMPETITIVE ADVANTAGES
- Proprietary multi-agent verification loop preventing hallucinated outreach emails.
- Dynamic fine-tuned local embedding models providing 3x faster contextual retrieval than competitors.`;

    const bizIngestRes = await request({
      path: '/api/knowledge/documents',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        filename: 'nexus_ai_business_plan.md',
        category: 'business_plan',
        content: sampleBusinessPlan,
        maxChunkSize: 350,
        chunkOverlap: 60,
      },
    });

    if (bizIngestRes.status !== 201) {
      throw new Error(`Business plan ingestion failed: ${JSON.stringify(bizIngestRes.data)}`);
    }
    businessDocId = bizIngestRes.data.document._id;
    console.log(`   ✅ Ingested Business Plan: Chunks Count = ${bizIngestRes.data.document.chunkCount}`);

    // 5. Query Document Listing & Document Detail
    console.log('\n5️⃣  Verifying Document Index and Chunk Inspector APIs...');
    const listRes = await request({
      path: '/api/knowledge/documents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Total Documents Found: ${listRes.data.documents?.length}`);
    if (listRes.data.documents?.length !== 2) throw new Error('Document listing mismatch');

    const detailRes = await request({
      path: `/api/knowledge/documents/${resumeDocId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Resume Document Chunks in DB: ${detailRes.data.chunks?.length}`);
    if (detailRes.data.chunks?.length === 0) throw new Error('No chunks found for document');

    // 6. Test Semantic Vector Search & Ranking
    console.log('\n6️⃣  Testing Semantic Vector Search (RAG Retrieval Engine)...');
    
    // Query A: Candidate Technical Skills
    const queryARes = await request({
      path: '/api/knowledge/query',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        query: 'React TypeScript Node.js microservices vector database distributed systems',
        goalId,
        topK: 3,
      },
    });
    console.log(`   Query A ("React TypeScript Node.js...") -> Top Chunks: ${queryARes.data.chunksFound}`);
    console.log(`   Top Match Relevance: ${(queryARes.data.chunks[0]?.similarity * 100).toFixed(1)}% from "${queryARes.data.chunks[0]?.sourceFilename}"`);
    if (queryARes.data.chunksFound === 0 || !queryARes.data.chunks[0]?.sourceFilename.includes('resume')) {
      throw new Error('Semantic vector search failed to match resume correctly');
    }

    // Query B: Startup TAM & Pricing
    const queryBRes = await request({
      path: '/api/knowledge/query',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        query: 'Total addressable market TAM pricing tiers subscription enterprise SaaS',
        topK: 3,
      },
    });
    console.log(`   Query B ("TAM pricing enterprise SaaS...") -> Top Chunks: ${queryBRes.data.chunksFound}`);
    console.log(`   Top Match Relevance: ${(queryBRes.data.chunks[0]?.similarity * 100).toFixed(1)}% from "${queryBRes.data.chunks[0]?.sourceFilename}"`);
    if (queryBRes.data.chunksFound === 0 || !queryBRes.data.chunks[0]?.sourceFilename.includes('business_plan')) {
      throw new Error('Semantic vector search failed to match business plan correctly');
    }

    // 7. Verify Multi-Tier Memory Assembly API
    console.log('\n7️⃣  Inspecting 3-Tier Memory API (Short-Term, Long-Term, Knowledge Memory)...');
    const memoryRes = await request({
      path: `/api/knowledge/memory?goalId=${goalId}&query=Full-Stack+Engineer+Resume+Skills`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Memory Short-Term Active Goal: "${memoryRes.data.shortTerm?.activeGoalTitle}"`);
    console.log(`   Memory Knowledge Chunks Found: ${memoryRes.data.knowledge?.chunksFound}`);
    console.log(`   Assembled Prompt Preview:\n   ${memoryRes.data.assembledPromptContext.substring(0, 140)}...`);
    if (!memoryRes.data.assembledPromptContext.includes('KNOWLEDGE BASE')) {
      throw new Error('Memory assembly did not include RAG knowledge base');
    }

    // 8. Execute Agent Workflow with RAG Context Auto-Injection
    console.log('\n8️⃣  Testing End-to-End Workflow Execution with Dynamic RAG Ingestion...');
    await request({
      path: `/api/goals/${goalId}/analyze`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const planRes = await request({
      path: `/api/goals/${goalId}/create-plan`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const workflowId = planRes.data.workflow._id;
    console.log(`   Workflow Created: "${planRes.data.workflow.title}" (ID: ${workflowId})`);

    const runRes = await request({
      path: `/api/workflows/${workflowId}/execute-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Executed Task: "${runRes.data.task?.title}" (${runRes.data.task?.agentType})`);
    console.log(`   Task Status: ${runRes.data.task?.status}, Verification Score: ${runRes.data.task?.verificationScore}%`);
    if (runRes.data.task?.status !== 'completed') {
      throw new Error('Workflow task execution failed with RAG context');
    }

    // 9. Document Deletion Verification
    console.log('\n9️⃣  Verifying Clean Document & Chunk Deletion...');
    const deleteRes = await request({
      path: `/api/knowledge/documents/${businessDocId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (deleteRes.status !== 200) throw new Error('Document deletion failed');
    console.log('   ✅ Business plan document and associated vector chunks cleaned up.');

    console.log('\n✨ ALL MODULE 5 TESTS PASSED SUCCESSFULLY! 🚀\n');
    process.exit(0);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runModule5Tests().catch((err) => {
  console.error('\n❌ Module 5 Test Suite Failed:', err);
  process.exit(1);
});
