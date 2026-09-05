import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { WorkflowView } from './pages/WorkflowView';
import { CareerHub } from './pages/CareerHub';
import { StartupWorkspace } from './pages/StartupWorkspace';
import { KnowledgeHub } from './pages/KnowledgeHub';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AuthPage } from './pages/AuthPage';
import { Landing } from './pages/Landing';
import { AIAssistantWidget } from './components/assistant/AIAssistantWidget';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeGoalTitle, setActiveGoalTitle] = useState<string>('');
  const [navigationContext, setNavigationContext] = useState<any>(null);

  const handleNavigate = (tab: string, context?: any) => {
    if (context) setNavigationContext(context);
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide text-slate-300">Initializing Nexora Autonomous Platform...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: show Landing or Auth page
  if (!isAuthenticated) {
    if (activeTab === 'auth') {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center">
          <AuthPage onSuccess={() => setActiveTab('dashboard')} />
          <button
            onClick={() => setActiveTab('landing')}
            className="fixed top-6 left-6 text-xs text-slate-400 hover:text-white flex items-center gap-1 z-50 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      );
    }
    return <Landing onNavigate={handleNavigate} />;
  }

  // If user just authenticated and is still on landing/auth, redirect to dashboard
  if (activeTab === 'landing' || activeTab === 'auth') {
    setActiveTab('dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onNavigate={handleNavigate} activeGoalTitle={activeGoalTitle} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar currentTab={activeTab} onSelectTab={handleNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} setActiveGoalTitle={setActiveGoalTitle} />
          )}

          {activeTab === 'onboarding' && (
            <Onboarding onNavigate={handleNavigate} setActiveGoalTitle={setActiveGoalTitle} />
          )}

          {activeTab === 'workflows' && (
            <WorkflowView
              workflowId={navigationContext?.workflowId}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'career' && <CareerHub />}
          {activeTab === 'startup' && <StartupWorkspace />}
          {activeTab === 'knowledge' && <KnowledgeHub />}
          {activeTab === 'approvals' && <ApprovalsPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'agents' && <AgentsPage />}
        </main>
      </div>

      {/* Global AI Platform Assistant Widget */}
      <AIAssistantWidget onNavigate={handleNavigate} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
