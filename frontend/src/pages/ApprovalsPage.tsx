import React, { useState, useEffect } from 'react';
import { approvalsApi, toolsApi } from '../services/api';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'sandbox'>('queue');
  const [feedbackNotes, setFeedbackNotes] = useState<{ [key: string]: string }>({});

  // Tool Sandbox State
  const [selectedTool, setSelectedTool] = useState<string>('web_search');
  const [toolParams, setToolParams] = useState<string>('{\n  "query": "OpenAI latest valuation 2026"\n}');
  const [toolResult, setToolResult] = useState<any>(null);
  const [toolExecuting, setToolExecuting] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await approvalsApi.list('pending');
      setApprovals(res.data.approvals || []);
    } catch (err: any) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTools = async () => {
    try {
      const res = await toolsApi.list();
      setTools(res.data.tools || []);
    } catch (err: any) {
      console.error('Failed to load tools', err);
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchTools();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approvalsApi.approve(id, { userFeedback: feedbackNotes[id] });
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve action');
    }
  };

  const handleReject = async (id: string) => {
    const reason = feedbackNotes[id] || 'Rejected by user';
    try {
      await approvalsApi.reject(id, { reason });
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject action');
    }
  };

  const handleExecuteTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setToolExecuting(true);
    setToolResult(null);
    try {
      const parsed = JSON.parse(toolParams);
      const res = await toolsApi.execute({ toolName: selectedTool, params: parsed });
      setToolResult(res.data);
    } catch (err: any) {
      setToolResult({ error: err.message || 'Execution failed' });
    } finally {
      setToolExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Human-in-the-Loop & Tool Sandbox
          </h1>
          <p className="text-sm text-slate-400">
            Review sensitive agent actions (email dispatches, calendar updates, financial triggers) and test external tools in a controlled environment.
          </p>
        </div>
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'queue' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Approvals ({approvals.length})
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sandbox' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tool Runner Sandbox
          </button>
        </div>
      </div>

      {/* Tab 1: Pending Approvals Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card text-center py-12 text-slate-400 text-sm">Loading pending approval requests...</div>
          ) : approvals.length === 0 ? (
            <div className="card text-center py-16 space-y-2">
              <div className="text-3xl">🎉</div>
              <h3 className="text-base font-semibold text-white">All Clear! No Pending Approvals</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When an autonomous agent invokes a sensitive tool (such as <span className="font-mono text-primary-400">email_dispatch</span> or <span className="font-mono text-primary-400">calendar_schedule</span>), it will pause and appear here for your cryptographic confirmation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map(req => (
                <div key={req._id || req.id} className="card space-y-4 border-amber-500/30 bg-amber-500/[0.02]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                      <span className="badge badge-warning uppercase tracking-wider font-bold">Action Requires Approval</span>
                      <span className="text-xs font-mono text-slate-400">Req #{(req._id || req.id)?.slice(0, 8)}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Agent Dispatched</span>
                      <span className="text-sm text-white font-mono">{req.agentName || req.agentType || 'Autonomous Agent'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Sensitive Action</span>
                      <span className="text-sm font-semibold text-amber-300 font-mono">{req.actionType || req.toolName || 'email_dispatch'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Reasoning & Justification</span>
                      <p className="text-xs text-slate-300 italic">{req.reason || 'Agent requires human confirmation to proceed with external side-effect.'}</p>
                    </div>
                  </div>

                  {/* Payload Details */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action Payload / Context</span>
                    <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify(req.payload || req.parameters || {}, null, 2)}
                    </pre>
                  </div>

                  {/* Feedback & Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Optional feedback or rejection reason..."
                      value={feedbackNotes[req._id || req.id] || ''}
                      onChange={e => setFeedbackNotes({ ...feedbackNotes, [req._id || req.id]: e.target.value })}
                      className="flex-1 w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReject(req._id || req.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req._id || req.id)}
                        className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-glow"
                      >
                        ✓ Approve & Execute
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Tool Runner Sandbox */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 card space-y-4">
            <h2 className="text-base font-semibold text-white">Direct Tool Invocation Sandbox</h2>
            <p className="text-xs text-slate-400">
              Directly execute and test tool schemas across the platform.
            </p>

            <form onSubmit={handleExecuteTool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Tool</label>
                <select
                  value={selectedTool}
                  onChange={e => {
                    setSelectedTool(e.target.value);
                    if (e.target.value === 'web_search') {
                      setToolParams('{\n  "query": "OpenAI latest valuation 2026"\n}');
                    } else if (e.target.value === 'email_dispatch') {
                      setToolParams('{\n  "to": "recruiter@stripe.com",\n  "subject": "Staff Engineer Application",\n  "body": "Hello, attaching my resume for the Staff Engineer opening."\n}');
                    } else if (e.target.value === 'github_action') {
                      setToolParams('{\n  "repo": "arpit/nexora-ai",\n  "action": "list_issues"\n}');
                    } else if (e.target.value === 'calendar_schedule') {
                      setToolParams('{\n  "title": "Strategy Sync",\n  "date": "2026-09-10T15:00:00Z",\n  "durationMinutes": 30\n}');
                    }
                  }}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="web_search">web_search (Live Web Query)</option>
                  <option value="email_dispatch">email_dispatch (Sensitive - SMTP)</option>
                  <option value="github_action">github_action (GitHub API)</option>
                  <option value="calendar_schedule">calendar_schedule (Sensitive - Calendar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">JSON Parameters</label>
                <textarea
                  rows={6}
                  value={toolParams}
                  onChange={e => setToolParams(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={toolExecuting}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {toolExecuting ? 'Executing Tool in Sandbox...' : 'Run Tool in Sandbox'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            {toolResult ? (
              <div className="card space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-white">Execution Result</h3>
                  <span className={`badge ${toolResult.error ? 'badge-danger' : 'badge-success'}`}>
                    {toolResult.error ? 'Execution Error' : 'Success (200 OK)'}
                  </span>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl border border-white/5 overflow-x-auto max-h-[400px]">
                  {JSON.stringify(toolResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="card text-center py-16 text-slate-500 text-sm">
                Select a tool and parameters on the left to test execution live.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
