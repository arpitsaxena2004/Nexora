import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { IngestionService } from '../rag/ingestion';
import { RetrievalService } from '../rag/retrieval';
import { MemoryManager } from '../memory/memoryManager';
import { Document, DocumentChunk } from '../models/Document';

const router = Router();

const ingestDocumentSchema = z.object({
  filename: z.string().optional(),
  title: z.string().optional(),
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
  content: z.string().min(1, 'Content cannot be empty'),
  category: z.string().optional(),
  goalId: z.string().optional(),
  maxChunkSize: z.number().min(50).max(2000).optional(),
  chunkOverlap: z.number().min(0).max(500).optional(),
  tags: z.array(z.string()).optional(),
});

const queryKnowledgeSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  goalId: z.string().optional(),
  category: z.string().optional(),
  topK: z.number().min(1).max(20).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
});

/**
 * @route   POST /api/knowledge/documents
 * @desc    Ingest, process, chunk, embed, and index a document into RAG Knowledge Hub
 * @access  Private
 */
router.post(
  '/documents',
  authenticate,
  validate(ingestDocumentSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filename = req.body.filename || req.body.title || 'Document.txt';
      const doc = await IngestionService.ingestDocument({
        userId: req.user!._id,
        goalId: req.body.goalId,
        filename,
        originalName: req.body.originalName || req.body.title || filename,
        mimeType: req.body.mimeType || 'text/plain',
        content: req.body.content,
        category: (req.body.category as any) || 'other',
        maxChunkSize: req.body.maxChunkSize,
        chunkOverlap: req.body.chunkOverlap,
      });

      res.status(201).json({
        message: 'Document successfully ingested and indexed for semantic search',
        document: doc,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Ingestion failed', details: err.message });
    }
  }
);

/**
 * @route   GET /api/knowledge/documents
 * @desc    List all indexed documents for the authenticated user
 * @access  Private
 */
router.get(
  '/documents',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filter: Record<string, any> = { userId: req.user!._id };
      if (req.query.goalId) filter.goalId = req.query.goalId;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.status) filter.status = req.query.status;

      const documents = await Document.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ documents });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch documents', details: err.message });
    }
  }
);

/**
 * @route   GET /api/knowledge/documents/:id
 * @desc    Get document details and indexed chunks
 * @access  Private
 */
router.get(
  '/documents/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const document = await Document.findOne({
        _id: req.params.id,
        userId: req.user!._id,
      }).lean();

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      const chunks = await DocumentChunk.find({ documentId: document._id })
        .sort({ chunkIndex: 1 })
        .select('-embedding') // Omit raw high-dim vector in basic response
        .lean();

      res.json({ document, chunks });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch document', details: err.message });
    }
  }
);

/**
 * @route   DELETE /api/knowledge/documents/:id
 * @desc    Delete document and all associated chunks
 * @access  Private
 */
router.delete(
  '/documents/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await IngestionService.deleteDocument(req.params.id, req.user!._id);
      if (!success) {
        res.status(404).json({ error: 'Document not found or already deleted' });
        return;
      }

      res.json({ message: 'Document and its vector chunks deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete document', details: err.message });
    }
  }
);

/**
 * @route   POST /api/knowledge/query
 * @desc    Perform semantic vector search across indexed knowledge chunks
 * @access  Private
 */
router.post(
  '/query',
  authenticate,
  validate(queryKnowledgeSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await RetrievalService.retrieve(req.body.query, {
        userId: req.user!._id,
        goalId: req.body.goalId,
        category: req.body.category,
        topK: req.body.topK || 5,
        minSimilarity: req.body.minSimilarity,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Knowledge search failed', details: err.message });
    }
  }
);

/**
 * @route   GET /api/knowledge/memory
 * @desc    Inspect 3-tier memory context for the current user and goal
 * @access  Private
 */
router.get(
  '/memory',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const goalId = req.query.goalId as string | undefined;
      const query = req.query.query as string | undefined;

      const memory = await MemoryManager.assembleAgentMemory({
        userId: req.user!._id,
        goalId,
        query,
      });

      res.json(memory);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to assemble memory', details: err.message });
    }
  }
);

export default router;
