
export enum AssetStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  GENERATED = 'generated',
  APPROVED = 'approved',
  USER_UPLOADED = 'user-uploaded',
  ERROR = 'error',
}

export interface BaseAsset {
  id: string;
  status: AssetStatus;
  type?: AssetType; // Added: To identify the kind of asset
  aiPrompt?: string;
  aiGeneratedUrl?: string; // For images
  aiGeneratedContent?: string; // For text (quotes, descriptions)
  userUploadedFile?: File;
  userUploadedUrl?: string; // Preview for user uploaded image/data
  userUploadedContent?: string; // Added: For user uploaded text content
  finalUrl?: string; // The URL/content that is "approved" or "user-uploaded"
  finalContent?: string; // For text based assets
  error?: string;
}

export interface Chapter {
  id: string;
  title: string;
  rawContent: string; // Keep raw content for potential detailed summary later
  contentSummary: string;
  backgroundImage: BaseAsset;
  interactiveElement: BaseAsset;
  diagram: BaseAsset;
  chartInfographic: BaseAsset;
  motivationalQuote: BaseAsset;
}

export interface EbookStructure {
  rawText: string;
  rawToc: string;
  title: string;
  summary: string; // Overall eBook summary
  chapters: Chapter[];
  coverImage: BaseAsset;
}

export enum GenerationPhase {
  DOCUMENT_INPUT = 'DOCUMENT_INPUT',
  COVER_DESIGN = 'COVER_DESIGN',
  BACKGROUND_IMAGES = 'BACKGROUND_IMAGES',
  INTERACTIVE_ELEMENTS = 'INTERACTIVE_ELEMENTS',
  DIAGRAMS = 'DIAGRAMS',
  CHARTS_INFOGRAPHICS = 'CHARTS_INFOGRAPHICS',
  MOTIVATIONAL_QUOTES = 'MOTIVATIONAL_QUOTES',
  REVIEW_AND_DOWNLOAD = 'REVIEW_AND_DOWNLOAD',
  FINALIZE_EBOOK = 'FINALIZE_EBOOK',
}

export type AssetType = 'coverImage' | 'backgroundImage' | 'interactiveElement' | 'diagram' | 'chartInfographic' | 'motivationalQuote';

// For Gemini API structured responses (example)
export interface DiagramConcept {
  type: 'loop' | 'timeline' | 'pyramid' | 'grid' | 'other';
  description: string;
  labels: string[];
  subtitle: string;
}

export interface InteractiveElementConcept {
  type: 'tracker' | 'journal' | 'checklist';
  description: string;
  visualElements: string[]; // e.g. ["motivational icons", "soft gradients"]
}