import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5057;

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

async function runModule4Tests() {
  console.log('🧪 Starting Module 4 (Agent Core & Task Runner Engine) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `agent_engine_${Date.now()}@example.com`;
    let authToken = '';

    // 1. Register User
    console.log('1️⃣  Registering User for Agent Execution...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Jordan Agent Engineer',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error('Registration failed');
    authToken = regRes.data.token;

    // 2. Verify Agent Registry Endpoint (GET /api/agents)
    console.log('\n2️⃣  Verifying Central Agent Registry (GET /api/agents)...');
    const agentsRes = await request({
      path: '/api/agents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Registered Agents Count: ${agentsRes.data.agents?.length}`);
    const agentIds = (agentsRes.data.agents || []).map((a: any) => a.agentId);
    console.log(`   Agents: [ ${agentIds.join(', ')} ]`);
    if (agentsRes.status !== 200 || agentIds.length < 5) {
      throw new Error('Agent registry verification failed');
    }

    // 3. Create Goal & Generate DAG
    console.log('\n3️⃣  Creating Goal & Generating DAG Task Plan...');
    const goalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Senior AI Engineer Job at Top Tech',
        rawPrompt: 'I want to land a Senior AI Engineer position within 6 months.',
        goalType: 'career',
      },
    });
    const goalId = goalRes.data.goal._id;

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
    const initialTasks = planRes.data.tasks;
    console.log(`   Workflow Created: "${planRes.data.workflow.title}" (ID: ${workflowId})`);
    console.log(`   Tasks Created: ${initialTasks.length}`);

    // 4. Execute Step 1 via POST /api/workflows/:id/execute-next
    console.log('\n4️⃣  Executing Step 1 (POST /api/workflows/:id/execute-next)...');
    const step1Res = await request({
      path: `/api/workflows/${workflowId}/execute-next`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${step1Res.status}, Message: "${step1Res.data.message}"`);
    console.log(`   Executed Task: "${step1Res.data.task?.title}" (${step1Res.data.task?.agentType})`);
    console.log(`   Task Verification Score: ${step1Res.data.task?.verificationScore}%`);
    console.log(`   Execution Duration: ${step1Res.data.task?.executionTimeMs}ms`);
    console.log(`   Updated Workflow Progress: ${step1Res.data.workflowProgress}%`);
    if (step1Res.status !== 200 || step1Res.data.task?.status !== 'completed') {
      throw new Error('Step 1 execution failed');
    }
    const executedTaskId = step1Res.data.task._id;

    // 5. Verify Telemetry in AgentRun collection
    console.log('\n5️⃣  Verifying Execution Telemetry (GET /api/workflows/:id/tasks/:taskId/runs)...');
    const runsRes = await request({
      path: `/api/workflows/${workflowId}/tasks/${executedTaskId}/runs`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Agent Runs Recorded: ${runsRes.data.runs?.length}`);
    console.log(`   Run Status: ${runsRes.data.runs?.[0]?.status}, Agent: ${runsRes.data.runs?.[0]?.agentId}`);
    if (runsRes.status !== 200 || runsRes.data.runs?.length === 0) {
      throw new Error('Telemetry verification failed');
    }

    // 6. Run Entire Workflow to Completion via POST /api/workflows/:id/run
    console.log('\n6️⃣  Running Autonomous Workflow Pipeline (POST /api/workflows/:id/run)...');
    const runAllRes = await request({
      path: `/api/workflows/${workflowId}/run`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${runAllRes.status}`);
    console.log(`   Executed Completed Tasks: ${runAllRes.data.completedTasksCount}`);
    console.log(`   Workflow Status: ${runAllRes.data.workflowStatus}`);
    console.log(`   Final Progress: ${runAllRes.data.progress}%`);
    if (runAllRes.status !== 200 || runAllRes.data.progress !== 100 || runAllRes.data.workflowStatus !== 'completed') {
      throw new Error('Autonomous workflow execution failed');
    }

    console.log('\n======================================================');
    console.log('✅ ALL MODULE 4 (AGENT CORE & RUNNER ENGINE) TESTS PASSED!');
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('\n❌ Module 4 Test Error:', error.message);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runModule4Tests();
