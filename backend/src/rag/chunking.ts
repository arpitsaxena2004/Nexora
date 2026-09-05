export interface ChunkOptions {
  maxChunkSize?: number; // Characters per chunk (default 500)
  chunkOverlap?: number; // Character overlap between adjacent chunks (default 80)
  preserveParagraphs?: boolean;
}

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionTitle?: string;
}

/**
 * Estimates the token count from raw text string (~4 characters per token average).
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const charTokens = Math.ceil(text.length / 4);
  return Math.max(words, charTokens);
}

/**
 * Detects header or section titles in text chunks for enriched RAG metadata.
 */
function extractSectionTitle(chunkText: string): string | undefined {
  const lines = chunkText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return undefined;

  const firstLine = lines[0];
  // Check for Markdown headers (e.g. # Title, ## Subtitle)
  if (/^#{1,4}\s+(.+)/.test(firstLine)) {
    return firstLine.replace(/^#{1,4}\s+/, '').trim();
  }

  // Check for UPPERCASE header labels (e.g. "EXPERIENCE:", "EDUCATION", "SUMMARY")
  if (/^[A-Z\s]{3,30}:?$/.test(firstLine)) {
    return firstLine.replace(':', '').trim();
  }

  return undefined;
}

/**
 * Splits raw document text into overlapping chunks with semantic boundaries (paragraphs -> sentences -> words).
 */
export function splitTextIntoChunks(
  rawText: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const maxChunkSize = options.maxChunkSize || 500;
  const chunkOverlap = Math.min(options.chunkOverlap ?? 80, Math.floor(maxChunkSize / 2));

  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const normalized = rawText.replace(/\r\n/g, '\n').trim();

  // If the total text fits within one chunk, return immediately
  if (normalized.length <= maxChunkSize) {
    return [
      {
        chunkIndex: 0,
        content: normalized,
        tokenCount: estimateTokenCount(normalized),
        sectionTitle: extractSectionTitle(normalized),
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;
  let currentSectionTitle: string | undefined = undefined;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + maxChunkSize;

    if (endIndex >= normalized.length) {
      endIndex = normalized.length;
    } else {
      // Find the best split boundary before maxChunkSize
      // 1. Paragraph boundary: '\n\n'
      const paragraphBreak = normalized.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > startIndex + chunkOverlap) {
        endIndex = paragraphBreak + 2;
      } else {
        // 2. Line boundary: '\n'
        const lineBreak = normalized.lastIndexOf('\n', endIndex);
        if (lineBreak > startIndex + chunkOverlap) {
          endIndex = lineBreak + 1;
        } else {
          // 3. Sentence boundary: '. ', '! ', '? '
          const sentenceBreak = Math.max(
            normalized.lastIndexOf('. ', endIndex),
            normalized.lastIndexOf('! ', endIndex),
            normalized.lastIndexOf('? ', endIndex)
          );
          if (sentenceBreak > startIndex + chunkOverlap) {
            endIndex = sentenceBreak + 2;
          } else {
            // 4. Word boundary: ' '
            const wordBreak = normalized.lastIndexOf(' ', endIndex);
            if (wordBreak > startIndex + chunkOverlap) {
              endIndex = wordBreak + 1;
            }
          }
        }
      }
    }

    const chunkContent = normalized.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      const detectedSection = extractSectionTitle(chunkContent);
      if (detectedSection) {
        currentSectionTitle = detectedSection;
      }

      chunks.push({
        chunkIndex,
        content: chunkContent,
        tokenCount: estimateTokenCount(chunkContent),
        sectionTitle: detectedSection || currentSectionTitle,
      });
      chunkIndex++;
    }

    if (endIndex >= normalized.length) {
      break;
    }

    // Step forward by (endIndex - chunkOverlap)
    startIndex = Math.max(endIndex - chunkOverlap, startIndex + 1);
  }

  return chunks;
}
