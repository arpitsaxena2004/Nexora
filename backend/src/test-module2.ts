import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5055;

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

async function runTests() {
  console.log('🧪 Starting Module 2 End-to-End API Tests...\n');

  const server = app.listen(PORT);
  // Wait for server boot
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `agentflow_test_${Date.now()}@example.com`;
    let authToken = '';
    let goalId = '';

    // 1. Test Healthcheck
    console.log('1️⃣  Testing Health Check (GET /api/health)...');
    const healthRes = await request({ path: '/api/health', method: 'GET' });
    console.log(`   Status: ${healthRes.status}, Service: ${healthRes.data.service}`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    // 2. Test User Registration
    console.log('\n2️⃣  Testing User Registration (POST /api/auth/register)...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Alex Developer',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    console.log(`   Status: ${regRes.status}, Message: ${regRes.data.message}`);
    if (regRes.status !== 201 || !regRes.data.token) throw new Error('Registration failed');
    authToken = regRes.data.token;

    // 3. Test User Login
    console.log('\n3️⃣  Testing User Login (POST /api/auth/login)...');
    const loginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    console.log(`   Status: ${loginRes.status}, User: ${loginRes.data.user?.name}`);
    if (loginRes.status !== 200) throw new Error('Login failed');

    // 4. Test Current User Profile (GET /api/auth/me)
    console.log('\n4️⃣  Testing Authenticated Me Endpoint (GET /api/auth/me)...');
    const meRes = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${meRes.status}, Role: ${meRes.data.user?.role}`);
    if (meRes.status !== 200) throw new Error('Get Me failed');

    // 5. Test API Keys Update (PUT /api/auth/api-keys)
    console.log('\n5️⃣  Testing API Keys Update (PUT /api/auth/api-keys)...');
    const keysRes = await request({
      path: '/api/auth/api-keys',
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        gemini: 'AIzaSyDemoKeyMock12345',
      },
    });
    console.log(`   Status: ${keysRes.status}, Configured:`, keysRes.data.configured);
    if (keysRes.status !== 200 || !keysRes.data.configured.gemini) throw new Error('API Keys update failed');

    // 6. Test Profile Retrieval (GET /api/profile)
    console.log('\n6️⃣  Testing Profile Retrieval (GET /api/profile)...');
    const profileRes = await request({
      path: '/api/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${profileRes.status}, ActiveTrack: ${profileRes.data.profile?.activeTrack}`);
    if (profileRes.status !== 200) throw new Error('Get Profile failed');

    // 7. Test Profile Update & Completeness Score (PUT /api/profile)
    console.log('\n7️⃣  Testing Profile Update & Completeness Score (PUT /api/profile)...');
    const updateProfileRes = await request({
      path: '/api/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        activeTrack: 'career',
        career: {
          targetRole: 'Full Stack AI Engineer',
          skills: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'LangChain', 'Python'],
          experienceLevel: 'mid',
          targetCompanies: ['Google', 'OpenAI', 'Anthropic', 'Stripe'],
          education: [
            {
              institution: 'State University',
              degree: 'B.Tech Computer Science',
              startYear: 2020,
              endYear: 2024,
            },
          ],
        },
      },
    });
    console.log(`   Status: ${updateProfileRes.status}, Completeness Score: ${updateProfileRes.data.profile?.completenessScore}%`);
    if (updateProfileRes.status !== 200 || updateProfileRes.data.profile?.completenessScore <= 0) {
      throw new Error('Update profile failed or score not calculated');
    }

    // 8. Test Goal Creation (POST /api/goals)
    console.log('\n8️⃣  Testing Goal Creation (POST /api/goals)...');
    const goalRes = await request({
      path: '/api/goals',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Land Senior AI Engineer Role',
        rawPrompt: 'I want to get a Senior AI Engineer position at a Tier-1 tech company within 6 months.',
        goalType: 'career',
      },
    });
    console.log(`   Status: ${goalRes.status}, Goal Title: "${goalRes.data.goal?.title}", ID: ${goalRes.data.goal?._id}`);
    if (goalRes.status !== 201 || !goalRes.data.goal?._id) throw new Error('Goal creation failed');
    goalId = goalRes.data.goal._id;

    // 9. Test Goals List (GET /api/goals)
    console.log('\n9️⃣  Testing Goals List (GET /api/goals)...');
    const listGoalsRes = await request({
      path: '/api/goals',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${listGoalsRes.status}, Total Goals: ${listGoalsRes.data.goals?.length}`);
    if (listGoalsRes.status !== 200 || listGoalsRes.data.goals?.length === 0) throw new Error('List goals failed');

    // 10. Test Goal Detail (GET /api/goals/:id)
    console.log('\n🔟 Testing Goal Detail (GET /api/goals/:id)...');
    const getGoalRes = await request({
      path: `/api/goals/${goalId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`   Status: ${getGoalRes.status}, Goal Status: ${getGoalRes.data.goal?.status}`);
    if (getGoalRes.status !== 200) throw new Error('Get single goal failed');

    console.log('\n==============================================');
    console.log('✅ ALL MODULE 2 INTEGRATION TESTS PASSED 100%!');
    console.log('==============================================\n');
  } catch (error: any) {
    console.error('\n❌ Test Error:', error.message);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
