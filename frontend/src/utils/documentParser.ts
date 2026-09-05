import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to load from unpkg CDN or bundled worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface ExtractedDocument {
  title: string;
  text: string;
  category: 'resume' | 'portfolio' | 'project' | 'financial' | 'general';
  wordCount: number;
  pageCount?: number;
  fileType: string;
}

/**
 * Extract text from PDF ArrayBuffer
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageStr) {
        pageTexts.push(`### Page ${i}\n${pageStr}`);
      }
    }

    return {
      text: pageTexts.join('\n\n'),
      pageCount: numPages,
    };
  } catch (err) {
    console.warn('PDF.js extraction fallback to stream scanner:', err);
    // Fallback stream scanner for uncompressed / plain text segments
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(arrayBuffer);
    const matches = raw.match(/\(([^()]{2,})\)\s*Tj/g) || raw.match(/\[([^\]]+)\]\s*TJ/g);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map((m) => m.replace(/^[([\\)]+|[)\\]+$/g, '').replace(/\\(\d{3})/g, ''))
        .join(' ');
      return { text: extracted, pageCount: 1 };
    }
    throw new Error('Unable to parse PDF text streams.');
  }
}

/**
 * Extract text from DOCX (ZIP XML structure)
 */
async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // A DOCX file is a ZIP archive containing word/document.xml
    // We decode the binary stream and extract XML paragraph text
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(arrayBuffer);
    const textMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (textMatches && textMatches.length > 0) {
      const cleanText = textMatches
        .map((m) => m.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ');
      return cleanText;
    }
    return '';
  } catch (err) {
    console.warn('DOCX extraction error:', err);
    return '';
  }
}

/**
 * Autonomous Document Classification Agent
 */
function classifyDocument(
  fileName: string,
  text: string
): 'resume' | 'portfolio' | 'project' | 'financial' | 'general' {
  const combined = (fileName + ' ' + text.slice(0, 3000)).toLowerCase();

  // Resume patterns
  if (
    combined.includes('resume') ||
    combined.includes('curriculum vitae') ||
    combined.includes('cv') ||
    combined.includes('work experience') ||
    combined.includes('education') ||
    combined.includes('skills') ||
    combined.includes('employment history') ||
    combined.includes('bachelor') ||
    combined.includes('master of science') ||
    combined.includes('software engineer') ||
    combined.includes('developer')
  ) {
    return 'resume';
  }

  // Venture / Pitch Deck / Startup patterns
  if (
    combined.includes('pitch') ||
    combined.includes('deck') ||
    combined.includes('tam') ||
    combined.includes('sam') ||
    combined.includes('saas') ||
    combined.includes('business plan') ||
    combined.includes('mvp') ||
    combined.includes('competitor') ||
    combined.includes('value proposition')
  ) {
    return 'project';
  }

  // Financial / Metrics patterns
  if (
    combined.includes('financial') ||
    combined.includes('revenue') ||
    combined.includes('balance sheet') ||
    combined.includes('ebitda') ||
    combined.includes('cash flow') ||
    combined.includes('pricing') ||
    combined.includes('mrr') ||
    combined.includes('arr')
  ) {
    return 'financial';
  }

  // Portfolio / Case Study patterns
  if (
    combined.includes('portfolio') ||
    combined.includes('case study') ||
    combined.includes('project showcase') ||
    combined.includes('client work')
  ) {
    return 'portfolio';
  }

  return 'general';
}

/**
 * Main Autonomous Document Extraction Agent
 */
export async function extractDocumentContent(file: File): Promise<ExtractedDocument> {
  const fileName = file.name;
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  let extractedText = '';
  let pageCount: number | undefined;

  const arrayBuffer = await file.arrayBuffer();

  if (extension === 'pdf') {
    const pdfResult = await extractTextFromPDF(arrayBuffer);
    extractedText = pdfResult.text;
    pageCount = pdfResult.pageCount;
  } else if (extension === 'docx' || extension === 'doc') {
    extractedText = await extractTextFromDOCX(arrayBuffer);
    if (!extractedText) {
      // Fallback to text decoder
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(arrayBuffer).replace(/[^\x20-\x7E\n\t]/g, ' ').replace(/\s+/g, ' ');
    }
  } else {
    // Text, Markdown, JSON, CSV, etc.
    const decoder = new TextDecoder('utf-8');
    extractedText = decoder.decode(arrayBuffer);
  }

  extractedText = extractedText.trim();

  if (!extractedText || extractedText.length < 5) {
    throw new Error(`Could not extract readable text from "${fileName}". Please ensure the file contains selectable text.`);
  }

  const category = classifyDocument(fileName, extractedText);
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

  return {
    title: fileName,
    text: extractedText,
    category,
    wordCount,
    pageCount,
    fileType: extension.toUpperCase(),
  };
}
