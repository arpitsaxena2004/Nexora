import { Types } from 'mongoose';
import { DocumentChunk } from '../models/Document';
import { EmbeddingService } from './embeddings';

export interface RAGQueryOptions {
  userId: string | Types.ObjectId;
  goalId?: string | Types.ObjectId;
  category?: string;
  topK?: number;
  minSimilarity?: number;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  sectionTitle?: string;
  sourceFilename: string;
  tokenCount: number;
}

export interface RAGRetrievalResult {
  query: string;
  chunksFound: number;
  chunks: RetrievedChunk[];
  formattedContext: string;
}

export class RetrievalService {
  /**
   * Retrieves the most semantically relevant document chunks for a given query.
   */
  static async retrieve(query: string, options: RAGQueryOptions): Promise<RAGRetrievalResult> {
    const topK = options.topK || 5;
    const minSimilarity = options.minSimilarity ?? 0.2;
    const userId = typeof options.userId === 'string' ? new Types.ObjectId(options.userId) : options.userId;

    if (!query || query.trim().length === 0) {
      return {
        query,
        chunksFound: 0,
        chunks: [],
        formattedContext: '',
      };
    }

    // 1. Generate Query Embedding
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // 2. Query Candidate Chunks from MongoDB for this User (and optionally Goal)
    const filter: Record<string, any> = { userId };
    if (options.goalId) {
      const gId = typeof options.goalId === 'string' ? new Types.ObjectId(options.goalId) : options.goalId;
      // Match chunks bound to this specific goal or global user documents
      filter.$or = [{ goalId: gId }, { goalId: { $exists: false } }, { goalId: null }];
    }

    const candidateChunks = await DocumentChunk.find(filter).lean();

    if (candidateChunks.length === 0) {
      return {
        query,
        chunksFound: 0,
        chunks: [],
        formattedContext: '',
      };
    }

    // 3. Compute Cosine Similarity for each candidate chunk
    const scoredChunks: RetrievedChunk[] = [];

    for (const chunk of candidateChunks) {
      let similarity = 0;
      if (chunk.embedding && chunk.embedding.length > 0) {
        similarity = EmbeddingService.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Fallback keyword overlap heuristic if embedding is missing
        const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const contentLower = chunk.content.toLowerCase();
        let matches = 0;
        for (const w of qWords) {
          if (contentLower.includes(w)) matches++;
        }
        similarity = qWords.length > 0 ? (matches / qWords.length) * 0.5 : 0;
      }

      if (similarity >= minSimilarity) {
        scoredChunks.push({
          chunkId: chunk._id.toString(),
          documentId: chunk.documentId.toString(),
          content: chunk.content,
          similarity: parseFloat(similarity.toFixed(4)),
          sectionTitle: chunk.metadata?.sectionTitle,
          sourceFilename: chunk.metadata?.sourceFilename || 'Document',
          tokenCount: chunk.tokenCount,
        });
      }
    }

    // 4. Sort descending by similarity and take topK
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scoredChunks.slice(0, topK);

    // 5. Format Context for Agent Injection
    const formattedContext = this.formatChunksForAgent(topChunks);

    return {
      query,
      chunksFound: topChunks.length,
      chunks: topChunks,
      formattedContext,
    };
  }

  /**
   * Formats retrieved chunks into clean markdown context with citations for LLM prompt injection.
   */
  static formatChunksForAgent(chunks: RetrievedChunk[]): string {
    if (!chunks || chunks.length === 0) {
      return '';
    }

    return chunks
      .map((c, i) => {
        const header = `[Source ${i + 1}: ${c.sourceFilename}${c.sectionTitle ? ` | ${c.sectionTitle}` : ''} (Relevance: ${(c.similarity * 100).toFixed(0)}%)]`;
        return `${header}\n${c.content}`;
      })
      .join('\n\n---\n\n');
  }
}
