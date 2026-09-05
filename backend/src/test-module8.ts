import http from 'http';
import app from './server';
import mongoose from 'mongoose';

const PORT = 5061;

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

async function runModule8Tests() {
  console.log('🧪 Starting Module 8 (Tool Layer, Automation Engine & Human-in-the-Loop Approval Queue) Integration Tests...\n');

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const testEmail = `automation_user_${Date.now()}@example.com`;
    let authToken = '';
    let emailApprovalId = '';
    let calendarApprovalId = '';

    // 1. Register User
    console.log('1️⃣  Registering User for Automation & Tool Testing...');
    const regRes = await request({
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: 'Alex Tool Operator',
        email: testEmail,
        password: 'securePassword123!',
      },
    });
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    authToken = regRes.data.token;
    console.log('   ✅ Registered user successfully. Token acquired.');

    // 2. Discover Tool Registry
    console.log('\n2️⃣  Querying Tool Registry API for Available Automation Tools...');
    const toolsRes = await request({
      path: '/api/tools',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (toolsRes.status !== 200 || toolsRes.data.total < 4) {
      throw new Error(`Expected at least 4 tools, got ${toolsRes.data.total}`);
    }
    console.log(`   ✅ Total Registered Automation Tools: ${toolsRes.data.total}`);
    toolsRes.data.tools.forEach((t: any) => {
      console.log(`     - [${t.category.toUpperCase()}] "${t.name}": Sensitive = ${t.isSensitive} (${t.displayName})`);
    });

    // 3. Execute Safe Tool 1: Web Search
    console.log('\n3️⃣  Executing Safe Tool: web_search (Live Query & Citation Extraction)...');
    const searchRes = await request({
      path: '/api/tools/execute',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        toolName: 'web_search',
        input: {
          query: 'TypeScript distributed microservices event loop latency',
          topK: 2,
        },
      },
    });
    if (searchRes.status !== 200) throw new Error(`Search failed: ${JSON.stringify(searchRes.data)}`);
    console.log(`   ✅ Search Executed Directly (Requires Approval: ${searchRes.data.result.requiresApproval})`);
    console.log(`   Results Extracted (${searchRes.data.result.output?.resultsCount}):`);
    searchRes.data.result.output?.results?.forEach((r: any, i: number) => {
      console.log(`     [${i + 1}] "${r.title}" (Score: ${(r.relevanceScore * 100).toFixed(0)}%) -> ${r.url}`);
    });

    // 4. Execute Safe Tool 2: GitHub Repository Audit
    console.log('\n4️⃣  Executing Safe Tool: github_action (Repository Health & Architecture Audit)...');
    const ghRes = await request({
      path: '/api/tools/execute',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        toolName: 'github_action',
        input: {
          action: 'audit_repo',
          repoName: 'agentflow/core-engine',
        },
      },
    });
    if (ghRes.status !== 200) throw new Error(`GitHub tool failed: ${JSON.stringify(ghRes.data)}`);
    const ghOutput = ghRes.data.result.output;
    console.log(`   ✅ GitHub Audit Completed: Health Score = ${ghOutput.healthScore}/100`);
    console.log(`   Languages Detected:`, ghOutput.analysis?.languages);
    console.log(`   Recommendations:`, ghOutput.analysis?.recommendations);

    // 5. Test Sensitive Tool Interception: email_dispatch
    console.log('\n5️⃣  Triggering Sensitive Tool: email_dispatch (Permission Manager Interception)...');
    const emailReqRes = await request({
      path: '/api/tools/execute',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        toolName: 'email_dispatch',
        input: {
          recipient: 'hiring-manager@techcorp.com',
          subject: 'Application for Senior AI Systems Engineer - Alex',
          bodyText: 'Hello,\n\nI have attached my tailored resume and portfolio for the Senior AI role.\n\nBest regards,\nAlex',
        },
        approvalTitle: 'Authorize Candidate Application Email Dispatch',
        approvalSummary: 'Dispatching formal outreach email to hiring-manager@techcorp.com',
      },
    });

    if (emailReqRes.status !== 202 || !emailReqRes.data.result.requiresApproval) {
      throw new Error(`Expected 202 Accepted with requiresApproval=true, got: ${JSON.stringify(emailReqRes.data)}`);
    }
    emailApprovalId = emailReqRes.data.approvalId;
    console.log(`   🛑 Intercepted Sensitive Tool Call!`);
    console.log(`   Status: HTTP 202 Accepted, Queued Approval ID: ${emailApprovalId}`);

    // 6. Inspect Pending Approvals Queue
    console.log('\n6️⃣  Querying Human-in-the-Loop Approvals Queue (/api/approvals)...');
    const listApprovalsRes = await request({
      path: '/api/approvals?status=pending',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (listApprovalsRes.status !== 200 || listApprovalsRes.data.pendingCount < 1) {
      throw new Error(`Expected pending approvals, got ${listApprovalsRes.data.pendingCount}`);
    }
    console.log(`   ✅ Pending Approvals in Queue: ${listApprovalsRes.data.pendingCount}`);
    const targetApproval = listApprovalsRes.data.approvals.find((a: any) => a._id === emailApprovalId);
    console.log(`   Verified Queued Record: "${targetApproval.title}" (Action: ${targetApproval.actionType})`);

    // 7. Human User Approval & Execution: email_dispatch
    console.log('\n7️⃣  Simulating Human Approval & Immediate Action Execution (POST /api/approvals/:id/approve)...');
    const approveEmailRes = await request({
      path: `/api/approvals/${emailApprovalId}/approve`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        reviewerNotes: 'Email text reviewed and verified. Authorized to dispatch.',
      },
    });

    if (approveEmailRes.status !== 200) throw new Error(`Approval failed: ${JSON.stringify(approveEmailRes.data)}`);
    const execResult = approveEmailRes.data.executionResult;
    console.log(`   ✅ Human Approval Processed! Tool Execution Result:`);
    console.log(`   - Status: "${execResult.status}", Dispatch ID: ${execResult.dispatchId}`);
    console.log(`   - Recipient: ${execResult.recipient}`);
    console.log(`   - Message: "${execResult.message}"`);

    // 8. Test Sensitive Tool Rejection: calendar_schedule
    console.log('\n8️⃣  Testing Sensitive Tool Interception & Safe Rejection Flow (calendar_schedule)...');
    const calReqRes = await request({
      path: '/api/tools/execute',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        toolName: 'calendar_schedule',
        input: {
          eventTitle: 'Technical Architecture Round - Candidate Interview',
          startTime: '2026-09-10T15:00:00.000Z',
          durationMinutes: 60,
          attendees: ['lead-interviewer@techcorp.com', 'alex@example.com'],
        },
      },
    });
    if (calReqRes.status !== 202) throw new Error('Expected calendar tool interception');
    calendarApprovalId = calReqRes.data.approvalId;
    console.log(`   🛑 Calendar schedule queued with Approval ID: ${calendarApprovalId}`);

    // Reject calendar approval
    const rejectCalRes = await request({
      path: `/api/approvals/${calendarApprovalId}/reject`,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        reviewerNotes: 'Conflict with team demo; candidate requested morning slot.',
      },
    });
    if (rejectCalRes.status !== 200 || rejectCalRes.data.approval.status !== 'rejected') {
      throw new Error(`Rejection failed: ${JSON.stringify(rejectCalRes.data)}`);
    }
    console.log(`   ✅ Action Safely Rejected: "${rejectCalRes.data.approval.reviewerNotes}" (Status: ${rejectCalRes.data.approval.status})`);

    // 9. Test Agent Permission Enforcement
    console.log('\n9️⃣  Testing Agent Tool Whitelist Permission Enforcement...');
    // VerificationAgent does not have email_dispatch permission
    const unauthToolRes = await request({
      path: '/api/tools/execute',
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        toolName: 'email_dispatch',
        agentId: 'verification_agent',
        input: { recipient: 'test@example.com', subject: 'Hi', bodyText: 'Hello' },
      },
    });

    if (unauthToolRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized agent, got ${unauthToolRes.status}`);
    }
    console.log(`   ✅ Permission Guard Blocked Unauthorized Agent Call: "${unauthToolRes.data.error}"`);

    console.log('\n✨ ALL MODULE 8 TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err: any) {
    console.error('\n❌ Module 8 Test Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runModule8Tests();
