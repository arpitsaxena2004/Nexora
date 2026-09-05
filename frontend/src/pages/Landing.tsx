import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Brain, Shield, Rocket, Briefcase, Bot, ChevronDown } from 'lucide-react';
import { AGENT_DEFINITIONS, computeConstellationPositions, getActiveAgentsForGoal } from '../services/agentService';
import { AgentData } from '../components/3d/AgentNetwork';

// Lazy load the heavy 3D scene
const Scene = lazy(() => import('../components/3d/Scene').then((m) => ({ default: m.Scene })));
const AgentNetwork = lazy(() => import('../components/3d/AgentNetwork').then((m) => ({ default: m.AgentNetwork })));

interface LandingProps {
  onNavigate: (tab: string) => void;
}

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const } },
};

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  const [goalPreview, setGoalPreview] = useState('');
  const [previewType, setPreviewType] = useState<string | null>(null);

  // Compute constellation layout
  const baseConstellation = useMemo(
    () => computeConstellationPositions(AGENT_DEFINITIONS, 3),
    [],
  );

  // When user types a goal, light up relevant agents
  const liveConstellation: AgentData[] = useMemo(() => {
    if (!previewType) return baseConstellation;
    const activeNames = getActiveAgentsForGoal(previewType);
    return baseConstellation.map((node) => ({
      ...node,
      status: activeNames.includes(node.name) ? 'running' as const : 'idle' as const,
    }));
  }, [baseConstellation, previewType]);

  const handleGoalPreview = (value: string) => {
    setGoalPreview(value);
    const lower = value.toLowerCase();
    if (lower.includes('job') || lower.includes('career') || lower.includes('resume') || lower.includes('interview') || lower.includes('engineer')) {
      setPreviewType('career');
    } else if (lower.includes('startup') || lower.includes('launch') || lower.includes('saas') || lower.includes('business') || lower.includes('mvp')) {
      setPreviewType('startup');
    } else if (value.length > 10) {
      setPreviewType('all');
    } else {
      setPreviewType(null);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'RAG Knowledge Hub',
      description: 'Upload resumes, pitch decks, and market reports. Agents retrieve context via cosine-similarity vector search.',
      color: '#8b5cf6',
    },
    {
      icon: Briefcase,
      title: 'Career Intelligence Suite',
      description: 'ATS scanner, company dossiers, mock interviews, and application pipeline tracking — all autonomous.',
      color: '#06b6d4',
    },
    {
      icon: Rocket,
      title: 'Startup Venture Engine',
      description: 'ICP personas, competitor matrices, pricing modeler, and 30-day MVP roadmap synthesized by AI agents.',
      color: '#10b981',
    },
    {
      icon: Shield,
      title: 'Human-in-the-Loop Safety',
      description: 'Sensitive actions (email dispatch, calendar booking) pause for your cryptographic approval before executing.',
      color: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-white overflow-x-hidden">
      {/* ─── Sticky Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 backdrop-blur-xl bg-[#090d16]/70 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Nexora<span className="text-cyan-400 font-extrabold ml-0.5">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('auth')}
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background radial gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/6 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400" />
              <span>13 Autonomous Specialized Agents</span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
            >
              From Ambition to{' '}
              <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Autonomous Execution.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-sm md:text-base text-slate-300 max-w-lg leading-relaxed"
            >
              Think it. Orchestrate it. Conquer it. Nexora dynamically
              assembles a fleet of specialized AI agents, builds an intelligent 3D DAG execution plan, and
              autonomously drives your goals to completion — with cryptographic safety at every step.
            </motion.p>

            {/* Goal Preview Input */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative max-w-lg"
            >
              <input
                type="text"
                value={goalPreview}
                onChange={(e) => handleGoalPreview(e.target.value)}
                placeholder="Try: &quot;I want to land a senior engineer role at Google&quot;"
                className="w-full bg-surface-950/80 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all"
              />
              <button
                onClick={() => onNavigate('auth')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 transition-colors"
              >
                <ArrowRight className="h-4 w-4 text-white" />
              </button>

              {previewType && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-cyan-400 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>
                    {previewType === 'career' && '9 career agents would activate for this goal →'}
                    {previewType === 'startup' && '8 startup agents would activate for this goal →'}
                    {previewType === 'all' && 'All 13 agents analyzing your goal →'}
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Social proof */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex -space-x-2">
                {['#6366f1', '#06b6d4', '#10b981', '#f59e0b'].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-surface-950 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {['AS', 'MK', 'JL', 'PR'][i]}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500">Trusted by founders & engineers</span>
            </motion.div>
          </div>

          {/* Right: 3D AI Core Constellation */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="relative h-[420px] md:h-[520px] lg:h-[580px]"
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Scene
                cameraPosition={[0, 0, 8.2]}
                autoRotate={false}
                particleCount={120}
              >
                <AgentNetwork
                  agents={liveConstellation}
                  coreIntensity={previewType ? 1 : 0.7}
                />
              </Scene>
            </Suspense>

            {/* Subtle gradient overlay at bottom for blending */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#090d16] to-transparent pointer-events-none" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500"
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold">Explore</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            One Platform.{' '}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              Infinite Autonomy.
            </span>
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Every module is powered by specialized AI agents that collaborate through
            a directed acyclic graph orchestration engine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass-panel p-6 group hover:border-white/20 transition-all duration-300"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: feature.color + '20' }}
                >
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Architecture Diagram Section ─── */}
      <section className="relative py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            How It Works
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            From natural language goal to fully autonomous multi-agent execution
          </p>
        </motion.div>

        {/* Flow steps */}
        <div className="flex flex-col items-center gap-4">
          {[
            { step: '1', label: 'You describe your goal', sub: '"I want to land a staff engineer role at Stripe"', color: '#6366f1' },
            { step: '2', label: 'AI Orchestrator analyzes intent', sub: 'Extracts requirements, identifies missing info, asks clarifying questions', color: '#818cf8' },
            { step: '3', label: 'DAG Planner builds task graph', sub: 'Creates optimal execution order across 13 specialized agents', color: '#06b6d4' },
            { step: '4', label: 'Agents execute autonomously', sub: 'Research → Resume → Company Intel → Interview Prep → Strategy', color: '#10b981' },
            { step: '5', label: 'Human approves sensitive actions', sub: 'Email dispatch, calendar scheduling — you stay in control', color: '#f59e0b' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="w-full max-w-lg"
            >
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface-900/40 border border-white/5 hover:border-white/10 transition-all">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.label}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              </div>

              {/* Connector */}
              {i < 4 && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-4 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative py-24 px-6 md:px-12 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to Launch Your Agent Fleet?
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Start with a single goal. Watch 13 AI agents orchestrate your path forward.
          </p>
          <button
            onClick={() => onNavigate('auth')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-glow transition-all text-sm"
          >
            <Zap className="h-4 w-4" />
            <span>Get Started — It's Free</span>
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-8 px-6 md:px-12 text-center">
        <p className="text-xs text-slate-500">
          Nexora AI · From Ambition to Autonomous Execution · 13 Autonomous Agents · RAG Knowledge Hub · HITL Safety
        </p>
      </footer>
    </div>
  );
};
