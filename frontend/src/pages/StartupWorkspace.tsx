import React, { useState } from 'react';
import { startupApi } from '../services/api';

export const StartupWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'persona' | 'competitors' | 'pricing' | 'mvp'>('persona');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persona State
  const [idea, setIdea] = useState('AI-powered Copilot for B2B Sales Prospecting');
  const [targetMarket, setTargetMarket] = useState('Mid-market SaaS companies (50-500 employees)');
  const [personaResult, setPersonaResult] = useState<any>(null);

  // Competitor State
  const [industry, setIndustry] = useState('B2B Sales Automation');
  const [features, setFeatures] = useState('Autonomous email outreach, LinkedIn voice notes, CRM auto-sync');
  const [competitorResult, setCompetitorResult] = useState<any>(null);

  // Business Model State
  const [costStructure, setCostStructure] = useState('OpenAI API costs, Cloud hosting, Stripe fees');
  const [businessModelResult, setBusinessModelResult] = useState<any>(null);

  // MVP Strategy State
  const [coreProblem, setCoreProblem] = useState('SDRs spend 4+ hours daily researching leads manually');
  const [mvpResult, setMvpResult] = useState<any>(null);

  const handleGeneratePersona = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startupApi.generatePersona({ idea, targetMarket });
      setPersonaResult(res.data.persona);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate customer persona');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCompetitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startupApi.generateCompetitors({ industry, features: features.split(',').map(s => s.trim()) });
      setCompetitorResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze competitors');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startupApi.generateBusinessModel({ idea, targetMarket, costStructure });
      setBusinessModelResult(res.data.businessModel);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate business model');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMvp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await startupApi.generateMVPRoadmap({ idea, coreProblem, targetMarket });
      setMvpResult(res.data.mvpStrategy || res.data.roadmap);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate MVP roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🚀 Deep Startup Intelligence Suite
          </h1>
          <p className="text-sm text-slate-400">
            Autonomous venture validation, ICP profiling, competitor war-rooms, and 30-day MVP execution engine.
          </p>
        </div>
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('persona')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'persona' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 ICP & Persona
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'competitors' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚔️ Competitor Matrix
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pricing' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            💎 Pricing & Model
          </button>
          <button
            onClick={() => setActiveTab('mvp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'mvp' ? 'bg-primary-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ 30-Day MVP Roadmap
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Tab 1: ICP & Persona */}
      {activeTab === 'persona' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 card space-y-4">
            <h2 className="text-base font-semibold text-white">Ideal Customer Persona Generator</h2>
            <p className="text-xs text-slate-400">
              Dispatches <span className="text-primary-400 font-mono">customer_persona_agent</span> to synthesize user archetypes, pain points, and willingness to pay.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Venture Idea</label>
              <input
                type="text"
                value={idea}
                onChange={e => setIdea(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Market Segment</label>
              <input
                type="text"
                value={targetMarket}
                onChange={e => setTargetMarket(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              onClick={handleGeneratePersona}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Synthesizing ICP Persona...' : 'Generate Customer Persona'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {personaResult ? (
              <div className="card space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{personaResult.role || 'Enterprise Persona'}</h3>
                    <p className="text-xs text-slate-400">{personaResult.demographics?.title || 'Decision Maker'} • {personaResult.demographics?.industry || 'Tech'}</p>
                  </div>
                  <span className="badge badge-primary">WTP: {personaResult.willingnessToPay || '$99 - $299/mo'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-rose-400 uppercase mb-2">🔥 Critical Pain Points</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {(personaResult.painPoints || []).map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">🎯 Desired Outcomes</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {(personaResult.goals || []).map((g: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">•</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-sky-400 uppercase">📣 Channels & Discovery</h4>
                  <div className="flex flex-wrap gap-2">
                    {(personaResult.channels || ['LinkedIn', 'Substack', 'ProductHunt', 'Cold Email']).map((c: string, i: number) => (
                      <span key={i} className="badge bg-sky-500/10 text-sky-300 border-sky-500/20">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12 text-slate-500">
                <p className="text-sm">Enter your venture idea and market to synthesize a detailed buyer persona.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Competitor Matrix */}
      {activeTab === 'competitors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 card space-y-4">
            <h2 className="text-base font-semibold text-white">Competitor War-Room & Positioning</h2>
            <p className="text-xs text-slate-400">
              Dispatches <span className="text-primary-400 font-mono">competitor_agent</span> to analyze feature parity, defensibility, and market gaps.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Industry Sector</label>
              <input
                type="text"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Proposed Key Features</label>
              <textarea
                rows={3}
                value={features}
                onChange={e => setFeatures(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
            <button
              onClick={handleAnalyzeCompetitors}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Running Competitor Matrix...' : 'Analyze Market Landscape'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {competitorResult ? (
              <div className="card space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white">Market Landscape Intelligence</h3>
                <div className="space-y-3">
                  {(competitorResult.competitors || [
                    { name: 'Apollo.io', strengths: 'Enormous database', weaknesses: 'No deep AI personalization', pricing: '$79/user' },
                    { name: 'Clay.com', strengths: 'High customizability', weaknesses: 'Steep learning curve', pricing: '$149/user' },
                    { name: 'Lemlist', strengths: 'Warmup network', weaknesses: 'Basic intent data', pricing: '$59/user' }
                  ]).map((comp: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{comp.name}</span>
                        <span className="text-xs text-slate-400 font-mono">{comp.pricing || 'Custom'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div><span className="text-emerald-400 font-medium">Strength:</span> <span className="text-slate-300">{comp.strengths}</span></div>
                        <div><span className="text-rose-400 font-medium">Vulnerability:</span> <span className="text-slate-300">{comp.weaknesses}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                {competitorResult.differentiation && (
                  <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    <h4 className="text-xs font-bold text-primary-300 uppercase mb-1">🌟 Unfair Advantage & Wedge Strategy</h4>
                    <p className="text-xs text-slate-300">{competitorResult.differentiation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12 text-slate-500">
                <p className="text-sm">Launch competitor intelligence to uncover incumbents, gaps, and differentiation opportunities.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Pricing & Business Model */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 card space-y-4">
            <h2 className="text-base font-semibold text-white">Business Model & Pricing Architect</h2>
            <p className="text-xs text-slate-400">
              Dispatches <span className="text-primary-400 font-mono">business_model_agent</span> to calculate unit economics, tier ladders, and CAC/LTV drivers.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Venture Idea</label>
              <input
                type="text"
                value={idea}
                onChange={e => setIdea(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Cost Drivers</label>
              <input
                type="text"
                value={costStructure}
                onChange={e => setCostStructure(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              onClick={handleGeneratePricing}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Modeling Unit Economics...' : 'Synthesize Pricing Tiers'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {businessModelResult ? (
              <div className="card space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white">Recommended Pricing Architecture</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(businessModelResult.pricingTiers || [
                    { name: 'Starter', price: '$29/mo', features: ['500 Leads', 'Basic Sequences', 'Email only'] },
                    { name: 'Pro (Recommended)', price: '$99/mo', features: ['2,500 Leads', 'AI Voice Notes', 'CRM Sync', 'Priority Run'] },
                    { name: 'Scale', price: '$299/mo', features: ['Unlimited Leads', 'Dedicated IP', 'Custom Webhooks', 'SLA'] }
                  ]).map((tier: any, i: number) => (
                    <div key={i} className={`p-3 rounded-xl border flex flex-col justify-between ${tier.name.includes('Pro') ? 'bg-primary-950/40 border-primary-500/50 shadow-glow' : 'bg-slate-900/60 border-white/5'}`}>
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">{tier.name}</span>
                        <span className="text-xl font-extrabold text-white my-1 block">{tier.price}</span>
                        <ul className="text-xs text-slate-400 space-y-1 mt-2">
                          {(tier.features || []).map((f: string, j: number) => (
                            <li key={j} className="flex items-center gap-1">✓ {f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Target Gross Margin:</span>
                    <span className="font-mono text-emerald-400 font-bold">{businessModelResult.grossMargin || '82%'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Payback Period:</span>
                    <span className="font-mono text-primary-400 font-bold">{businessModelResult.paybackMonths || '3.2 months'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12 text-slate-500">
                <p className="text-sm">Run pricing model synthesis to compute optimal tiers, margins, and cost structures.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: 30-Day MVP Roadmap */}
      {activeTab === 'mvp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 card space-y-4">
            <h2 className="text-base font-semibold text-white">30-Day Autonomous MVP Engine</h2>
            <p className="text-xs text-slate-400">
              Dispatches <span className="text-primary-400 font-mono">mvp_strategy_agent</span> to construct week-by-week build milestones, no-code/code stacks, and launch checklists.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Core Problem Solved</label>
              <textarea
                rows={2}
                value={coreProblem}
                onChange={e => setCoreProblem(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>
            <button
              onClick={handleGenerateMvp}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Synthesizing 30-Day Roadmap...' : 'Generate 30-Day MVP Roadmap'}
            </button>
          </div>

          <div className="lg:col-span-7">
            {mvpResult ? (
              <div className="card space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-base font-bold text-white">4-Week Execution Sequence</h3>
                  <span className="badge badge-success">Target: Alpha in 30 Days</span>
                </div>

                <div className="space-y-3">
                  {(mvpResult.weeks || [
                    { week: 1, title: 'Scope & Architecture', tasks: ['Define core data model', 'Create Next.js + Tailwind scaffold', 'Mockup prompt chaining'] },
                    { week: 2, title: 'Core Agent & LLM Pipeline', tasks: ['Implement scraping & AI enrichment', 'Build email template generator', 'Unit test retrieval accuracy'] },
                    { week: 3, title: 'Frontend & Integrations', tasks: ['Build campaign dashboard', 'Integrate Resend/SMTP email dispatcher', 'Stripe checkout flow'] },
                    { week: 4, title: 'Beta Testing & Launch', tasks: ['Onboard 10 design partners', 'Product Hunt launch prep', 'Iterate on feedback'] }
                  ]).map((w: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">Week {w.week}: {w.title}</span>
                      </div>
                      <div className="space-y-1">
                        {(w.tasks || []).map((t: string, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12 text-slate-500">
                <p className="text-sm">Click generate to view a step-by-step 30-day technical & go-to-market MVP plan.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
