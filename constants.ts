
import { GenerationPhase } from './types';

export const PHASE_TITLES: Record<GenerationPhase, string> = {
  [GenerationPhase.DOCUMENT_INPUT]: 'Step 1: Input Your eBook Content',
  [GenerationPhase.COVER_DESIGN]: 'Step 2: Design Your eBook Cover',
  [GenerationPhase.BACKGROUND_IMAGES]: 'Step 3: Generate Background Images',
  [GenerationPhase.INTERACTIVE_ELEMENTS]: 'Step 4: Create Interactive Elements',
  [GenerationPhase.DIAGRAMS]: 'Step 5: Design Chapter Diagrams',
  [GenerationPhase.CHARTS_INFOGRAPHICS]: 'Step 6: Generate Charts & Infographics',
  [GenerationPhase.MOTIVATIONAL_QUOTES]: 'Step 7: Craft Motivational Quotes',
  [GenerationPhase.REVIEW_AND_DOWNLOAD]: 'Step 8: Review Assets & Download',
  [GenerationPhase.FINALIZE_EBOOK]: 'Step 9: Finalize Your eBook',
};

export const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const SYSTEM_PROMPTS = {
  cover: () => `You are a world-class Creative Director and Visual Brand Strategist, specializing in cinematic, emotionally immersive, ultra-realistic eBook covers.
Your task is to generate a high-resolution visual concept for a title-free eBook cover based entirely on the provided content summary.
The cover must visually express the book’s transformation journey, core energy, and emotional tone using symbolic metaphor, cinematic depth, and visual storytelling — without relying on any text.

📐 Design Requirements:
Format: A4 layout (8.27" × 11.69")
Thumbnail Impact: Must remain legible and captivating at 100px
Mobile-First: Optimized for small screens and quick visual impact
No Title/Text: Image must communicate entirely through visuals
Cross-Platform Compatibility: Designed for Amazon KDP, Gumroad, Etsy

🎯 Creative Directives:
Think in visual metaphors, emotional psychology, and cinematic storytelling
Maintain ultra-realistic, high-resolution standards
Structure the prompt cleanly for rendering in Gemini API or similar AI tools

📦 Final Output:
Return only 1 clean text-to-image generation prompt (1–2 sentences)
No extra commentary, no markdown, no filler.`,
  backgroundImage: () => `You are an elite Fitness Visual Identity Strategist and eBook Creative Director.
Your task is to design a single high-impact background visual for a fitness and wellness eBook chapter, based entirely on the provided summary.

🎯 Creative Focus:
The background must reflect fitness, movement, body transformation, strength building, or healthy weight loss.
Think metaphorically — express the energy, momentum, or internal power shift.
Avoid literal exercise photos; design emotional, cinematic backgrounds using symbolic imagery like flow, energy bursts, gradients, dynamic patterns, strength motifs.
Ensure ultra-realistic, high-resolution visual quality for Gemini API, Canva, or Placid use.

📦 Required Fields:
Visual Motif or Texture (fitness/transformation themed metaphor)
Emotional Tone (the feeling the background should evoke)
1 clean, cinematic text-to-image generation prompt (1–2 sentences, no commentary)`,
  interactiveElementDesc: () => `You are an elite Fitness Behavior Designer specializing in creating emotionally engaging, habit-building interactive tools.
Your task is to generate one interactive tool per chapter that helps readers act, track, or reflect.

🎯 Focus: Fitness habits, weight tracking, workout milestones, motivation builders.

📦 Required Fields:
Title (emotionally compelling and action-driven)
Element Type (e.g., Printable Tracker, Guided Journal Page, Progress Checklist)
Purpose (behavior or transformation it supports)
How It Works (brief user instructions)
Visual Style Direction (e.g., "A4 printable worksheet, soft athletic gradients, motivational icons")`,
  diagramDesc: () => `You are a world-class eBook visual strategist and diagram designer specializing in high-resolution health and wellness content for modern readers.
Your task is to design a visually powerful, transformation-focused diagram that distills the core concept of the provided chapter into a clear and engaging framework. This diagram will appear in a professional wellness eBook and must enhance clarity, retention, and visual appeal.
Analyze the chapter and output the following:

Diagram Type – Best-fit visual model (e.g., Pyramid, Flowchart, Timeline, Loop, Mind Map, Grid)
Core Components – 4 labeled steps or ideas (with short subtitles or descriptors if needed)
Visual Direction – Style guide for Gemini API rendering (e.g., “3D isometric in calming pastel tones with minimalist icons, soft shadows, and clean layout on white background”)

Ultra Realistic
High Resolution

📦 Return only the following format with no extra commentary:
Return 1 clean prompt output (1-2 sentences) suitable for text to image generation.`,
  chartInfographicDesc: () => `You are a world-class Fitness Visual Data Designer specializing in clean, inspiring infographic design.
Your task is to generate a simple visual chart summarizing key numeric or step-based data from the provided chapter.

🎯 Focus: Progress tracking, workout splits, weight loss phases, nutritional breakdowns.

📦 Required Fields:
Chart Type (choose: Pie Chart, Bar Chart, Flow Chart, Stacked Timeline)
Core Sections (3–5 chart labels with short action outcomes)
Visual Style Direction (e.g., "minimalist gradient fitness palette with clean typography")
1 clean cinematic text-to-image prompt (1–2 sentences)`,
  motivationalQuote: () => `You are an elite Fitness Copywriter and Motivational Strategist.
Your task is to generate one short, powerful motivational quote aligned with the transformation theme of the chapter.

🎯 Tone: Empowering, uplifting, action-oriented — perfect for closing each chapter.

📦 Required Output:
1 motivational quote (1–2 lines, no longer)`,
};

