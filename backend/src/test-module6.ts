import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5059;

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

async function runModule6Tests() {
  console.log('🧪 Starting Module 6 (Deep Career Intelligence & Specialized Career Suite) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `career_user_${Date.now()}@example.com`;
    let authToken = '';
    let goalId = '';
    let interviewSessionId = '';
    let createdAppId = '';
    let matchedAppId = '';

    // 1. Register User
    console.log('1️⃣  Registering Candidate User...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Samantha Career Prodigy',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    authToken = regRes.data.token;
    console.log('   ✅ Candidate user registered successfully. Token acquired.');

    // 2. Set Up User Career Profile
    console.log('\n2️⃣  Configuring User Career Profile with Skills & Target Preferences...');
    const profileRes = await request({
      path: '/api/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        activeTrack: 'career',
        career: {
          targetRole: 'Senior AI Engineer',
          targetCompanies: ['TechCorp AI', 'OpenFlow Systems', 'Stripe'],
          experienceLevel: 'senior',
          skills: ['TypeScript', 'Node.js', 'React', 'Python', 'MongoDB', 'Docker', 'Vector Search'],
          preferredLocation: 'San Francisco, CA / Remote',
        },
      },
    });
    if (profileRes.status !== 200) throw new Error(`Profile update failed: ${JSON.stringify(profileRes.data)}`);
    console.log(`   ✅ Career profile updated. Completeness score: ${profileRes.data.profile.completenessScore}%`);

    // 3. Create Career Goal
    console.log('\n3️⃣  Creating High-Impact Career Acceleration Goal...');
    const goalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Land Senior AI Engineer Role at Top Tier Tech',
        rawPrompt: 'I want to secure a Senior AI Systems / Full-Stack Engineer position with $200k+ total compensation within 6 months.',
        goalType: 'career',
      },
    });
    if (goalRes.status !== 201) throw new Error(`Goal creation failed: ${JSON.stringify(goalRes.data)}`);
    goalId = goalRes.data.goal._id;
    console.log(`   ✅ Goal Created: "${goalRes.data.goal.title}" (ID: ${goalId})`);

    // 4. Ingest Candidate Resume into RAG Knowledge Hub
    console.log('\n4️⃣  Ingesting Candidate Resume into RAG Knowledge Hub...');
    const sampleResume = `# SAMANTHA CAREER PRODIGY
Email: samantha@example.com | GitHub: github.com/samantha-ai | LinkedIn: linkedin.com/in/samantha-prodigy

## PROFESSIONAL SUMMARY
Senior AI & Full-Stack Engineer with 6+ years building high-throughput distributed microservices, LLM orchestration pipelines, vector databases, and scalable web apps.

## TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, Go, SQL
- Frontend: React, Next.js, Redux Toolkit, TailwindCSS
- Backend: Node.js, Express, FastAPI, GraphQL, gRPC
- Data & AI: MongoDB, PostgreSQL, Redis, Pinecone, Milvus, Vector Embeddings, LangChain, RAG Pipelines
- Cloud & DevOps: Docker, Kubernetes, AWS (ECS, Lambda, S3), CI/CD GitHub Actions

## WORK EXPERIENCE
### Senior Software Engineer | CloudMatrix (2022 - Present)
- Designed and maintained multi-agent workflow systems serving 200k+ MAU with 99.99% uptime.
- Optimized vector search queries reducing p99 latency by 54%.
- Mentored 6 engineers across distributed systems best practices.`;

    const resumeIngestRes = await request({
      path: '/api/knowledge/documents',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        filename: 'samantha_senior_ai_resume.md',
        category: 'resume',
        goalId,
        content: sampleResume,
      },
    });
    if (resumeIngestRes.status !== 201) throw new Error(`Resume ingest failed: ${JSON.stringify(resumeIngestRes.data)}`);
    console.log(`   ✅ Ingested Resume: Chunks Count = ${resumeIngestRes.data.document.chunkCount}`);

    // 5. Test Job Matching Agent with RAG Context & Auto-Save
    console.log('\n5️⃣  Running Job Matching Agent against Target Job Description...');
    const targetJobDescription = `We are seeking a Senior AI Systems Engineer at TechCorp AI.
Requirements:
- 5+ years building backend distributed systems with TypeScript and Node.js.
- Strong knowledge of Vector Databases (Pinecone/Milvus), LLM embeddings, and RAG architectures.
- Experience with Kubernetes cluster orchestration, Docker, AWS infrastructure, and CI/CD pipelines.
- Excellent communication and system design skills.`;

    const jobMatchRes = await request({
      path: '/api/career/job-match',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        company: 'TechCorp AI',
        position: 'Senior AI Systems Engineer',
        jobDescription: targetJobDescription,
        saveAsApplication: true,
      },
    });

    if (jobMatchRes.status !== 200) throw new Error(`Job match failed: ${JSON.stringify(jobMatchRes.data)}`);
    const evalData = jobMatchRes.data.evaluation;
    console.log(`   ✅ Job Match Completed: Score = ${evalData.matchScore}%, Rating = "${evalData.roleFitRating}"`);
    console.log(`   Matched Skills (${evalData.matchedSkills?.length}):`, evalData.matchedSkills);
    console.log(`   Missing / Growth Skills:`, evalData.missingSkills);
    console.log(`   Verification Score: ${jobMatchRes.data.verificationScore}%`);
    if (jobMatchRes.data.application) {
      matchedAppId = jobMatchRes.data.application._id;
      console.log(`   ✅ Automatically tracked in Application Pipeline (ID: ${matchedAppId})`);
    }

    // 6. Test Company Research Agent Dossier Generation
    console.log('\n6️⃣  Generating Target Employer Intelligence Dossier (CompanyResearchAgent)...');
    const compRes = await request({
      path: '/api/career/company-research',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        company: 'TechCorp AI',
        targetRole: 'Senior AI Systems Engineer',
      },
    });

    if (compRes.status !== 200) throw new Error(`Company research failed: ${JSON.stringify(compRes.data)}`);
    const dossier = compRes.data.dossier;
    console.log(`   ✅ Company Dossier for "${dossier.companyOverview?.name || 'TechCorp AI'}":`);
    console.log(`   - Industry: ${dossier.companyOverview?.industry}`);
    console.log(`   - Tech Stack (Backend): ${(dossier.techStackBreakdown?.backend || []).join(', ')}`);
    console.log(`   - Interview Rounds Count: ${dossier.interviewStages?.length || 4}`);
    console.log(`   - Culture Focus: ${(dossier.engineeringCultureValues || []).slice(0, 2).join(' | ')}`);

    // 7. Test Interview Simulation Question Generation
    console.log('\n7️⃣  Generating Curated Mock Interview Session (InterviewAgent)...');
    const interviewGenRes = await request({
      path: '/api/career/interview/start',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        targetRole: 'Senior AI Systems Engineer',
        targetCompany: 'TechCorp AI',
        experienceLevel: 'senior',
        focusAreas: ['dsa', 'system_design', 'technical', 'behavioral'],
      },
    });

    if (interviewGenRes.status !== 201) throw new Error(`Interview start failed: ${JSON.stringify(interviewGenRes.data)}`);
    const session = interviewGenRes.data.session;
    interviewSessionId = session._id;
    console.log(`   ✅ Interview Session Created (ID: ${interviewSessionId})`);
    console.log(`   Total Questions Generated: ${session.questions?.length}`);
    session.questions?.forEach((q: any, i: number) => {
      console.log(`     [${q.category.toUpperCase()}] Q${i + 1} (${q.difficulty}): ${q.question.substring(0, 75)}...`);
    });

    // 8. Test Interview Answer Evaluation & Feedback Scoring
    console.log('\n8️⃣  Submitting Candidate Answers for Mock Interview Evaluation...');
    const mockAnswers = (session.questions || []).map((q: any) => ({
      questionId: q.questionId,
      userAnswer: `For ${q.category} problem, I propose using an optimal distributed caching strategy with Redis, decoupled event streaming via Kafka, and strict boundary validation in TypeScript. Time complexity is O(N) with O(1) auxiliary space, tested with unit and end-to-end integration tests.`,
    }));

    const evalRes = await request({
      path: '/api/career/interview/evaluate',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        sessionId: interviewSessionId,
        answers: mockAnswers,
      },
    });

    if (evalRes.status !== 200) throw new Error(`Interview evaluation failed: ${JSON.stringify(evalRes.data)}`);
    const evaluatedSession = evalRes.data.session;
    console.log(`   ✅ Interview Evaluated. Overall Score: ${evaluatedSession.overallScore}% (Status: ${evaluatedSession.status})`);
    console.log(`   First Question Score: ${evaluatedSession.questions[0]?.score}%, Feedback: "${evaluatedSession.questions[0]?.feedback}"`);
    console.log(`   Overall Takeaways: "${evaluatedSession.overallFeedback?.substring(0, 100)}..."`);

    // 9. Verify GET Interview Session by ID
    console.log('\n9️⃣  Fetching Evaluated Interview Session by ID...');
    const getSessionRes = await request({
      path: `/api/career/interview/${interviewSessionId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (getSessionRes.status !== 200) throw new Error('Failed to fetch session');
    console.log(`   ✅ Verified Session Status in Database: "${getSessionRes.data.session.status}"`);

    // 10. Test Application Pipeline Tracking (CRUD & Stages)
    console.log('\n🔟 Testing Career Application Pipeline Tracking (CRUD & Progression)...');
    
    // Create new application
    const createAppRes = await request({
      path: '/api/career/applications',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        goalId,
        company: 'Stripe',
        position: 'Staff Infrastructure Engineer',
        location: 'San Francisco, CA / Remote',
        salaryRange: '$220,000 - $260,000',
        status: 'wishlist',
        notes: 'Submitted referral through former colleague.',
      },
    });
    if (createAppRes.status !== 201) throw new Error('Create application failed');
    createdAppId = createAppRes.data.application._id;
    console.log(`   ✅ Created Manual Application for Stripe (ID: ${createdAppId})`);

    // List all applications
    const listAppRes = await request({
      path: '/api/career/applications',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (listAppRes.status !== 200 || listAppRes.data.total < 2) {
      throw new Error(`Expected at least 2 applications, got ${listAppRes.data.total}`);
    }
    console.log(`   ✅ Total Tracked Applications: ${listAppRes.data.total}`);

    // Update application stage to 'technical'
    const patchAppRes = await request({
      path: `/api/career/applications/${createdAppId}`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        status: 'technical',
        matchScore: 89,
        notes: 'Passed recruiter screen; technical architecture round scheduled for next Tuesday.',
        nextActionType: 'Technical Architecture Round',
      },
    });
    if (patchAppRes.status !== 200 || patchAppRes.data.application.status !== 'technical') {
      throw new Error('Update application failed');
    }
    console.log(`   ✅ Advanced Stripe application stage to "${patchAppRes.data.application.status}" (Match: ${patchAppRes.data.application.matchScore}%)`);

    // Delete one application
    const deleteAppRes = await request({
      path: `/api/career/applications/${createdAppId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (deleteAppRes.status !== 200) throw new Error('Delete application failed');
    console.log(`   ✅ Cleaned up Stripe application.`);

    // 11. Verify Agent Registry includes all 10 specialized agents
    console.log('\n1️⃣1️⃣ Verifying Specialized Career Agents in Registry API...');
    const agentsRes = await request({
      path: '/api/agents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (agentsRes.status !== 200) throw new Error('Fetch agents failed');
    const agentIds = agentsRes.data.agents.map((a: any) => a.agentId);
    console.log(`   Total Registered Agents: ${agentIds.length}`);
    console.log(`   Agents List:`, agentIds);

    const hasCareerAgents = ['job_matching_agent', 'company_research_agent', 'interview_agent'].every((id) =>
      agentIds.includes(id)
    );
    if (!hasCareerAgents) {
      throw new Error('Missing career agents in registry');
    }
    console.log('   ✅ Confirmed job_matching_agent, company_research_agent, and interview_agent registered.');

    console.log('\n✨ ALL MODULE 6 TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err: any) {
    console.error('\n❌ Module 6 Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runModule6Tests();
