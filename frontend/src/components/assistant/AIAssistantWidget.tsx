import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { assistantApi } from '../../services/api';
import robotImage from '../../utils/Robot.png';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronDown,
  RotateCcw,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface AIAssistantWidgetProps {
  onNavigate: (tab: string, context?: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: { tab: string; label: string };
  suggestions?: string[];
  timestamp: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Hello! I am the **Nexora AI Copilot** (*From Ambition to Autonomous Execution*). 

I am here exclusively to guide you through:
- 🤖 **13 Specialized Autonomous Agents** (Core, Career & Startup tracks)
- ⚡ **3D Neural DAG Workflow Execution** & Real-Time Orchestration
- 📂 **RAG Knowledge Hub** & Multi-Page PDF Document Extraction
- 🛡️ **Human-in-the-Loop Safety Approvals** & Tool Interception
- 🎯 **Creating & Assembling Goals**

Ask me anything about how Nexora AI works!`,
  suggestions: [
    'What are the 13 autonomous agents?',
    'How does the 3D DAG Workflow work?',
    'How do I upload documents to RAG Hub?',
    'How do safety approvals work?',
  ],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await assistantApi.chat({
        message: text,
        history: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        action: res.data.action,
        suggestions: res.data.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an issue: ${
          err.response?.data?.error || err.message || 'Unable to connect to assistant'
        }. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] mb-3 glass-panel rounded-3xl border border-brand-500/40 shadow-2xl flex flex-col overflow-hidden bg-surface-950/95 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-brand-950/90 via-surface-900/90 to-surface-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                      scale: [1, 1.04, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-10 h-10 rounded-2xl overflow-hidden border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] bg-surface-900 flex items-center justify-center"
                  >
                    <img
                      src={robotImage}
                      alt="Nexora Copilot Robot"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-surface-950 rounded-full animate-pulse shadow-glow" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <span>Nexora Copilot</span>
                    <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-cyan-300 text-[9px] font-mono uppercase tracking-wider">
                      Platform AI
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400">From Ambition to Autonomous Execution</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Reset Conversation"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[95%]">
                    {msg.role === 'assistant' && (
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-6 h-6 rounded-lg overflow-hidden border border-cyan-400/40 shadow-sm shrink-0 mt-0.5"
                      >
                        <img
                          src={robotImage}
                          alt="Robot"
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-tr-sm shadow-md font-medium ml-auto'
                          : 'bg-surface-900/90 border border-white/10 text-slate-200 rounded-tl-sm shadow-lg'
                      }`}
                    >
                      {msg.content}

                      {/* Action Shortcut Button */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-white/10">
                          <button
                            onClick={() => {
                              onNavigate(msg.action!.tab);
                              setIsOpen(false);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 hover:text-brand-200 text-xs font-bold flex items-center justify-between transition-all"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[9px] text-slate-500 mt-1 px-1 ${msg.role === 'assistant' ? 'ml-8' : ''}`}>
                    {msg.timestamp}
                  </span>

                  {/* Suggestion Pills attached to latest assistant message */}
                  {msg.suggestions && msg.id === messages[messages.length - 1].id && (
                    <div className="mt-2.5 ml-8 flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          disabled={loading}
                          className="px-2.5 py-1 rounded-lg bg-surface-900/80 hover:bg-brand-600/30 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white text-[10px] font-medium transition-all text-left disabled:opacity-50"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2.5 p-3 bg-surface-900/80 border border-white/5 rounded-2xl w-fit text-slate-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 rounded-full overflow-hidden border border-cyan-400/50 shadow-glow"
                  >
                    <img src={robotImage} alt="Thinking" className="w-full h-full object-cover" />
                  </motion.div>
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    Nexora Copilot thinking
                    <span className="inline-flex gap-0.5">
                      <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                    </span>
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-white/10 bg-surface-950/90 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about 13 agents, 3D DAG, RAG Hub..."
                disabled={loading}
                className="flex-1 bg-surface-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-glow transition-all disabled:opacity-50 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solo Standing Animated Robot Mascot */}
      <motion.div
        animate={{
          y: isOpen ? 0 : [0, -8, 0],
          rotate: isOpen ? 0 : [0, 1.5, -1.5, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative cursor-pointer flex flex-col items-center select-none"
      >
        {/* Floating Speech Tag above the Robot Head */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-1.5 px-3 py-1 rounded-full bg-surface-950/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center gap-1.5 transition-all group-hover:border-cyan-300 group-hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-white tracking-wide">
            {isOpen ? 'Close Copilot ✕' : 'Nexora AI Guide'}
          </span>
          <Sparkles className="h-3 w-3 text-cyan-300" />
        </motion.div>

        {/* Solo Standing Robot Figure */}
        <div className="relative flex flex-col items-center">
          <img
            src={robotImage}
            alt="Nexora AI Robot Mascot"
            className="w-28 sm:w-32 h-auto max-h-[155px] object-contain drop-shadow-[0_8px_20px_rgba(6,182,212,0.45)] transition-transform group-hover:drop-shadow-[0_10px_28px_rgba(6,182,212,0.7)] group-hover:scale-105"
          />

          {/* Glowing Holographic Energy Ring / Base under Feet */}
          <div className="w-20 h-3 -mt-2 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent rounded-full blur-sm animate-pulse" />
          <div className="w-12 h-1 bg-cyan-300/60 rounded-full blur-[2px]" />
        </div>
      </motion.div>
    </div>
  );
};

export default AIAssistantWidget;