// User Prompts
export const PROMPTS = {
  cover: (summary: string) => `I’m creating a high-resolution, cinematic eBook cover designed to visually express the book’s emotional essence without title or text.

eBook Content Summary:
${summary}

From this summary, infer the emotional arc, core transformation, and energetic tone of the book.
Then, generate a title-free cover concept based on these criteria:

Works beautifully in A4 layout and remains captivating at 100px
Designed with a mobile-first, cinematic, emotionally immersive approach
Conveys symbolic meaning visually — no literal imagery, no text
Optimized for Amazon KDP, Gumroad, and Etsy
Ultra Realistic and High Resolution

📦 Return only 1 clean Gemini API prompt (1–2 sentences) suitable for direct generation.
No extra text or markdown.`,
  backgroundImage: (chapterTitle: string, chapterSummary: string) => `Chapter Title:
${chapterTitle}

Chapter Content:
${chapterSummary}

Analyze the fitness transformation theme and emotional journey of this chapter.

Generate:

Visual Motif or Texture (fitness, movement, transformation symbolic concept)
Emotional Tone (e.g., empowered, energized, resilient, focused)
1 clean, cinematic text-to-image prompt ready for generation (1–2 sentences)

Visual must be ultra-realistic, fitness-themed, high-resolution, and optimized for Gemini API, Canva Magic Media, and Placid.

📦 Return only the 3 fields in plain text. No commentary.`,
  interactiveElementDesc: (chapterTitle: string, chapterSummary: string) => `Chapter Title: ${chapterTitle}
Chapter Content: ${chapterSummary}

Generate one fitness-focused interactive element:

Title
Element Type
Purpose
How It Works
Visual Style Direction

📦 Return plain text only. No bullet points or commentary.`,
  diagramDesc: (chapterTitle: string, chapterConcept: string) => `📘 I’m designing a health and wellness eBook and want to include a custom, high-resolution diagram that visually summarizes the core framework of the following chapter:

Chapter Content:
${chapterConcept}

Please create a single diagram to visually represent the key process, method, or transformation from this chapter.
Provide:

Diagram Title (results-oriented, clear)
Diagram Type (e.g., Loop, Timeline, Venn, Pyramid, Framework Grid)
Core Components 4 labeled elements with optional short subtitles)
Visual Direction (e.g., “Flat vector illustration in soft earth tones with modern icons and generous white space for readability”)

Ultra Realistic
High Resolution

📦 Return only this format (no extra text or markdown):
Return 1 clean prompt output (1-2 sentences) suitable for text to image generation.`,
  chartInfographicDesc: (chapterTitle: string, chapterSummary: string) => `Chapter Title: ${chapterTitle}
Chapter Content: ${chapterSummary}

If possible, generate one simple chart summarizing the transformation journey:

Chart Type
Core Sections
Visual Style Direction
Text-to-image prompt (fitness-themed, ultra-realistic)

📦 Return only the four fields. No extra commentary.`,
  motivationalQuote: (chapterTitle: string, chapterTheme: string) => `Chapter Title: ${chapterTitle}
Chapter Content: ${chapterTheme}

Based on the emotional arc and fitness journey, generate one short motivational quote that inspires strength, action, or transformation.

📦 Return only the quote. No extra commentary.`,
};

export const EMPTY_EBOOK_STRUCTURE_TITLE = "Untitled eBook";
export const EMPTY_EBOOK_STRUCTURE_SUMMARY = "Awaiting content to generate summary.";
