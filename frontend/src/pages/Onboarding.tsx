import React, { useState } from 'react';
import { goalsApi } from '../services/api';
import { Sparkles, Target, ArrowRight, CheckCircle2, HelpCircle, Bot, Loader2 } from 'lucide-react';

interface OnboardingProps {
  onNavigate: (tab: string, context?: any) => void;
  setActiveGoalTitle: (title: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onNavigate, setActiveGoalTitle }) => {
  const [goalType, setGoalType] = useState<string>('career');
  const [title, setTitle] = useState<string>('');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzedGoal, setAnalyzedGoal] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'input' | 'analyzed' | 'planning'>('input');

  const presets = [
    {
      type: 'career',
      title: 'Senior AI & Full-Stack Engineer at Top Tier Tech',
      prompt: "I want to secure a Senior AI Systems / Full-Stack Engineer position at a top-tier tech firm within 6 months. I have React and Node.js projects, but need structured ATS resume optimization, LeetCode DSA syllabus, system design prep, and company outreach.",
    },
    {
      type: 'startup',
      title: 'Launch NexusAI Autonomous Agent CRM',
      prompt: "I want to build, validate, and launch NexusAI - an autonomous AI agent CRM for B2B sales teams that automates prospect research, hyper-personalized email sequences, and meeting scheduling.",
    },
  ];

  const handleApplyPreset = (preset: any) => {
    setGoalType(preset.type);
    setTitle(preset.title);
    setRawPrompt(preset.prompt);
  };

  const handleAnalyzeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawPrompt) return;

    try {
      setLoading(true);
      // 1. Create Goal
      const createRes = await goalsApi.create({
        title,
        rawPrompt,
        goalType,
      });
      const goal = createRes.data.goal;

      // 2. Run Dynamic Goal Understanding Agent
      const analyzeRes = await goalsApi.analyze(goal._id);
      setAnalyzedGoal(analyzeRes.data.goal);
      setActiveGoalTitle(goal.title);
      setStep('analyzed');
    } catch (err: any) {
      alert(`Goal Analysis failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleGeneratePlan = async () => {
    if (!analyzedGoal) return;

    try {
      setLoading(true);
      setStep('planning');

      // 1. Submit missing info answers if any
      const answersPayload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      if (answersPayload.length > 0) {
        await goalsApi.answerMissing(analyzedGoal._id, { answers: answersPayload });
      }

      // 2. Trigger AI Orchestrator DAG Task Planner
      const planRes = await goalsApi.createPlan(analyzedGoal._id);
      const workflow = planRes.data.workflow;

      // 3. Navigate to Visual DAG Runner
      onNavigate('workflows', { goalId: analyzedGoal._id, workflowId: workflow._id });
    } catch (err: any) {
      alert(`Plan generation failed: ${err.response?.data?.error || err.message}`);
      setStep('analyzed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Dynamic AI Orchestration Onboarding</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          What is your primary goal?
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Describe what you want to achieve in natural language. The Goal Understanding Agent will analyze missing requirements and assemble a tailored multi-agent team.
        </p>
      </div>

      {step === 'input' && (
        <div className="glass-panel p-6 space-y-6">
          {/* Presets */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">Or choose a benchmark preset:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-3.5 rounded-xl bg-surface-950/50 border border-white/5 hover:border-brand-500/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-brand-300">{p.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 capitalize">{p.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyzeGoal} className="space-y-4">
            {/* Goal Track Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Goal Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['career', 'startup', 'business', 'product_launch'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGoalType(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                      goalType === t
                        ? 'bg-brand-600 text-white border border-brand-400 shadow-glow'
                        : 'bg-surface-950/70 border border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Goal Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Land Senior AI Systems Engineer role"
                className="w-full glass-input text-xs"
                required
              />
            </div>

            {/* Natural Language Prompt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Describe your goal in detail
              </label>
              <textarea
                rows={5}
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Explain what you want to achieve, your current background, timeline constraints, budget, and target outcomes..."
                className="w-full glass-input text-xs leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing Goal Intent with AI...</span>
                </>
              ) : (
                <>
                  <span>Analyze Goal & Extract Requirements</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {step === 'analyzed' && analyzedGoal && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs text-brand-400 font-bold uppercase tracking-wider">Analysis Complete</span>
              <h2 className="text-xl font-bold text-white">{analyzedGoal.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Readiness Score</div>
              <div className="text-2xl font-black text-cyan-400">{analyzedGoal.readinessScore || 74}%</div>
            </div>
          </div>

          {/* Extracted Objective & Target */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-surface-950/60 border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Track & Industry</div>
              <div className="text-xs font-bold text-slate-200 capitalize mt-0.5">
                {analyzedGoal.extractedData?.industry || analyzedGoal.goalType}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-950/60 border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Target Role / ICP</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {analyzedGoal.extractedData?.targetRole || analyzedGoal.extractedData?.targetCustomer || 'General'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-950/60 border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Horizon</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">
                {analyzedGoal.extractedData?.timeHorizon || '6 Months'}
              </div>
            </div>
          </div>

          {/* Missing Information Q&A Flow */}
          {analyzedGoal.missingInformation && analyzedGoal.missingInformation.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <HelpCircle className="h-4 w-4 text-cyan-400" />
                <span>Clarifying Questions for Optimal DAG Task Planning</span>
              </div>
              <div className="space-y-3">
                {analyzedGoal.missingInformation.map((q: any) => (
                  <div key={q.questionId} className="p-3.5 rounded-xl bg-surface-950/70 border border-white/5 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      {q.question}
                    </label>
                    <input
                      type="text"
                      value={answers[q.questionId] || ''}
                      onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full glass-input text-xs py-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep('input')}
              className="text-xs text-slate-400 hover:text-white"
            >
              &larr; Back to Edit
            </button>

            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Multi-Agent DAG Plan...</span>
                </>
              ) : (
                <>
                  <span>Generate Multi-Agent DAG Workflow</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
