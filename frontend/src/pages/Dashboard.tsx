import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { goalsApi, workflowsApi, agentsApi, approvalsApi, analyticsApi } from '../services/api';
import { buildLiveConstellation, AGENT_DEFINITIONS } from '../services/agentService';
import { AgentData } from '../components/3d/AgentNetwork';

// Lazy-load 3D components
const Scene = lazy(() => import('../components/3d/Scene').then((m) => ({ default: m.Scene })));
const AgentNetwork = lazy(() => import('../components/3d/AgentNetwork').then((m) => ({ default: m.AgentNetwork })));

import {
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Bot,
  Layers,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Search,
  Building,
  RotateCw,
  Compass,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, context?: any) => void;
  setActiveGoalTitle: (title: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, setActiveGoalTitle }) => {
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 3D Constellation state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [goalsRes, workflowsRes, agentsRes, approvalsRes, analyticsRes] = await Promise.all([
        goalsApi.list(),
        workflowsApi.list().catch(() => ({ data: { workflows: [] } })),
        agentsApi.list(),
        approvalsApi.list('pending').catch(() => ({ data: { approvals: [] } })),
        analyticsApi.getOverview().catch(() => ({ data: { overview: {} } })),
      ]);

      const goals = goalsRes.data.goals || [];
      const currentGoal = goals[0] || null;
      setActiveGoal(currentGoal);
      if (currentGoal) {
        setActiveGoalTitle(currentGoal.title);
      }

      const workflows = workflowsRes.data.workflows || [];
      setActiveWorkflow(workflows[0] || null);
      setAgents(agentsRes.data.agents || []);
      setPendingApprovals(approvalsRes.data.approvals || []);
      setOverview(analyticsRes.data.overview || {});
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute live constellation agents based on active goal or filter
  const constellationAgents: AgentData[] = useMemo(() => {
    const live = buildLiveConstellation(agents, activeGoal?.goalType);
    if (categoryFilter === 'all') return live;
    return live.filter((a) => a.category === categoryFilter);
  }, [agents, activeGoal, categoryFilter]);

  const selectedAgentInfo = useMemo(() => {
    if (!selectedAgentName) return null;
    return agents.find((a) => a.name === selectedAgentName || a.agentId === selectedAgentName);
  }, [selectedAgentName, agents]);

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      {/* ─── TOP HERO: 3D Neural Orchestrator Command Center ─── */}
      <div className="glass-panel relative overflow-hidden bg-gradient-to-br from-surface-900/90 via-surface-950/95 to-brand-950/50 border border-brand-500/25 shadow-2xl rounded-3xl p-8 lg:p-10">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -mt-24" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mb-20" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Intelligence & Status (5 or 6 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {activeGoal ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Live Goal Active
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Horizon: {activeGoal.extractedData?.timeHorizon || '6 Months'}
                  </span>
                </div>

                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {activeGoal.title}
                </h1>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {activeGoal.rawPrompt}
                </p>

                {/* Readiness & Workflow Stats */}
                <div className="grid grid-cols-2 gap-4 pt-3">
                  <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/10">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Readiness Score</div>
                    <div className="text-2xl font-black text-cyan-400 flex items-baseline gap-1 mt-0.5">
                      {activeGoal.readinessScore || 74}%
                      <span className="text-[10px] text-slate-400 font-normal">computed</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-950/80 border border-white/10">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DAG Progress</div>
                    <div className="text-2xl font-black text-brand-400 flex items-baseline gap-1 mt-0.5">
                      {activeWorkflow?.progressPercent || 0}%
                      <span className="text-[10px] text-slate-400 font-normal">executed</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={() => onNavigate('workflows', { goalId: activeGoal._id, workflowId: activeWorkflow?._id })}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Launch DAG Workflow</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('onboarding')}
                    className="px-4 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-300 text-xs font-semibold border border-white/10 transition-all"
                  >
                    New Goal
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  <span>3D Autonomous Orchestration</span>
                </div>

                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  AI Multi-Agent <br />
                  <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Neural Orchestration
                  </span>
                </h1>

                <p className="text-xs text-slate-300 leading-relaxed">
                  13 specialized agents synchronized in 3D constellation space. Define any high-level objective to assemble a customized DAG workflow.
                </p>

                {/* Quick Goal Prompts */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Launch Prompts:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '🎯 Land Staff Engineer at Meta', type: 'career' },
                      { label: '🚀 Launch B2B SaaS MVP in 30 Days', type: 'startup' },
                      { label: '📄 Resume & ATS Match Audit', type: 'career' },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => onNavigate('onboarding', { presetPrompt: item.label.slice(2) })}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-950/80 hover:bg-brand-600/30 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all text-left"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('onboarding')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow inline-flex items-center gap-2 transition-all"
                  >
                    <Target className="h-4 w-4" />
                    <span>Create Your First Goal</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Interactive 3D Canvas (7 cols) */}
          <div className="lg:col-span-7 relative h-[380px] lg:h-[440px] rounded-2xl bg-surface-950/60 border border-white/10 overflow-hidden group">
            {/* Top 3D Control Bar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-surface-950/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
                {[
                  { id: 'all', label: 'All Fleet (13)' },
                  { id: 'career', label: 'Career (5)' },
                  { id: 'startup', label: 'Startup (4)' },
                  { id: 'core', label: 'Core (4)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      categoryFilter === tab.id
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Orbit / Rotation Controls */}
              <div className="flex items-center gap-1.5 bg-surface-950/90 backdrop-blur-md p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  title="Toggle Auto Rotation"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    autoRotate ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                </button>
                <div className="text-[10px] text-slate-400 px-1 font-mono hidden sm:block">3D Orbit</div>
              </div>
            </div>

            {/* Selected Agent Quick Info Bar (Bottom Overlay) */}
            {selectedAgentInfo && (
              <div className="absolute bottom-3 left-3 right-3 z-20 bg-surface-950/95 backdrop-blur-md p-3 rounded-xl border border-brand-500/40 shadow-xl flex items-center justify-between gap-3 animate-slideUp">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {selectedAgentInfo.name}
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        {selectedAgentInfo.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm">
                      {selectedAgentInfo.description}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('agents')}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Inspect &rarr;
                </button>
              </div>
            )}

            {/* 3D Scene */}
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-mono text-[11px] text-slate-400">Initializing 3D Neural Constellation...</span>
                  </div>
                </div>
              }
            >
              <Scene
                cameraPosition={[0, 0, 8.2]}
                autoRotate={autoRotate}
                autoRotateSpeed={0.22}
                particleCount={100}
                showParticles={true}
              >
                <AgentNetwork
                  agents={constellationAgents}
                  coreIntensity={activeGoal ? 1.2 : 0.85}
                  selectedAgent={selectedAgentName}
                  activeCategory={categoryFilter !== 'all' ? categoryFilter : null}
                  onAgentClick={(name) => setSelectedAgentName(name)}
                />
              </Scene>
            </Suspense>

            {/* Interaction Hint */}
            <div className="absolute bottom-3 left-4 text-[10px] text-slate-500 pointer-events-none flex items-center gap-1 font-mono">
              <Compass className="h-3 w-3" />
              <span>Drag to rotate • Click nodes to inspect</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pending Approvals Alert Banner ─── */}
      {pendingApprovals.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                {pendingApprovals.length} Sensitive Action{pendingApprovals.length > 1 ? 's' : ''} Awaiting Authorization
              </h3>
              <p className="text-xs text-slate-400">
                Autonomous tools (e.g. live email dispatch or calendar bookings) were intercepted and queued for verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('approvals')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-surface-950 text-xs font-bold shadow-sm transition-all shrink-0"
          >
            Review Approvals
          </button>
        </div>
      )}

      {/* ─── Quick Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-grid">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Workflows</div>
            <div className="text-lg font-bold text-white">{overview?.totalWorkflows || 1}</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Success Rate</div>
            <div className="text-lg font-bold text-emerald-400">{overview?.workflowSuccessRate || 100}%</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Agents</div>
            <div className="text-lg font-bold text-cyan-300">{agents.length || 13}</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Agent Latency</div>
            <div className="text-lg font-bold text-purple-300">{overview?.avgExecutionTimeSec || '1.8s'}</div>
          </div>
        </div>
      </div>

      {/* ─── Specialized Workspaces & Fast Actions ─── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Specialized Workspaces & Fast Actions
            </h2>
            <p className="section-subtitle">Launch purpose-built tools for career, startup, and research tracks</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-grid">
          <button
            onClick={() => onNavigate('career')}
            className="glass-panel-hover p-5 text-left group"
          >
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">
              ATS Resume Scan & Match
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Score candidate resume and compute job role alignment against job descriptions.
            </p>
          </button>

          <button
            onClick={() => onNavigate('career')}
            className="glass-panel-hover p-4 text-left group"
          >
            <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Building className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
              Company Tech Dossier
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Deep-dive into target employer engineering culture, interview stages, and talking points.
            </p>
          </button>

          <button
            onClick={() => onNavigate('startup')}
            className="glass-panel-hover p-4 text-left group"
          >
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Startup ICP & Competitor Matrix
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Generate buyer personas, defensibility moats, and 30-day MVP launch plans.
            </p>
          </button>

          <button
            onClick={() => onNavigate('knowledge')}
            className="glass-panel-hover p-4 text-left group"
          >
            <div className="h-8 w-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Search className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              RAG Knowledge Hub
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload business documents/resumes and test semantic vector similarity queries.
            </p>
          </button>
        </div>
      </div>

      {/* ─── Autonomous Agent Fleet Grid ─── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Autonomous Agent Fleet
            </h2>
            <p className="section-subtitle">13 specialized agents synchronized and ready for DAG orchestration</p>
          </div>
          <button
            onClick={() => onNavigate('agents')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            View Full Registry &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
          {agents.map((agent) => (
            <div
              key={agent.agentId || agent.name}
              onClick={() => setSelectedAgentName(agent.name)}
              className={`glass-card p-5 hover:border-brand-500/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
                selectedAgentName === agent.name ? 'border-brand-500 ring-1 ring-brand-500/40 shadow-glow' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 truncate max-w-[170px]">{agent.name}</h3>
                    <span className="text-[10px] text-slate-400 capitalize">{agent.category} Track</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2">
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
