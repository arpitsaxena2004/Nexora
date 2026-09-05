import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5056;

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

async function runModule3Tests() {
  console.log('🧪 Starting Module 3 (AI Orchestrator & Goal Analyzer) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `orchestrator_test_${Date.now()}@example.com`;
    let authToken = '';

    // 1. Register User
    console.log('1️⃣  Registering Test User...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Samantha AI Dev',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error('Registration failed');
    authToken = regRes.data.token;

    // 2. Ingest Career Goal
    console.log('\n2️⃣  Creating Career Goal (POST /api/goals)...');
    const careerGoalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Software Engineer at Tier-1 Tech Company',
        rawPrompt: 'I am a final-year CSE student and want to get a software engineering job at a product-based company within six months.',
        goalType: 'career',
      },
    });
    const careerGoalId = careerGoalRes.data.goal._id;
    console.log(`   Goal Created: "${careerGoalRes.data.goal.title}" (ID: ${careerGoalId})`);

    // 3. Trigger Goal Understanding Agent
    console.log('\n3️⃣  Running Goal Understanding Agent (POST /api/goals/:id/analyze)...');
    const analyzeRes = await request({
      path: `/api/goals/${careerGoalId}/analyze`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${analyzeRes.status}`);
    console.log(`   Extracted Target Role: ${analyzeRes.data.goal?.extractedData?.targetRole}`);
    console.log(`   Readiness Score: ${analyzeRes.data.goal?.readinessScore}%`);
    console.log(`   Missing Info Questions: ${analyzeRes.data.goal?.missingInformation?.length}`);
    if (analyzeRes.status !== 200 || !analyzeRes.data.goal?.extractedData) {
      throw new Error('Goal analyzer failed');
    }

    // 4. Trigger AI Task Planner (DAG Generator)
    console.log('\n4️⃣  Generating Multi-Agent DAG Plan (POST /api/goals/:id/create-plan)...');
    const planRes = await request({
      path: `/api/goals/${careerGoalId}/create-plan`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${planRes.status}`);
    console.log(`   Workflow Title: "${planRes.data.workflow?.title}"`);
    console.log(`   Total Generated Tasks: ${planRes.data.tasks?.length}`);
    if (planRes.status !== 201 || !planRes.data.workflow?._id || planRes.data.tasks?.length === 0) {
      throw new Error('Task planner failed to generate workflow');
    }
    const workflowId = planRes.data.workflow._id;

    // 5. Verify Workflow Details & DAG Ready Status
    console.log('\n5️⃣  Checking Workflow Status & Ready Tasks (GET /api/workflows/:id)...');
    const workflowRes = await request({
      path: `/api/workflows/${workflowId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Workflow Status: ${workflowRes.data.workflow?.status}`);
    console.log(`   Ready Tasks Count: ${workflowRes.data.readyTasksCount}`);
    console.log(`   Progress: ${workflowRes.data.progress}%`);
    if (workflowRes.status !== 200 || workflowRes.data.readyTasksCount <= 0) {
      throw new Error('Workflow verification failed: root ready task not found');
    }

    // 6. Verify React Flow Graph Serializer
    console.log('\n6️⃣  Verifying React Flow Graph Serializer (GET /api/workflows/:id/graph)...');
    const graphRes = await request({
      path: `/api/workflows/${workflowId}/graph`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   React Flow Nodes: ${graphRes.data.graph?.nodes?.length}`);
    console.log(`   React Flow Edges: ${graphRes.data.graph?.edges?.length}`);
    if (graphRes.status !== 200 || graphRes.data.graph?.nodes?.length === 0) {
      throw new Error('Graph serialization failed');
    }

    // 7. Test Startup Track Workflow Generation
    console.log('\n7️⃣  Testing Startup Track (Goal -> Analysis -> DAG Plan)...');
    const startupGoalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Launch Restaurant AI Copilot',
        rawPrompt: 'I want to build and launch an AI tool for small restaurants to manage reviews and inventory.',
        goalType: 'startup',
      },
    });
    const startupGoalId = startupGoalRes.data.goal._id;

    await request({
      path: `/api/goals/${startupGoalId}/analyze`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const startupPlanRes = await request({
      path: `/api/goals/${startupGoalId}/create-plan`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Startup Workflow Created: "${startupPlanRes.data.workflow?.title}" with ${startupPlanRes.data.tasks?.length} tasks`);
    if (startupPlanRes.status !== 201) throw new Error('Startup plan generation failed');

    console.log('\n======================================================');
    console.log('✅ ALL MODULE 3 (AI ORCHESTRATOR & DAG) TESTS PASSED!');
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('\n❌ Module 3 Test Error:', error.message);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runModule3Tests();
