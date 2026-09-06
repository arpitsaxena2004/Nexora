import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Code2,
  FileText,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  ListOrdered,
  DollarSign,
  Briefcase,
  Layers,
} from 'lucide-react';

interface AgentOutputFormatterProps {
  payload: any;
  title?: string;
  agentType?: string;
}

export const AgentOutputFormatter: React.FC<AgentOutputFormatterProps> = ({
  payload,
  title,
  agentType,
}) => {
  const [viewMode, setViewMode] = useState<'formatted' | 'json'>('formatted');
  const [copied, setCopied] = useState(false);

  if (!payload) {
    return (
      <div className="p-4 rounded-xl bg-surface-950/50 border border-white/5 text-slate-400 text-xs">
        No output generated yet.
      </div>
    );
  }

  const handleCopy = () => {
    const textToCopy = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format camelCase or snake_case key to Human Title Case
  const formatKeyName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  };

  // If payload is primitive string
  if (typeof payload === 'string') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Agent Deliverable</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-950/70 border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
          {payload}
        </div>
      </div>
    );
  }

  // Separate top-level summaries/metrics vs detailed lists/objects
  const summaryKeys = [
    'summary',
    'marketSummary',
    'overview',
    'executiveSummary',
    'description',
    'conclusion',
    'verificationNotes',
    'agentOutput',
  ];

  const metricKeys = [
    'marketDemand',
    'averageSalaryRange',
    'estimatedTam',
    'atsScore',
    'readinessScore',
    'status',
    'score',
    'pricingModel',
    'stage',
  ];

  const keys = Object.keys(payload);
  const foundSummaryKey = keys.find((k) => summaryKeys.includes(k) && typeof payload[k] === 'string');
  const foundMetrics = keys.filter((k) => metricKeys.includes(k) && (typeof payload[k] === 'string' || typeof payload[k] === 'number'));
  const remainingKeys = keys.filter((k) => k !== foundSummaryKey && !foundMetrics.includes(k) && k !== 'timestamp');

  return (
    <div className="space-y-3">
      {/* Header controls: Switch Formatted / JSON and Copy */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Synthesized Agent Output</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode(viewMode === 'formatted' ? 'json' : 'formatted')}
            className="text-[10px] font-medium text-slate-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5 transition-all"
            title="Toggle between Clean Formatted view and Raw JSON"
          >
            {viewMode === 'formatted' ? (
              <>
                <Code2 className="h-3 w-3 text-brand-400" />
                <span>JSON</span>
              </>
            ) : (
              <>
                <FileText className="h-3 w-3 text-cyan-400" />
                <span>Formatted</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="text-[10px] font-medium text-slate-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/5 transition-all"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Raw JSON View */}
      {viewMode === 'json' ? (
        <pre className="p-3.5 rounded-xl bg-surface-950/90 border border-white/10 text-[11px] text-slate-200 font-mono overflow-x-auto max-h-96 leading-relaxed">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : (
        /* Clean Formatted Normal View */
        <div className="space-y-3.5 text-xs">
          {/* 1. Executive Summary / Highlight Card */}
          {foundSummaryKey && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-brand-950/50 via-surface-950/80 to-surface-900/40 border border-brand-500/20 shadow-sm">
              <div className="text-[10px] font-bold text-brand-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                <span>{formatKeyName(foundSummaryKey)}</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11.5px]">
                {payload[foundSummaryKey]}
              </p>
            </div>
          )}

          {/* 2. Key Metrics & Stat Badges */}
          {foundMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {foundMetrics.map((mk) => (
                <div
                  key={mk}
                  className="p-2.5 rounded-xl bg-surface-950/60 border border-white/5 flex flex-col justify-center"
                >
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    {formatKeyName(mk)}
                  </span>
                  <span className="text-xs font-semibold text-white mt-0.5 capitalize truncate">
                    {String(payload[mk])}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Detailed Sections & Lists */}
          {remainingKeys.map((key) => {
            const val = payload[key];

            // Render Arrays
            if (Array.isArray(val)) {
              if (val.length === 0) return null;

              // Array of simple strings
              const isStringArray = val.every((item) => typeof item === 'string');

              return (
                <div key={key} className="p-3 rounded-xl bg-surface-950/60 border border-white/5 space-y-2">
                  <div className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{formatKeyName(key)}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-white/5 text-slate-400 rounded-full">
                      {val.length}
                    </span>
                  </div>

                  {isStringArray ? (
                    <div className="space-y-1.5">
                      {val.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[11px] text-slate-200 bg-surface-900/50 p-2 rounded-lg border border-white/5"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Array of Objects (e.g. milestones, competitors, questions)
                    <div className="space-y-2">
                      {val.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-surface-900/60 border border-white/5 text-[11px] space-y-1"
                        >
                          {typeof item === 'object' && item !== null ? (
                            Object.entries(item).map(([subK, subV]) => (
                              <div key={subK} className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                                  {formatKeyName(subK)}:
                                </span>
                                <span className="text-slate-200">
                                  {typeof subV === 'object' ? JSON.stringify(subV) : String(subV)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-200">{String(item)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Render Nested Object
            if (typeof val === 'object' && val !== null) {
              return (
                <div key={key} className="p-3 rounded-xl bg-surface-950/60 border border-white/5 space-y-2">
                  <div className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{formatKeyName(key)}</span>
                  </div>

                  <div className="space-y-1.5 bg-surface-900/50 p-2.5 rounded-lg border border-white/5 text-[11px]">
                    {Object.entries(val).map(([nestedK, nestedV]) => (
                      <div key={nestedK} className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-1 border-b border-white/5 last:border-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase w-32 shrink-0">
                          {formatKeyName(nestedK)}:
                        </span>
                        <span className="text-slate-200 flex-1">
                          {Array.isArray(nestedV)
                            ? nestedV.join(', ')
                            : typeof nestedV === 'object' && nestedV !== null
                            ? JSON.stringify(nestedV)
                            : String(nestedV)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // Simple String or Number Field
            return (
              <div
                key={key}
                className="p-2.5 rounded-xl bg-surface-950/60 border border-white/5 flex items-baseline justify-between gap-2"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {formatKeyName(key)}
                </span>
                <span className="text-xs text-slate-200 font-medium text-right">
                  {String(val)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
