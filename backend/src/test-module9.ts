import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5062;

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

async function runModule9BackendTests() {
  console.log('🧪 Starting Module 9 (Analytics & Notifications Backend APIs) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `dashboard_user_${Date.now()}@example.com`;
    let authToken = '';
    let notifId = '';

    // 1. Register User
    console.log('1️⃣  Registering User for Dashboard Testing...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Jordan Dashboard Lead',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    authToken = regRes.data.token;
    console.log('   ✅ Registered user successfully. Token acquired.');

    // 2. Query Analytics Overview
    console.log('\n2️⃣  Fetching Platform Analytics Overview (/api/analytics/overview)...');
    const overviewRes = await request({
      path: '/api/analytics/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (overviewRes.status !== 200) throw new Error(`Analytics overview failed: ${JSON.stringify(overviewRes.data)}`);
    const ov = overviewRes.data.overview;
    console.log(`   ✅ Analytics Overview Fetched:`);
    console.log(`     - Workflow Success Rate: ${ov.workflowSuccessRate}%`);
    console.log(`     - Total Tokens Processed: ${ov.totalTokensProcessed}`);
    console.log(`     - Estimated Cost: ${ov.estimatedCostUsd}`);
    console.log(`     - Avg Execution Time: ${ov.avgExecutionTimeSec}`);

    // 3. Query Per-Agent Analytics
    console.log('\n3️⃣  Fetching Per-Agent Performance Breakdown (/api/analytics/agents)...');
    const agentStatsRes = await request({
      path: '/api/analytics/agents',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (agentStatsRes.status !== 200 || agentStatsRes.data.totalAgents < 13) {
      throw new Error(`Expected at least 13 agents, got ${agentStatsRes.data.totalAgents}`);
    }
    console.log(`   ✅ Total Analyzed Agents: ${agentStatsRes.data.totalAgents}`);
    agentStatsRes.data.agents.slice(0, 4).forEach((a: any) => {
      console.log(`     - [${a.category.toUpperCase()}] ${a.name} -> Success: ${a.successRate}%, Latency: ${a.avgDurationMs}ms`);
    });

    // 4. Create Notification
    console.log('\n4️⃣  Triggering User Notification (POST /api/notifications)...');
    const createNotifRes = await request({
      path: '/api/notifications',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Task Milestone Reached',
        message: 'Resume & Profile Deep Scan agent has finished evaluation with 92% verification score.',
        type: 'milestone_reached',
        linkUrl: '/workflows/123',
      },
    });
    if (createNotifRes.status !== 201) throw new Error(`Create notification failed: ${JSON.stringify(createNotifRes.data)}`);
    notifId = createNotifRes.data.notification._id;
    console.log(`   ✅ Notification Created: "${createNotifRes.data.notification.title}" (ID: ${notifId})`);

    // 5. List Notifications & Unread Count
    console.log('\n5️⃣  Fetching Notifications List & Unread Count (/api/notifications)...');
    const listNotifRes = await request({
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (listNotifRes.status !== 200 || listNotifRes.data.unreadCount !== 1) {
      throw new Error(`Expected unreadCount=1, got ${listNotifRes.data.unreadCount}`);
    }
    console.log(`   ✅ Total Notifications: ${listNotifRes.data.total}, Unread Count: ${listNotifRes.data.unreadCount}`);

    // 6. Mark Notification as Read
    console.log('\n6️⃣  Marking Notification as Read (PATCH /api/notifications/:id/read)...');
    const readNotifRes = await request({
      path: `/api/notifications/${notifId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (readNotifRes.status !== 200 || !readNotifRes.data.notification.isRead) {
      throw new Error(`Failed to mark read: ${JSON.stringify(readNotifRes.data)}`);
    }
    console.log(`   ✅ Notification Marked as Read in Database.`);

    console.log('\n✨ ALL MODULE 9 BACKEND TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err: any) {
    console.error('\n❌ Module 9 Backend Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runModule9BackendTests();
