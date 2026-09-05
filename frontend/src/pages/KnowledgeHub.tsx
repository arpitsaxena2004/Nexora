import React, { useState, useEffect, useRef } from 'react';
import { knowledgeApi } from '../services/api';
import { extractDocumentContent } from '../utils/documentParser';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Bot,
  Search,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  Layers,
  AlertCircle,
  FileUp,
  FileCheck2,
} from 'lucide-react';

export const KnowledgeHub: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDocChunks, setSelectedDocChunks] = useState<any[] | null>(null);

  // Manual document ingest form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'resume' | 'portfolio' | 'project' | 'financial' | 'general'>('resume');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<{
    fileName: string;
    wordsCount: number;
    pageCount?: number;
    detectedCategory: string;
    fileType: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await knowledgeApi.listDocuments();
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ─── Automated Document Ingestion & Extraction Agent ───
  const processUploadedFile = async (file: File) => {
    if (!file) return;

    setExtracting(true);
    setError(null);
    setSuccess(null);

    try {
      // Use PDF.js and XML stream extractor
      const extracted = await extractDocumentContent(file);

      // Auto-fill form fields with the genuine extracted document text
      setTitle(extracted.title);
      setCategory(extracted.category);
      setContent(extracted.text);

      setAgentStatus({
        fileName: extracted.title,
        wordsCount: extracted.wordCount,
        pageCount: extracted.pageCount,
        detectedCategory: extracted.category,
        fileType: extracted.fileType,
      });

      setSuccess(
        `Document Ingestion Agent extracted ${extracted.wordCount} words${
          extracted.pageCount ? ` across ${extracted.pageCount} page(s)` : ''
        } from "${extracted.title}" and auto-classified as "${extracted.category.toUpperCase()}".`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from the uploaded document.');
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Sample Benchmark Ingestion Presets
  const handleLoadSample = (sampleType: 'resume' | 'pitch') => {
    if (sampleType === 'resume') {
      const sample = {
        title: 'Senior_Staff_AI_Distributed_Systems_Engineer_Resume.md',
        category: 'resume' as const,
        content: `# Arpit Sharma — Senior Staff AI Systems Architect

## Professional Summary
Senior Software Engineer with 8+ years designing high-throughput distributed architectures, autonomous agent workflows, and semantic RAG retrieval systems at scale.

## Core Technical Skills
- **Languages**: TypeScript, Python, Go, Rust, C++
- **Distributed & Cloud**: Kubernetes, Docker, AWS (EKS, Lambda, DynamoDB), Kafka, Redis
- **AI & RAG Systems**: LLM Orchestration, Vector Embeddings (Cosine Similarity, HNSW), LangChain, LangGraph, DAG Pipelines
- **Databases**: MongoDB, PostgreSQL, Qdrant, Pinecone

## Key Engineering Achievements
- Architected multi-agent autonomous workflow engine executing 25k+ daily DAG tasks with sub-200ms latency.
- Built hybrid semantic vector search pipeline reducing document ingestion time by 68%.
- Optimized distributed database sharding and caching, saving $140,000 annually in infrastructure costs.`,
      };
      setTitle(sample.title);
      setCategory(sample.category);
      setContent(sample.content);
      setAgentStatus({
        fileName: sample.title,
        wordsCount: 162,
        detectedCategory: sample.category,
        fileType: 'MD',
      });
      setSuccess('Sample Resume loaded by Document Ingestion Agent!');
    } else if (sampleType === 'pitch') {
      const sample = {
        title: 'Nexora_B2B_SaaS_Pitch_Deck_and_MVP_Roadmap.md',
        category: 'project' as const,
        content: `# Nexora AI — Autonomous B2B Multi-Agent Venture Platform
*Tagline: From Ambition to Autonomous Execution*

## Problem & Market Opportunity
Modern career professionals and startup founders juggle fragmented tools for market research, candidate matching, and automated operations. The current market TAM exceeds $14.2B with a 38% CAGR in autonomous workflow tooling.

## Our Solution
A deterministic DAG-driven multi-agent platform combining RAG vector memory with cryptographic human-in-the-loop safety approvals.

## 30-Day MVP Milestones
1. **Week 1**: 13-Agent Constellation Core & Vector Embedding Hub
2. **Week 2**: Autonomous DAG Workflow Runner & Step Simulator
3. **Week 3**: ATS Resume Scorer & Company Technical Dossier Generator
4. **Week 4**: Human-in-the-loop email/calendar dispatch approval layer`,
      };
      setTitle(sample.title);
      setCategory(sample.category);
      setContent(sample.content);
      setAgentStatus({
        fileName: sample.title,
        wordsCount: 145,
        detectedCategory: sample.category,
        fileType: 'MD',
      });
      setSuccess('Sample Pitch Deck loaded by Document Ingestion Agent!');
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await knowledgeApi.ingestDocument({
        filename: title,
        title,
        originalName: title,
        content,
        category,
        tags: [category, 'rag-knowledge-hub'],
      });
      setSuccess(`Document "${title}" ingested, chunked, and vector-embedded successfully!`);
      setTitle('');
      setContent('');
      setAgentStatus(null);
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to ingest document');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await knowledgeApi.queryKnowledge({ query: searchQuery, limit: 5 });
      setSearchResults(res.data.results || []);
    } catch (err: any) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const handleInspectChunks = async (docId: string) => {
    try {
      const res = await knowledgeApi.getDocument(docId);
      setSelectedDocChunks(res.data.document?.chunks || []);
    } catch (err: any) {
      console.error('Failed to get chunks', err);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      await knowledgeApi.deleteDocument(docId);
      fetchDocuments();
      if (selectedDocChunks) setSelectedDocChunks(null);
    } catch (err: any) {
      console.error('Failed to delete doc', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="glass-panel p-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Autonomous RAG Memory Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {documents.length} Ingested Documents
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              🧠 RAG Knowledge Hub & 3-Tier Memory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload resumes, business plans, and market reports. Automatic chunking, vector embedding generation, and cosine similarity retrieval across the 13-agent fleet.
            </p>
          </div>

          {/* Preset Sample Triggers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLoadSample('resume')}
              className="px-3 py-1.5 rounded-xl bg-surface-950 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sample Resume</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('pitch')}
              className="px-3 py-1.5 rounded-xl bg-surface-950 border border-white/10 hover:border-brand-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sample Pitch Deck</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid: Ingestion & Vector Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Upload & Ingestion Form (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-5 border-brand-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FileUp className="h-4 w-4 text-brand-400" />
              <span>Ingest Knowledge Document</span>
            </h2>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <Bot className="h-3 w-3" />
              <span>AI Parser Agent</span>
            </span>
          </div>

          {/* Interactive Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              extracting
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-white/10 hover:border-brand-500/50 bg-surface-950/60 hover:bg-brand-950/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.md,.json,.csv,.yaml,.yml"
              className="hidden"
            />

            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow">
                {extracting ? (
                  <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-white">
                  {extracting ? 'Document Ingestion Agent Extracting Full Text...' : 'Click to Upload or Drag & Drop File'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Full text extraction for PDF, DOCX, TXT, Markdown, JSON, CSV files
                </p>
              </div>
            </div>
          </div>

          {/* Agent Status Badge when file is extracted */}
          {agentStatus && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="h-5 w-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-200">{agentStatus.fileName}</span>
                  <span className="text-[10px] text-slate-300 block">
                    {agentStatus.wordsCount} words extracted
                    {agentStatus.pageCount ? ` • ${agentStatus.pageCount} page(s)` : ''} • Auto-classified as {agentStatus.detectedCategory.toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase shrink-0">
                {agentStatus.fileType} Extracted
              </span>
            </div>
          )}

          <form onSubmit={handleIngest} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                placeholder="e.g., Arpit_Sharma_Senior_Staff_Resume_2026.pdf"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-surface-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Knowledge Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-surface-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40"
              >
                <option value="resume">Resume & Work Experience</option>
                <option value="portfolio">Portfolio & Case Studies</option>
                <option value="project">Venture Plan / Pitch Deck</option>
                <option value="financial">Financials & Pricing Metrics</option>
                <option value="general">General Business Context</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Extracted Document Text (Markdown or Raw Text)
                </label>
                {content && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
              <textarea
                rows={7}
                placeholder="Upload a PDF or document above or paste markdown text here. The Document Ingestion Agent will extract the full text and structure automatically..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full bg-surface-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 font-mono resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !title.trim() || !content.trim()}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Chunking & Generating Vector Embeddings...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Ingest & Generate Vector Embeddings</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Similarity Search Playground (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan-400" />
              <span>Semantic Similarity Search</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Query the vector database directly using semantic vector distance to inspect what agents retrieve during goal execution.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Distributed systems experience, Kubernetes, Series A pitch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-surface-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-glow shrink-0"
            >
              {searching ? 'Querying...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          <div className="space-y-3 mt-4 max-h-[440px] overflow-y-auto pr-1">
            {searchResults.length > 0 ? (
              searchResults.map((res: any, i: number) => (
                <div key={i} className="p-3.5 bg-surface-950/80 rounded-xl border border-brand-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-300">Match #{i + 1}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      Similarity: {((res.score ?? res.similarity ?? 0.85) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono bg-black/40 p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
                    {res.content || res.text}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Doc ID: {res.documentId?.slice(0, 8)}...</span>
                    <span>•</span>
                    <span>Chunk #{res.chunkIndex ?? 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-slate-500 bg-surface-950/40 rounded-xl border border-dashed border-white/5">
                {searching ? 'Calculating cosine similarities across vector space...' : 'No vector search queries executed yet. Type a query above to test agent retrieval.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Knowledge Base Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>Stored Knowledge Base Documents ({documents.length})</span>
          </h2>
          <button
            onClick={fetchDocuments}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Knowledge Base</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No documents in the knowledge base yet. Upload or ingest one above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Ingested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((doc) => (
                  <tr key={doc.id || doc._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-400 shrink-0" />
                      <span className="truncate max-w-xs">{doc.title}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-bold uppercase">
                        {doc.category || 'general'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {doc.chunkCount || doc.chunks?.length || 1} chunks
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspectChunks(doc.id || doc._id)}
                        className="px-2.5 py-1 rounded-lg bg-surface-950 border border-white/10 hover:border-brand-500/40 text-brand-400 hover:text-brand-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect Chunks</span>
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id || doc._id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Chunks Inspector */}
      {selectedDocChunks && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel border-brand-500/30 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl bg-surface-950">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-400" />
                <span>Chunk & Vector Inspector ({selectedDocChunks.length} Chunks)</span>
              </h3>
              <button
                onClick={() => setSelectedDocChunks(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {selectedDocChunks.map((c, i) => (
                <div key={i} className="p-3.5 bg-surface-900/80 border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-brand-400">Chunk #{c.chunkIndex ?? i}</span>
                    <span className="font-mono text-slate-500">Tokens: ~{Math.round((c.content?.length || 0) / 4)}</span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 text-right">
              <button
                onClick={() => setSelectedDocChunks(null)}
                className="px-4 py-2 bg-surface-850 hover:bg-surface-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
