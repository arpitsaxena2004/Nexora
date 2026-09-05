import React, { useState, useEffect } from 'react';
import { agentsApi } from '../services/api';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await agentsApi.list();
      setAgents(res.data.agents || []);
      if (res.data.agents?.length > 0) {
        setSelectedAgent(res.data.agents[0]);
      }
    } catch (err: any) {
      console.error('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 Autonomous Agent Fleet Directory (13 Agents)
        </h1>
        <p className="text-sm text-slate-400">
          Inspect system prompts, assigned tool capabilities, permission levels, confidence thresholds, and memory access across all 13 registered specialized agents.
        </p>
      </div>

      {loading ? (
        <div className="card text-center py-16 text-slate-400 text-sm">Inspecting agent fleet registry...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Agent Fleet Grid (Left) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map(a => {
              const isSelected = selectedAgent?.name === a.name || selectedAgent?.agentId === a.agentId;
              return (
                <div
                  key={a.name || a.agentId}
                  onClick={() => setSelectedAgent(a)}
                  className={`card cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-primary-500 bg-primary-950/20 shadow-glow'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-primary-400">{a.name || a.agentId}</span>
                    <span className="badge badge-success text-[10px]">READY</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{a.displayName || (a.name || a.agentId).replace(/_/g, ' ').toUpperCase()}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {a.description || 'Specialized domain intelligence agent with structured prompt orchestration and validation.'}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                    <span>Tools: {(a.allowedTools || []).length || 1}</span>
                    <span>Role: {a.role || 'Executor'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Agent Inspector (Right) */}
          <div className="lg:col-span-5">
            {selectedAgent ? (
              <div className="card space-y-4 sticky top-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedAgent.displayName || selectedAgent.name || selectedAgent.agentId}</h3>
                    <span className="text-xs font-mono text-primary-400">{selectedAgent.name || selectedAgent.agentId}</span>
                  </div>
                  <span className="badge badge-primary">v2.4 Autonomous</span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedAgent.description || 'Performs specialized autonomous task execution in the DAG pipeline.'}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">System Instructions & Persona</span>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-xs font-mono text-slate-300 max-h-40 overflow-y-auto">
                    {selectedAgent.systemPrompt || `You are an expert ${selectedAgent.name || selectedAgent.agentId} specialized in autonomous planning, structured schema generation, and domain execution.`}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Tools</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedAgent.allowedTools && selectedAgent.allowedTools.length > 0 ? selectedAgent.allowedTools : ['web_search', 'rag_retrieval']).map((t: string, i: number) => (
                      <span key={i} className="badge bg-slate-800 text-slate-300 border-white/10 font-mono text-[11px]">
                        🔧 {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Min Confidence</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">0.85 / 1.0</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Self-Correction</span>
                    <span className="text-sm font-bold text-primary-400 font-mono">Enabled (3x)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-16 text-slate-500 text-sm">
                Select an agent on the left to inspect its parameters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
