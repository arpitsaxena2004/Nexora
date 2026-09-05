import React, { useState, useEffect } from 'react';
import { careerApi } from '../services/api';
import {
  Briefcase,
  FileCheck2,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

export const CareerHub: React.FC = () => {
  const [subTab, setSubTab] = useState<'match' | 'company' | 'interview' | 'pipeline'>('match');

  // Job Match State
  const [matchPosition, setMatchPosition] = useState<string>('Senior AI Systems Engineer');
  const [matchCompany, setMatchCompany] = useState<string>('TechCorp AI');
  const [matchDesc, setMatchDesc] = useState<string>(
    'Seeking a Senior AI Systems Engineer with 5+ years building backend microservices with TypeScript, Node.js, and Vector Databases (Pinecone/Milvus). Deep knowledge of Kubernetes, Docker, and system design required.'
  );
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matching, setMatching] = useState<boolean>(false);

  // Company Research State
  const [compName, setCompName] = useState<string>('TechCorp AI');
  const [compRole, setCompRole] = useState<string>('Senior AI Systems Engineer');
  const [compDossier, setCompDossier] = useState<any>(null);
  const [researching, setResearching] = useState<boolean>(false);

  // Interview Simulator State
  const [interviewRole, setInterviewRole] = useState<string>('Senior AI Systems Engineer');
  const [interviewCompany, setInterviewCompany] = useState<string>('TechCorp AI');
  const [interviewSession, setInterviewSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluatingInterview, setEvaluatingInterview] = useState<boolean>(false);
  const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);

  // Application Pipeline State
  const [applications, setApplications] = useState<any[]>([]);
  const [newCompany, setNewCompany] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');

  const loadApplications = async () => {
    try {
      const res = await careerApi.listApplications();
      setApplications(res.data.applications || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleRunJobMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMatching(true);
      const res = await careerApi.jobMatch({
        position: matchPosition,
        company: matchCompany,
        jobDescription: matchDesc,
        saveAsApplication: true,
      });
      setMatchResult(res.data.evaluation);
      loadApplications();
    } catch (err: any) {
      alert(`Job Match failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setMatching(false);
    }
  };

  const handleResearchCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResearching(true);
      const res = await careerApi.companyResearch({
        company: compName,
        targetRole: compRole,
      });
      setCompDossier(res.data.dossier);
    } catch (err: any) {
      alert(`Company research failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setResearching(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      setGeneratingQuestions(true);
      const res = await careerApi.startInterview({
        targetRole: interviewRole,
        targetCompany: interviewCompany,
        experienceLevel: 'senior',
        focusAreas: ['dsa', 'system_design', 'technical', 'behavioral'],
      });
      setInterviewSession(res.data.session);
    } catch (err: any) {
      alert(`Interview generation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleEvaluateInterview = async () => {
    if (!interviewSession) return;
    try {
      setEvaluatingInterview(true);
      const answersPayload = (interviewSession.questions || []).map((q: any) => ({
        questionId: q.questionId,
        userAnswer: answers[q.questionId] || 'I propose using distributed caching with Redis and async worker pools.',
      }));

      const res = await careerApi.evaluateInterview({
        sessionId: interviewSession._id,
        answers: answersPayload,
      });
      setInterviewSession(res.data.session);
    } catch (err: any) {
      alert(`Interview evaluation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setEvaluatingInterview(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole) return;
    try {
      await careerApi.createApplication({
        company: newCompany,
        position: newRole,
        status: 'wishlist',
      });
      setNewCompany('');
      setNewRole('');
      loadApplications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceApp = async (id: string, status: string) => {
    try {
      await careerApi.updateApplication(id, { status });
      loadApplications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      await careerApi.deleteApplication(id);
      loadApplications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[11px] font-bold uppercase tracking-wider">
              Module 6: Career Intelligence Suite
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Career Acceleration & Job Intelligence Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role compatibility scoring, target employer dossiers, mock interview coaching, and application tracking.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-950/80 border border-white/10 shrink-0">
          {[
            { id: 'match', label: 'Job Matcher & ATS', icon: FileCheck2 },
            { id: 'company', label: 'Company Intel', icon: Building },
            { id: 'interview', label: 'Interview Simulator', icon: GraduationCap },
            { id: 'pipeline', label: 'Pipeline Tracker', icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Job Matcher Sub-tab */}
      {subTab === 'match' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-panel p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-brand-400" />
              <span>Evaluate Job Description Match</span>
            </h2>
            <form onSubmit={handleRunJobMatch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Company</label>
                <input
                  type="text"
                  value={matchCompany}
                  onChange={(e) => setMatchCompany(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Position</label>
                <input
                  type="text"
                  value={matchPosition}
                  onChange={(e) => setMatchPosition(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Job Description Requirements</label>
                <textarea
                  rows={5}
                  value={matchDesc}
                  onChange={(e) => setMatchDesc(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={matching}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center justify-center gap-2 transition-all"
              >
                {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Run Job Matching Agent</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 glass-panel p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Job Compatibility Evaluation</span>
            </h2>

            {matchResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-950/80 border border-brand-500/20">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Match Compatibility Score</div>
                    <div className="text-xs text-slate-300 capitalize mt-0.5">Rating: {matchResult.roleFitRating} Fit</div>
                  </div>
                  <div className="text-3xl font-black text-cyan-400">{matchResult.matchScore}%</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Matched Skills ({matchResult.matchedSkills?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedSkills?.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3.5 w-3.5" /> Missing / Growth Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills?.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {matchResult.atsOptimizationAdvice && (
                  <div className="p-3.5 rounded-xl bg-surface-950/60 border border-white/5 space-y-1.5">
                    <div className="text-[11px] font-bold text-brand-300">ATS Optimization Advice</div>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {matchResult.atsOptimizationAdvice.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-12 text-center">
                Submit job requirements to run the deep compatibility scoring engine.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. Company Research Sub-tab */}
      {subTab === 'company' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 glass-panel p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="h-4 w-4 text-brand-400" />
              <span>Target Employer Research</span>
            </h2>
            <form onSubmit={handleResearchCompany} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Company Name</label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Target Position</label>
                <input
                  type="text"
                  value={compRole}
                  onChange={(e) => setCompRole(e.target.value)}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={researching}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center justify-center gap-2 transition-all"
              >
                {researching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Generate Intelligence Dossier</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 glass-panel p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="h-4 w-4 text-cyan-400" />
              <span>Employer Dossier: {compName}</span>
            </h2>

            {compDossier ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/10 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Industry & Headcount</div>
                  <div className="text-sm font-bold text-slate-200">
                    {compDossier.companyOverview?.industry || 'Enterprise Software'} ({compDossier.companyOverview?.estimatedSize || '1,000+ employees'})
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/60 border border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-brand-300">Tech Stack Breakdown</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(compDossier.techStackBreakdown || {}).map(([key, items]: any) => (
                      <div key={key} className="p-2 rounded-lg bg-surface-900 border border-white/5">
                        <div className="text-[10px] font-bold text-slate-400 capitalize">{key}</div>
                        <div className="text-[11px] text-slate-200 mt-0.5">{items.slice(0, 2).join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950/60 border border-white/5 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-300">Interview Pipeline Stages</div>
                  <div className="space-y-1.5">
                    {compDossier.interviewStages?.map((stage: any) => (
                      <div key={stage.round} className="flex items-center justify-between p-2 rounded-lg bg-surface-900 text-xs">
                        <span className="font-semibold text-slate-200">Round {stage.round}: {stage.name}</span>
                        <span className="text-slate-400">{stage.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-12 text-center">
                Search a company to compile tech stack breakdown, hiring bar metrics, and interview advice.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. Interview Simulator Sub-tab */}
      {subTab === 'interview' && (
        <div className="space-y-6">
          {!interviewSession ? (
            <div className="glass-panel p-6 max-w-xl mx-auto space-y-4 text-center">
              <GraduationCap className="h-10 w-10 text-cyan-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Interactive Mock Interview Simulator</h2>
              <p className="text-xs text-slate-400">
                Generate curated DSA, System Design, Technical Stack, and Behavioral STAR questions and receive instant AI answer grading.
              </p>
              <button
                onClick={handleStartInterview}
                disabled={generatingQuestions}
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow inline-flex items-center gap-2 transition-all"
              >
                {generatingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>Generate Mock Question Bank</span>
              </button>
            </div>
          ) : (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Interview Session</span>
                  <h2 className="text-lg font-bold text-white">{interviewSession.targetRole} @ {interviewSession.targetCompany}</h2>
                </div>
                {interviewSession.overallScore && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Overall Score</div>
                    <div className="text-2xl font-black text-cyan-400">{interviewSession.overallScore}%</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {interviewSession.questions?.map((q: any, i: number) => (
                  <div key={q.questionId} className="p-4 rounded-xl bg-surface-950/80 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                        Question {i + 1}: [{q.category}] ({q.difficulty})
                      </span>
                      {q.score && (
                        <span className="text-xs font-bold text-cyan-400">Score: {q.score}%</span>
                      )}
                    </div>
                    <p className="text-xs text-white font-medium">{q.question}</p>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Your Proposed Answer / Architecture</label>
                      <textarea
                        rows={3}
                        value={answers[q.questionId] || ''}
                        onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
                        placeholder="State trade-offs, time/space complexity, or STAR situation..."
                        className="w-full glass-input text-xs"
                      />
                    </div>

                    {q.feedback && (
                      <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                        <strong>AI Coach Feedback:</strong> {q.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleEvaluateInterview}
                disabled={evaluatingInterview}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center justify-center gap-2 transition-all"
              >
                {evaluatingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Grade Candidate Answers & Output Scoring Breakdown</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Application Pipeline Sub-tab */}
      {subTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Add Application Form */}
          <form onSubmit={handleCreateApp} className="glass-panel p-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Company name (e.g. Stripe, OpenAI)"
              className="flex-1 glass-input text-xs"
              required
            />
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Position title (e.g. Senior Backend Engineer)"
              className="flex-1 glass-input text-xs"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Application
            </button>
          </form>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['wishlist', 'applied', 'technical', 'offer'].map((stage) => {
              const stageApps = applications.filter((a) => a.status === stage);
              return (
                <div key={stage} className="glass-panel p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-slate-300 capitalize">{stage}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-950 text-slate-400 font-bold">
                      {stageApps.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stageApps.map((app) => (
                      <div key={app._id} className="p-3 rounded-xl bg-surface-950/80 border border-white/5 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs font-bold text-white">{app.company}</div>
                            <div className="text-[11px] text-slate-400">{app.position}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteApp(app._id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {app.matchScore && (
                          <div className="text-[10px] text-cyan-400 font-semibold">
                            Match Score: {app.matchScore}%
                          </div>
                        )}

                        {stage !== 'offer' && (
                          <button
                            onClick={() => handleAdvanceApp(app._id, stage === 'wishlist' ? 'applied' : stage === 'applied' ? 'technical' : 'offer')}
                            className="w-full py-1 text-[10px] rounded bg-white/5 hover:bg-brand-500/20 text-brand-300 font-semibold flex items-center justify-center gap-1 transition-all"
                          >
                            <span>Advance Stage</span> &rarr;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
