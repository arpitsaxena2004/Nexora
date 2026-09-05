import { Schema, model } from 'mongoose';
import { IDocument, IDocumentChunk } from '../types';

const documentChunkSchema = new Schema<IDocumentChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    tokenCount: { type: Number, required: true },
    embedding: { type: [Number], index: false }, // Supports vector similarity indexing
    metadata: {
      pageNumber: { type: Number },
      sectionTitle: { type: String },
      sourceFilename: { type: String, required: true },
      fileType: { type: String, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const documentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'indexed', 'failed'],
      default: 'uploaded',
    },
    chunkCount: { type: Number, default: 0 },
    summary: { type: String },
    category: {
      type: String,
      enum: ['resume', 'business_plan', 'financial', 'job_description', 'research', 'other'],
      default: 'other',
    },
  },
  { timestamps: true }
);

export const Document = model<IDocument>('Document', documentSchema);
export const DocumentChunk = model<IDocumentChunk>('DocumentChunk', documentChunkSchema);
