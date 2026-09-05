import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, approvalsApi } from '../../services/api';
import { Bell, ShieldAlert, Sparkles, Check, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onNavigate?: (tab: string) => void;
  activeGoalTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeGoalTitle }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      const [notifRes, appRes] = await Promise.all([
        notificationsApi.list(),
        approvalsApi.list('pending'),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(notifRes.data.unreadCount || 0);
      setPendingApprovalsCount(appRes.data.pendingCount || 0);
    } catch (e) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-white/10 bg-surface-950/70 backdrop-blur-xl px-6 flex items-center justify-between">
      {/* Left: Brand / Active Goal */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow flex items-center justify-center">
            <div className="h-full w-full bg-surface-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            Nexora<span className="text-cyan-400 font-extrabold ml-0.5">AI</span>
          </span>
          <span className="hidden xl:inline-block text-[10px] font-mono text-slate-400 pl-2 border-l border-white/10">
            From Ambition to Autonomous Execution
          </span>
        </div>

        {activeGoalTitle && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/10">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Goal:</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 font-medium truncate max-w-xs">
              {activeGoalTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions, Approvals & Notifications */}
      <div className="flex items-center gap-3">
        {/* Approvals Alert Pill */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => onNavigate && onNavigate('approvals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all animate-pulse"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{pendingApprovalsCount} Approval{pendingApprovalsCount > 1 ? 's' : ''} Pending</span>
          </button>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-semibold text-sm text-slate-200">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        n.isRead ? 'bg-white/[0.02] text-slate-400' : 'bg-brand-500/10 border border-brand-500/20 text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user.role || 'Member'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate && onNavigate('auth')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
          >
            <UserIcon className="h-3.5 w-3.5" /> Sign In
          </button>
        )}
      </div>
    </header>
  );
};
