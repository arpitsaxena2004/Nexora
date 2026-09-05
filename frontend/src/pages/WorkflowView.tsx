import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowsApi } from '../services/api';
import { DAGTask3D } from '../components/3d/WorkflowDAG3D';

// Lazy load 3D scene components
const Scene = lazy(() => import('../components/3d/Scene').then((m) => ({ default: m.Scene })));
const WorkflowDAG3D = lazy(() => import('../components/3d/WorkflowDAG3D').then((m) => ({ default: m.WorkflowDAG3D })));

import {
  Play,
  FastForward,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Bot,
  Layers,
  Loader2,
  Sparkles,
  Check,
  Zap,
  Box,
  LayoutList,
  Compass,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

interface WorkflowViewProps {
  workflowId?: string;
  onNavigate: (tab: string, context?: any) => void;
}

// Default interactive sample DAGs when none exists on backend
const SAMPLE_CAREER_DAG = {
  _id: 'demo_career_workflow',
  title: 'Senior Staff Engineer Career Acceleration Pipeline',
  description: 'Autonomous multi-agent DAG task pipeline for targeted FAANG/Tier-1 employer engineering roles.',
  tasks: [
    {
      _id: 'task_1',
      title: 'ATS Resume Parsing & Semantic Audit',
      agentType: 'resume_agent',
      status: 'completed',
      dependencies: [],
      executionTimeMs: 1420,
      verificationScore: 94,
      description: 'Analyze resume against Staff Engineer job taxonomies and compute semantic match score.',
      outputPayload: {
        score: 94,
        strengths: ['Distributed Systems', 'Kubernetes & Go', 'High-throughput Event Pipelines'],
        targetGaps: ['Add quantifiable cost-saving metrics on AWS architecture'],
      },
    },
    {
      _id: 'task_2',
      title: 'Target Employer Tech Dossier Intel',
      agentType: 'company_research_agent',
      status: 'completed',
      dependencies: ['task_1'],
      executionTimeMs: 1850,
      verificationScore: 91,
      description: 'Deep-dive into employer engineering culture, interview stages, and technical leadership principles.',
      outputPayload: {
        company: 'Google / Meta',
        interviewRounds: ['System Architecture Design (L6)', 'Coding Algorithms', 'Googleyness & Cross-functional Leadership'],
        focusTechnologies: ['Spanner', 'Borg/K8s', 'Kafka/gRPC'],
      },
    },
    {
      _id: 'task_3',
      title: 'Automated Job Match & Role Alignment',
      agentType: 'job_matching_agent',
      status: 'running',
      dependencies: ['task_1', 'task_2'],
      executionTimeMs: null,
      verificationScore: null,
      description: 'Align skillset against open engineering positions and score match vectors.',
      outputPayload: null,
    },
    {
      _id: 'task_4',
      title: 'System Design Mock Interview Generator',
      agentType: 'interview_agent',
      status: 'ready',
      dependencies: ['task_3'],
      executionTimeMs: null,
      verificationScore: null,
      description: 'Synthesize custom dynamic architecture challenge and rubrics based on employer tech stack.',
      outputPayload: null,
    },
    {
      _id: 'task_5',
      title: 'Quality Verification & Application Dispatch',
      agentType: 'verification_agent',
      status: 'pending',
      dependencies: ['task_4'],
      executionTimeMs: null,
      verificationScore: null,
      description: 'Execute multi-agent safety verification before dispatching application dossier.',
      outputPayload: null,
    },
  ],
};

const SAMPLE_STARTUP_DAG = {
  _id: 'demo_startup_workflow',
  title: 'B2B AI Agent SaaS Venture Launchpad',
  description: 'Autonomous venture generation pipeline from market research to 30-day MVP architecture roadmap.',
  tasks: [
    {
      _id: 'st_1',
      title: 'Market Intelligence & Niche Discovery',
      agentType: 'market_research_agent',
      status: 'completed',
      dependencies: [],
      executionTimeMs: 1200,
      verificationScore: 96,
      description: 'Synthesize TAM/SAM metrics and identify unserved customer pain points.',
      outputPayload: {
        tam: '$14.2B',
        fastestGrowingSegment: 'Autonomous Developer Productivity Workflows',
      },
    },
    {
      _id: 'st_2',
      title: 'Defensibility Moat & Competitor Matrix',
      agentType: 'competitor_agent',
      status: 'completed',
      dependencies: ['st_1'],
      executionTimeMs: 1650,
      verificationScore: 89,
      description: 'Map competitor feature matrices and pinpoint defensible differentiation vectors.',
      outputPayload: {
        competitors: ['LangChain', 'CrewAI', 'AutoGen'],
        ourMoat: 'Deterministic DAG Execution + Cryptographic Human Approval Layer',
      },
    },
    {
      _id: 'st_3',
      title: 'B2B Buyer Persona & ICP Synthesis',
      agentType: 'customer_persona_agent',
      status: 'ready',
      dependencies: ['st_2'],
      executionTimeMs: null,
      verificationScore: null,
      description: 'Synthesize ICP personas, willingness to pay, and key buying triggers.',
      outputPayload: null,
    },
    {
      _id: 'st_4',
      title: '30-Day MVP Architecture & Sprint Roadmap',
      agentType: 'mvp_strategy_agent',
      status: 'pending',
      dependencies: ['st_3'],
      executionTimeMs: null,
      verificationScore: null,
      description: 'Generate modular milestone plan, database schemas, and API contracts.',
      outputPayload: null,
    },
  ],
};

export const WorkflowView: React.FC<WorkflowViewProps> = ({ workflowId, onNavigate }) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(SAMPLE_CAREER_DAG);
  const [graphData, setGraphData] = useState<any>(SAMPLE_CAREER_DAG);
  const [selectedTask, setSelectedTask] = useState<any>(SAMPLE_CAREER_DAG.tasks[2]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  const loadWorkflows = async () => {
    try {
      const res = await workflowsApi.list();
      const list = res.data.workflows || [];
      if (list.length > 0) {
        setWorkflows(list);
        const target = workflowId
          ? list.find((w: any) => w._id === workflowId) || list[0]
          : list[0];

        if (target) {
          setSelectedWorkflow(target);
          loadGraph(target._id);
        }
      } else {
        // Use demo sample
        setSelectedWorkflow(SAMPLE_CAREER_DAG);
        setGraphData(SAMPLE_CAREER_DAG);
        setSelectedTask(SAMPLE_CAREER_DAG.tasks[2]);
      }
    } catch (err) {
      console.error('Failed to load workflows, defaulting to demo sample:', err);
      setSelectedWorkflow(SAMPLE_CAREER_DAG);
      setGraphData(SAMPLE_CAREER_DAG);
      setSelectedTask(SAMPLE_CAREER_DAG.tasks[2]);
    }
  };

  const loadGraph = async (id: string) => {
    try {
      const res = await workflowsApi.getGraph(id);
      if (res.data.graph && res.data.graph.tasks?.length > 0) {
        setGraphData(res.data.graph);
        const firstTask = res.data.graph?.tasks?.[0] || null;
        setSelectedTask(firstTask);
      }
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, [workflowId]);

  const handleExecuteNext = async () => {
    // If working on real backend workflow
    if (selectedWorkflow && !selectedWorkflow._id.startsWith('demo_')) {
      try {
        setExecuting(true);
        const res = await workflowsApi.executeNext(selectedWorkflow._id);
        await loadGraph(selectedWorkflow._id);
        const updatedWorkflow = await workflowsApi.get(selectedWorkflow._id);
        setSelectedWorkflow(updatedWorkflow.data.workflow);
        if (res.data.task) {
          setSelectedTask(res.data.task);
        }
      } catch (err: any) {
        alert(`Execution error: ${err.response?.data?.error || err.message}`);
      } finally {
        setExecuting(false);
      }
      return;
    }

    // Demo interactive step simulator
    setExecuting(true);
    setTimeout(() => {
      setGraphData((prev: any) => {
        const tasks = [...prev.tasks];
        const nextPendingIdx = tasks.findIndex((t) => t.status === 'running' || t.status === 'ready');
        if (nextPendingIdx !== -1) {
          tasks[nextPendingIdx] = {
            ...tasks[nextPendingIdx],
            status: 'completed',
            verificationScore: Math.floor(88 + Math.random() * 10),
            executionTimeMs: Math.floor(1100 + Math.random() * 800),
            outputPayload: {
              status: 'success',
              agentOutput: `Synthesized telemetry and verified artifacts for ${tasks[nextPendingIdx].title}`,
              timestamp: new Date().toISOString(),
            },
          };
          setSelectedTask(tasks[nextPendingIdx]);

          // Make subsequent task ready/running
          if (nextPendingIdx + 1 < tasks.length) {
            tasks[nextPendingIdx + 1] = {
              ...tasks[nextPendingIdx + 1],
              status: 'running',
            };
          }
        }
        return { ...prev, tasks };
      });
      setExecuting(false);
    }, 900);
  };

  const handleRunAll = async () => {
    if (selectedWorkflow && !selectedWorkflow._id.startsWith('demo_')) {
      try {
        setExecuting(true);
        await workflowsApi.runAll(selectedWorkflow._id);
        await loadGraph(selectedWorkflow._id);
        const updatedWorkflow = await workflowsApi.get(selectedWorkflow._id);
        setSelectedWorkflow(updatedWorkflow.data.workflow);
      } catch (err: any) {
        alert(`Run all error: ${err.response?.data?.error || err.message}`);
      } finally {
        setExecuting(false);
      }
      return;
    }

    // Demo run all simulator
    setExecuting(true);
    setTimeout(() => {
      setGraphData((prev: any) => {
        const tasks = prev.tasks.map((t: any) => ({
          ...t,
          status: 'completed',
          verificationScore: t.verificationScore || Math.floor(90 + Math.random() * 8),
          executionTimeMs: t.executionTimeMs || Math.floor(1200 + Math.random() * 600),
          outputPayload: t.outputPayload || {
            status: 'success',
            agentOutput: `Verified completion of ${t.title}`,
            timestamp: new Date().toISOString(),
          },
        }));
        setSelectedTask(tasks[tasks.length - 1]);
        return { ...prev, tasks };
      });
      setExecuting(false);
    }, 1400);
  };

  const handleLoadDemoCareer = () => {
    setSelectedWorkflow(SAMPLE_CAREER_DAG);
    setGraphData(SAMPLE_CAREER_DAG);
    setSelectedTask(SAMPLE_CAREER_DAG.tasks[2]);
  };

  const handleLoadDemoStartup = () => {
    setSelectedWorkflow(SAMPLE_STARTUP_DAG);
    setGraphData(SAMPLE_STARTUP_DAG);
    setSelectedTask(SAMPLE_STARTUP_DAG.tasks[1]);
  };

  // Convert graphData tasks to 3D DAG structure
  const dag3dTasks: DAGTask3D[] = useMemo(() => {
    if (!graphData?.tasks) return [];
    return graphData.tasks.map((t: any) => ({
      taskId: t._id || t.id,
      title: t.title,
      agent: t.agentType,
      status: t.status,
      dependencies: t.dependencies || [],
      duration: t.executionTimeMs,
      outputPreview: t.outputPayload ? 'Has Output' : undefined,
    }));
  }, [graphData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <Check className="h-3 w-3" /> Completed
          </span>
        );
      case 'running':
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Running
          </span>
        );
      case 'approval_required':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <ShieldAlert className="h-3 w-3" /> Approval Needed
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-bold">
            Ready
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-800 border border-white/10 text-slate-400 text-[10px] font-medium">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Workflow Header & Controls */}
      <div className="glass-panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-brand-400" />
              Autonomous DAG Execution Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {graphData?.tasks?.length || 0} Planned Tasks
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {selectedWorkflow?.title || 'Workflow Execution Plan'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedWorkflow?.description || 'Autonomous multi-agent DAG task pipeline'}
          </p>
        </div>

        {/* Action Buttons & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Pipeline Switcher */}
          <div className="flex items-center gap-1 bg-surface-950 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleLoadDemoCareer}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                selectedWorkflow?.title?.includes('Career')
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Career DAG
            </button>
            <button
              onClick={handleLoadDemoStartup}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                selectedWorkflow?.title?.includes('Startup') || selectedWorkflow?.title?.includes('SaaS')
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Startup DAG
            </button>
          </div>

          {/* 3D vs 2D Toggle */}
          <div className="flex items-center bg-surface-950 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === '3d'
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D Neural Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === '2d'
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>2D Task List</span>
            </button>
          </div>

          <button
            onClick={handleExecuteNext}
            disabled={executing || graphData?.tasks?.every((t: any) => t.status === 'completed')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
            <span>Execute Next</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={executing || graphData?.tasks?.every((t: any) => t.status === 'completed')}
            className="px-4 py-2 rounded-xl bg-surface-950 border border-white/10 hover:border-brand-500/40 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FastForward className="h-4 w-4" />
            <span>Run All</span>
          </button>
        </div>
      </div>

      {/* Main Execution View: 3D DAG Pipeline or 2D Node Stream + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span>Directed Acyclic Graph (DAG) Tasks</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              {viewMode === '3d' ? '3D Interactive View' : 'Sequential View'}
            </span>
          </div>

          {viewMode === '3d' ? (
            /* 3D DAG Canvas */
            <div className="h-[460px] rounded-2xl glass-panel relative overflow-hidden bg-surface-950/80 border border-brand-500/25">
              <div className="absolute top-3 left-3 z-10 bg-surface-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Compass className="h-3 w-3 text-cyan-400" />
                <span>Drag to Rotate 3D Pipeline • Click Node to Inspect</span>
              </div>

              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading 3D DAG Canvas...</span>
                    </div>
                  </div>
                }
              >
                <Scene
                  cameraPosition={[0, 0.5, 7.5]}
                  autoRotate={false}
                  enableZoom={true}
                  particleCount={100}
                >
                  <WorkflowDAG3D
                    tasks={dag3dTasks}
                    selectedTaskId={selectedTask?._id || selectedTask?.id}
                    onSelectTask={(task3d) => {
                      const fullTask = graphData?.tasks?.find(
                        (t: any) => t._id === task3d.taskId || t.id === task3d.taskId
                      );
                      if (fullTask) setSelectedTask(fullTask);
                    }}
                    onGenerateSample={handleLoadDemoCareer}
                  />
                </Scene>
              </Suspense>
            </div>
          ) : (
            /* 2D DAG List Stream */
            <div className="space-y-3">
              {graphData?.tasks?.map((task: any, index: number) => {
                const isSelected = selectedTask?._id === task._id;
                const isRunning = task.status === 'running' || task.status === 'in_progress';
                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="relative"
                  >
                    {index < graphData.tasks.length - 1 && (
                      <div
                        className={`absolute left-6 top-16 bottom-0 w-[2px] transition-all z-0 -mb-3 ${
                          isRunning
                            ? 'bg-gradient-to-b from-brand-400 via-cyan-400 to-brand-500 animate-pulse'
                            : task.status === 'completed'
                            ? 'bg-emerald-500/40'
                            : 'bg-gradient-to-b from-brand-500/30 to-transparent'
                        }`}
                      />
                    )}

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedTask(task)}
                      className={`glass-panel p-4 cursor-pointer relative z-10 transition-all ${
                        isSelected
                          ? 'border-brand-400 bg-surface-850 shadow-glow'
                          : isRunning
                          ? 'border-brand-500/50 bg-brand-950/20 ring-1 ring-brand-500/30'
                          : 'hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-all ${
                              isRunning
                                ? 'bg-brand-500/30 border border-brand-400 text-white animate-pulse'
                                : task.status === 'completed'
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                : 'bg-brand-500/10 border border-brand-500/30 text-brand-300'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-white">{task.title}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-950 border border-white/5 text-slate-400 font-mono">
                                {task.agentType}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">{getStatusBadge(task.status)}</div>
                      </div>

                      {task.verificationScore && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Quality Verification Score: {task.verificationScore}%</span>
                          </div>
                          {task.executionTimeMs && (
                            <span>Execution Time: {task.executionTimeMs}ms</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Task Output & Inspector Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bot className="h-4 w-4 text-brand-400" />
            <span>Agent Output Inspector</span>
          </h2>

          <AnimatePresence mode="wait">
            {selectedTask ? (
              <motion.div
                key={selectedTask._id || selectedTask.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-5 space-y-4 border-brand-500/30"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                      Agent: {selectedTask.agentType}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{selectedTask.title}</h3>
                  </div>
                  {getStatusBadge(selectedTask.status)}
                </div>

                {/* Task Details */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Description</div>
                    <p className="text-slate-300 leading-relaxed bg-surface-950/60 p-3 rounded-xl border border-white/5">
                      {selectedTask.description}
                    </p>
                  </div>

                  {selectedTask.outputPayload ? (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Synthesized Agent Output</span>
                      </div>
                      <pre className="p-3.5 rounded-xl bg-surface-950/90 border border-white/10 text-[11px] text-slate-200 font-mono overflow-x-auto max-h-80 leading-relaxed">
                        {JSON.stringify(selectedTask.outputPayload, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-xl bg-surface-950/40 border border-dashed border-white/10">
                      <Clock className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">Task has not been executed yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Click "Execute Next" to trigger autonomous execution.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel p-8 text-center text-slate-400 text-xs">
                Select a task from the 3D pipeline to inspect output telemetry.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
