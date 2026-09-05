import React from 'react';
import {
  LayoutDashboard,
  Target,
  GitFork,
  Briefcase,
  Rocket,
  Brain,
  ShieldCheck,
  BarChart3,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Goal Intake', icon: Target },
    { id: 'workflows', label: 'DAG Workflows', icon: GitFork },
    { id: 'career', label: 'Career Suite', icon: Briefcase },
    { id: 'startup', label: 'Startup Workspace', icon: Rocket },
    { id: 'knowledge', label: 'RAG Knowledge Hub', icon: Brain },
    { id: 'approvals', label: 'Approvals & Tools', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics & Telemetry', icon: BarChart3 },
    { id: 'agents', label: 'Agent Registry', icon: Bot },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-surface-950/80 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/30 to-brand-500/10 border border-brand-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 rounded-xl bg-surface-900/60 border border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
          <span className="font-semibold text-slate-300">Multi-Agent Core</span>
        </div>
        <div className="text-[10px] text-slate-400">13 Active Specialized Agents & RAG Hub Online</div>
      </div>
    </aside>
  );
};
