import { Types } from 'mongoose';
import { Document, DocumentChunk } from '../models/Document';
import { splitTextIntoChunks, estimateTokenCount } from './chunking';
import { EmbeddingService } from './embeddings';
import { LLMService } from '../services/llm.service';
import { IDocument } from '../types';

export interface IngestDocumentInput {
  userId: string | Types.ObjectId;
  goalId?: string | Types.ObjectId;
  filename: string;
  originalName?: string;
  mimeType?: string;
  content: string;
  category?: 'resume' | 'business_plan' | 'financial' | 'job_description' | 'research' | 'other';
  maxChunkSize?: number;
  chunkOverlap?: number;
}

export class IngestionService {
  /**
   * Detects the category of a document if not explicitly provided.
   */
  static detectCategory(content: string, filename: string): 'resume' | 'business_plan' | 'financial' | 'job_description' | 'research' | 'other' {
    const textLower = (content + ' ' + filename).toLowerCase();

    if (/resume|curriculum vitae|\bcv\b|work experience|education|skills|gpa|projects/i.test(textLower)) {
      return 'resume';
    }
    if (/business plan|executive summary|market opportunity|tam|sam|som|go-to-market|revenue model|pricing/i.test(textLower)) {
      return 'business_plan';
    }
    if (/job description|qualifications|requirements|responsibilities|role overview|years of experience required/i.test(textLower)) {
      return 'job_description';
    }
    if (/financial|ebitda|balance sheet|cash flow|projections|unit economics|cac|ltv/i.test(textLower)) {
      return 'financial';
    }
    if (/research|whitepaper|abstract|methodology|literature review|findings|citation/i.test(textLower)) {
      return 'research';
    }
    return 'other';
  }

  /**
   * Generates a concise summary of the ingested document.
   */
  static async generateSummary(content: string, category: string): Promise<string> {
    const preview = content.substring(0, 3000);
    try {
      const response = await LLMService.generateText({
        systemPrompt: 'You are an expert document summarizer in Nexora RAG system. Provide a clear, 2-3 sentence executive summary of the document highlighting key details, skills, or findings.',
        prompt: `Document Category: ${category}\nContent Preview:\n${preview}\n\nSummary:`,
        temperature: 0.3,
      });
      return response.text.trim();
    } catch {
      // Heuristic fallback summary
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      return lines.slice(0, 3).join('. ');
    }
  }

  /**
   * Ingests, processes, chunks, embeds, and saves a document into the Knowledge Hub.
   */
  static async ingestDocument(input: IngestDocumentInput): Promise<IDocument> {
    const userId = typeof input.userId === 'string' ? new Types.ObjectId(input.userId) : input.userId;
    const goalId = input.goalId ? (typeof input.goalId === 'string' ? new Types.ObjectId(input.goalId) : input.goalId) : undefined;
    const originalName = input.originalName || input.filename;
    const mimeType = input.mimeType || 'text/plain';
    const fileSizeBytes = Buffer.byteLength(input.content, 'utf8');

    const category = input.category || this.detectCategory(input.content, originalName);

    // 1. Create Document Record in MongoDB
    const doc = await Document.create({
      userId,
      goalId,
      filename: input.filename,
      originalName,
      mimeType,
      fileSizeBytes,
      storagePath: `memory://${input.filename}`,
      status: 'processing',
      category,
    });

    try {
      // 2. Generate summary
      const summary = await this.generateSummary(input.content, category);

      // 3. Chunk text
      const rawChunks = splitTextIntoChunks(input.content, {
        maxChunkSize: input.maxChunkSize || 500,
        chunkOverlap: input.chunkOverlap || 80,
      });

      if (rawChunks.length === 0) {
        doc.status = 'indexed';
        doc.chunkCount = 0;
        doc.summary = summary;
        await doc.save();
        return doc;
      }

      // 4. Generate Embeddings for all chunks
      const chunkEmbeddings = await EmbeddingService.generateBatchEmbeddings(
        rawChunks.map(c => c.content)
      );

      // 5. Persist Document Chunks
      const chunkDocs = rawChunks.map((chunk, index) => ({
        documentId: doc._id,
        userId,
        goalId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        embedding: chunkEmbeddings[index],
        metadata: {
          sectionTitle: chunk.sectionTitle,
          sourceFilename: originalName,
          fileType: mimeType,
        },
      }));

      await DocumentChunk.insertMany(chunkDocs);

      // 6. Update Document Status
      doc.status = 'indexed';
      doc.chunkCount = rawChunks.length;
      doc.summary = summary;
      await doc.save();

      return doc;
    } catch (err: any) {
      doc.status = 'failed';
      await doc.save();
      throw new Error(`Document ingestion failed: ${err.message}`);
    }
  }

  /**
   * Deletes a document and all associated chunks.
   */
  static async deleteDocument(documentId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    const docId = typeof documentId === 'string' ? new Types.ObjectId(documentId) : documentId;
    const uId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const doc = await Document.findOne({ _id: docId, userId: uId });
    if (!doc) return false;

    await DocumentChunk.deleteMany({ documentId: docId });
    await Document.deleteOne({ _id: docId });
    return true;
  }
}
