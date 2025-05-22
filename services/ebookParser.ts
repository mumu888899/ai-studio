
import { Chapter, AssetStatus, BaseAsset, EbookStructure, AssetType } from '../types';
import { generateTextGemini } from './geminiService';
import { EMPTY_EBOOK_STRUCTURE_TITLE, EMPTY_EBOOK_STRUCTURE_SUMMARY } from '../constants';


export function createEmptyAsset(id: string, type: AssetType): BaseAsset {
  return {
    id,
    type,
    status: AssetStatus.IDLE,
    aiGeneratedUrl: undefined,
    aiGeneratedContent: undefined,
    userUploadedFile: undefined,
    userUploadedUrl: undefined,
    userUploadedContent: undefined,
    finalUrl: undefined,
    finalContent: undefined,
    error: undefined,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Renamed to clearly indicate AI usage
async function summarizeTextAI(text: string, desiredWordCount: number = 50): Promise<string> {
  if (!text.trim()) return "No content to summarize.";
  try {
    // The prompt to Gemini asks for "about X words", it's not a strict limit.
    const summary = await generateTextGemini(`Summarize the following text in about ${desiredWordCount} words: "${text.substring(0, 2000)}"`); // Limit input to Gemini
    return summary;
  } catch (error) {
    console.warn("AI summarization failed, using truncation:", error);
    const words = text.split(/\s+/);
    const truncatedSummary = words.slice(0, desiredWordCount + 20).join(" "); // Truncate to a bit more than desired
    return truncatedSummary + (words.length > (desiredWordCount + 20) ? "..." : "");
  }
}

// New function for on-demand AI summarization, exported for use in App.tsx
export async function summarizeTextIfNeeded(rawText: string, desiredWordCount: number = 50): Promise<string> {
    if (!rawText || !rawText.trim()) return "No content provided.";
    // If rawText is already short enough, just return it, no need to call AI
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount <= desiredWordCount + 10) { // Add a small buffer
        return rawText;
    }
    return summarizeTextAI(rawText, desiredWordCount);
}


// Creates a basic truncated summary without calling AI
function createBasicSummary(text: string, maxLength: number = 200): string {
  if (!text.trim()) return "No content provided.";
  if (text.length <= maxLength) return text;
  const CROP_SENTINEL = "...";
  let summary = text.substring(0, maxLength - CROP_SENTINEL.length);
  // Try to cut at a word boundary
  const lastSpace = summary.lastIndexOf(' ');
  if (lastSpace > 0) {
    summary = summary.substring(0, lastSpace);
  }
  return summary + CROP_SENTINEL;
}


export async function parseEbookContent(rawText: string, rawToc: string): Promise<Pick<EbookStructure, 'title' | 'summary' | 'chapters'>> {
  const tocLines = rawToc.split('\n').filter(line => line.trim() !== '');
  const chapters: Chapter[] = [];

  let ebookTitle = EMPTY_EBOOK_STRUCTURE_TITLE;
  if (tocLines.length > 0) {
      if (!tocLines[0].toLowerCase().includes("chapter")) {
          ebookTitle = tocLines[0];
      }
  } else if (rawText.trim().length > 0) {
      const firstLine = rawText.split('\n')[0].trim();
      if (firstLine.length < 100) ebookTitle = firstLine;
  }

  // Overall summary will be a basic truncated summary initially.
  // App.tsx can decide if it needs an AI summary for the cover later.
  let overallSummary = createBasicSummary(rawText, 500);


  if (tocLines.length === 0) {
    if (rawText.trim()) {
        const chapterId = `chapter-1`;
        const chapterTitle = ebookTitle !== EMPTY_EBOOK_STRUCTURE_TITLE ? ebookTitle : "Main Content";
        // Use basic summary for chapters during parsing
        const contentSummary = createBasicSummary(rawText);
        chapters.push({
            id: chapterId,
            title: chapterTitle,
            rawContent: rawText,
            contentSummary: contentSummary,
            backgroundImage: createEmptyAsset(`${chapterId}-bg`, 'backgroundImage'),
            interactiveElement: createEmptyAsset(`${chapterId}-ie`, 'interactiveElement'),
            diagram: createEmptyAsset(`${chapterId}-dg`, 'diagram'),
            chartInfographic: createEmptyAsset(`${chapterId}-ci`, 'chartInfographic'),
            motivationalQuote: createEmptyAsset(`${chapterId}-mq`, 'motivationalQuote'),
        });
    }
  } else {
    let currentTextPosition = 0;
    for (let i = 0; i < tocLines.length; i++) {
      const chapterId = `chapter-${i + 1}`;
      const rawChapterTitle = tocLines[i].trim();
      const cleanedChapterTitle = rawChapterTitle.replace(/^(chapter\s*\d+\s*[:.-]?\s*)/i, '').trim();

      let chapterContent = "";
      const escapedTitle = escapeRegExp(cleanedChapterTitle);
      const chapterStartRegex = new RegExp(`(?:${escapedTitle}|chapter\\s*${i + 1}\\s*[:.-])`, 'i');
      const match = rawText.substring(currentTextPosition).match(chapterStartRegex);

      let startIndexInSubstring = -1;
      if (match && typeof match.index === 'number') {
        // Include the matched title in the chapter content if it's part of the body text
        // For simplicity, we'll start content AFTER the title marker for now.
        startIndexInSubstring = match.index + match[0].length;
      }

      let endIndexInSubstring = rawText.substring(currentTextPosition).length;

      if (i + 1 < tocLines.length) {
        const nextRawChapterTitle = tocLines[i+1].trim();
        const nextCleanedChapterTitle = nextRawChapterTitle.replace(/^(chapter\s*\d+\s*[:.-]?\s*)/i, '').trim();
        const nextEscapedTitle = escapeRegExp(nextCleanedChapterTitle);
        const nextChapterStartRegex = new RegExp(`(?:${nextEscapedTitle}|chapter\\s*${i + 2}\\s*[:.-])`, 'i');

        // Search for the next chapter's title from the start of the current chapter's content
        const searchBaseForNext = startIndexInSubstring !== -1 ? rawText.substring(currentTextPosition + startIndexInSubstring) : rawText.substring(currentTextPosition);
        const nextMatch = searchBaseForNext.match(nextChapterStartRegex);

        if (nextMatch && typeof nextMatch.index === 'number') {
          endIndexInSubstring = (startIndexInSubstring > -1 ? startIndexInSubstring : 0) + nextMatch.index;
        }
      }

      if (startIndexInSubstring !== -1) {
         chapterContent = rawText.substring(currentTextPosition + startIndexInSubstring, currentTextPosition + endIndexInSubstring).trim();
         // Update currentTextPosition to the end of the extracted content for this chapter
         currentTextPosition += endIndexInSubstring;
      } else {
        // Fallback if chapter title isn't found clearly in text.
        // This part might need more sophisticated logic for texts without clear markers matching ToC.
        // For now, it might lead to empty chapters if markers are missing.
        // A simple proportional split could be an alternative fallback for texts without explicit chapter markers.
        chapterContent = ``; // Content for '${cleanedChapterTitle}' could not be reliably parsed.
        // If no chapter content could be found, we should not advance currentTextPosition based on this chapter.
      }

      const contentSummary = createBasicSummary(chapterContent); // Basic summary

      chapters.push({
        id: chapterId,
        title: cleanedChapterTitle,
        rawContent: chapterContent,
        contentSummary: contentSummary || "No content for this chapter.",
        backgroundImage: createEmptyAsset(`${chapterId}-bg`, 'backgroundImage'),
        interactiveElement: createEmptyAsset(`${chapterId}-ie`, 'interactiveElement'),
        diagram: createEmptyAsset(`${chapterId}-dg`, 'diagram'),
        chartInfographic: createEmptyAsset(`${chapterId}-ci`, 'chartInfographic'),
        motivationalQuote: createEmptyAsset(`${chapterId}-mq`, 'motivationalQuote'),
      });
    }
  }

  if (chapters.length === 0 && rawText.trim().length > 0) {
    const chapterId = `chapter-1`;
    const chapterTitle = "Introduction";
    const contentSummary = createBasicSummary(rawText);
    chapters.push({
        id: chapterId,
        title: chapterTitle,
        rawContent: rawText,
        contentSummary: contentSummary,
        backgroundImage: createEmptyAsset(`${chapterId}-bg`, 'backgroundImage'),
        interactiveElement: createEmptyAsset(`${chapterId}-ie`, 'interactiveElement'),
        diagram: createEmptyAsset(`${chapterId}-dg`, 'diagram'),
        chartInfographic: createEmptyAsset(`${chapterId}-ci`, 'chartInfographic'),
        motivationalQuote: createEmptyAsset(`${chapterId}-mq`, 'motivationalQuote'),
    });
    if(ebookTitle === EMPTY_EBOOK_STRUCTURE_TITLE) ebookTitle = chapterTitle;
  }

  return {
    title: ebookTitle,
    summary: overallSummary,
    chapters,
  };
}
