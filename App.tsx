
import React, { useState, useCallback, useEffect } from 'react';
import { EbookStructure, GenerationPhase, Chapter, AssetStatus, BaseAsset, AssetType } from './types';
import { PHASE_TITLES, EMPTY_EBOOK_STRUCTURE_TITLE, EMPTY_EBOOK_STRUCTURE_SUMMARY } from './constants';
import DocumentInputPhase from './components/DocumentInputPhase';
import CoverPhase from './components/CoverPhase';
import ChapterAssetsPhase from './components/ChapterAssetsPhase';
import ReviewPhase from './components/ReviewPhase';
import FinalizePhase from './components/FinalizePhase';
import PhaseStepper from './components/PhaseStepper';
import { parseEbookContent, createEmptyAsset, summarizeTextIfNeeded } from './services/ebookParser';
import { generateTextGemini } from './services/geminiService';
import { generateImageFromBackend } from './services/backendImageService';
import Button from './components/ui/Button';
import { AlertTriangle, CheckCircle, BookOpenText, Trash2 } from './components/icons';
import LoadingSpinner from './components/ui/LoadingSpinner';

interface CustomPrompts {
  system?: string;
  user: string;
}

// Helper to parse a specific field's value from multi-line text output
const parseLineValue = (text: string, fieldName: string): string => {
  const lines = text.split('\n');
  const line = lines.find(l => l.toLowerCase().startsWith(fieldName.toLowerCase() + ':'));
  if (line) {
    return line.substring(line.indexOf(':') + 1).trim();
  }
  // Fallback for fields that might be the only content or direct output
  if (lines.length === 1 && (fieldName.toLowerCase().includes("prompt") || fieldName.toLowerCase().includes("quote"))) return lines[0].trim();
  // More specific fallback for quotes
  if (fieldName.toLowerCase().includes("quote") && text.split('\n').filter(Boolean).length <= 2) return text.trim();

  return '';
};

const phaseToAssetTypeMap: Partial<Record<GenerationPhase, AssetType>> = {
  [GenerationPhase.COVER_DESIGN]: 'coverImage',
  [GenerationPhase.BACKGROUND_IMAGES]: 'backgroundImage',
  [GenerationPhase.INTERACTIVE_ELEMENTS]: 'interactiveElement',
  [GenerationPhase.DIAGRAMS]: 'diagram',
  [GenerationPhase.CHARTS_INFOGRAPHICS]: 'chartInfographic',
  [GenerationPhase.MOTIVATIONAL_QUOTES]: 'motivationalQuote',
};


const App: React.FC = () => {
  const [ebookStructure, setEbookStructure] = useState<EbookStructure | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GenerationPhase>(GenerationPhase.DOCUMENT_INPUT);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [isGeminiKeyAvailable, setIsGeminiKeyAvailable] = useState<boolean>(false);

  useEffect(() => {
    const geminiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY;
    const geminiKeyIsSet = !!geminiKey;
    setIsGeminiKeyAvailable(geminiKeyIsSet);

    if (!geminiKeyIsSet) {
      // This warning is also in geminiService.ts, but having one here tied to state update is also good.
      console.warn(
        "%cGoogle Gemini API Key (API_KEY) is not configured in your environment.",
        "color: orange; font-weight: bold; font-size: 14px;",
        "\nAll AI-powered text and image generation features will be non-functional.",
        "\nPlease ensure the API_KEY environment variable is set for the application to work correctly."
      );
       setGlobalError("Google Gemini API Key (API_KEY) is missing. AI features are disabled. Please configure it in your environment.");
    }
  }, []);


  useEffect(() => {
    if (globalError) {
      const timer = setTimeout(() => setGlobalError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [globalError]);

  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);


  const resetEbook = () => {
    setEbookStructure(null);
    setCurrentPhase(GenerationPhase.DOCUMENT_INPUT);
    setGlobalError(null);
    setGlobalMessage("eBook project has been reset.");
  };

  const handleContentSubmit = useCallback(async (rawText: string, rawToc: string) => {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const parsed = await parseEbookContent(rawText, rawToc);
      const initialStructure: EbookStructure = {
        ...parsed,
        rawText: rawText,
        rawToc: rawToc,
        coverImage: createEmptyAsset('cover', 'coverImage'),
      };
      setEbookStructure(initialStructure);
      setCurrentPhase(GenerationPhase.COVER_DESIGN);
      setGlobalMessage("eBook content processed successfully!");
    } catch (error) {
      console.error("Error parsing content:", error);
      setGlobalError("Failed to process eBook content. Please check the input and try again.");
      setEbookStructure(null);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const updateAsset = useCallback(<T extends BaseAsset>(
    assetId: string,
    chapterId: string | null,
    assetType: AssetType,
    updates: Partial<T>
  ) => {
    setEbookStructure(prev => {
      if (!prev) return null;
      const newStructure = { ...prev };
      const updatesWithDefaults = { ...updates, type: assetType, id: assetId };

      if (chapterId) {
        const chapterIndex = newStructure.chapters.findIndex(ch => ch.id === chapterId);
        if (chapterIndex > -1) {
          const chapterToUpdate = { ...newStructure.chapters[chapterIndex] };
          
          if (assetType === 'coverImage') {
            console.error("updateAsset: Logical error - 'coverImage' asset type encountered with a chapterId.");
            return prev;
          }
          const chapterAssetKey = assetType as keyof Omit<Chapter, 'id' | 'title' | 'rawContent' | 'contentSummary'>;
          
          const existingAsset = chapterToUpdate[chapterAssetKey] as T | undefined;
          
          (chapterToUpdate[chapterAssetKey] as BaseAsset) = {
            ...(existingAsset || createEmptyAsset(assetId, assetType)),
            ...updatesWithDefaults,
          } as T; 
          newStructure.chapters[chapterIndex] = chapterToUpdate;

        } else {
            console.error(`updateAsset: Chapter with ID ${chapterId} not found.`);
            return prev;
        }
      } else {
        if (assetType === 'coverImage') {
          const currentAsset = prev.coverImage as T; 
          newStructure.coverImage = {
            ...currentAsset,
            ...updatesWithDefaults
          };
        } else {
          console.error(`updateAsset: chapterId is null, but assetType is ${assetType}, not 'coverImage'. This indicates a logic error.`);
          return prev;
        }
      }
      return newStructure;
    });
  }, []);

  const handleClearAsset = useCallback((assetId: string, chapterId: string | null, assetType: AssetType) => {
    const emptyAssetUpdates = createEmptyAsset(assetId, assetType);
    updateAsset(assetId, chapterId, assetType, {
        ...emptyAssetUpdates,
        status: AssetStatus.IDLE,
    });

    const friendlyAssetType = assetType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    let message = `${friendlyAssetType} has been cleared.`;

    setEbookStructure(prevStructure => {
      if (chapterId && prevStructure) {
        const chapter = prevStructure.chapters.find(c => c.id === chapterId);
        if (chapter) {
            message = `${friendlyAssetType} for chapter "${chapter.title}" has been cleared.`;
        }
      } else if (assetType === 'coverImage') {
        message = `Cover Image has been cleared.`;
      }
      setGlobalMessage(message); 
      return prevStructure; 
    });

  }, [updateAsset]);

  const handleGenerateAsset = useCallback(async (
    assetId: string,
    chapterId: string | null,
    assetType: AssetType,
    context?: { title?: string; summary?: string; rawContent?: string; concept?: string },
    prompts?: CustomPrompts
  ) => {
    if (!isGeminiKeyAvailable) {
      const errorMsg = "Google Gemini API Key (API_KEY) is not configured. AI generation cannot proceed.";
      setGlobalError(errorMsg);
      updateAsset(assetId, chapterId, assetType, { status: AssetStatus.ERROR, error: errorMsg });
      return;
    }
    if (!prompts || !prompts.user) {
      setGlobalError("User prompt is missing for generation.");
      updateAsset(assetId, chapterId, assetType, { status: AssetStatus.ERROR, error: "User prompt missing." });
      return;
    }

    updateAsset(assetId, chapterId, assetType, { status: AssetStatus.GENERATING, error: undefined, aiPrompt: prompts.user });
    setGlobalError(null);

    try {
      let generatedContent: string | undefined = undefined;
      let imageUrl: string | undefined = undefined;
      let textToImagePrompt: string | undefined = undefined;

      const systemInstruction = prompts.system;
      let userPromptForAI = prompts.user; 

      if (chapterId && context?.rawContent && !context?.summary) {
         if (userPromptForAI.includes("${summary}") || userPromptForAI.includes(EMPTY_EBOOK_STRUCTURE_SUMMARY)) {
            const chapterSummary = await summarizeTextIfNeeded(context.rawContent, 200); 
            userPromptForAI = userPromptForAI.replace("${summary}", chapterSummary)
                                            .replace(EMPTY_EBOOK_STRUCTURE_SUMMARY, chapterSummary);
            if (context.summary !== undefined) context.summary = chapterSummary; 
         }
      }
      
      // All AI generation now uses Gemini
      if (assetType === 'coverImage' || assetType === 'backgroundImage') {
        textToImagePrompt = await generateTextGemini(userPromptForAI, systemInstruction);
        if (!textToImagePrompt) throw new Error("AI failed to generate the image prompt text.");
        imageUrl = await generateImageFromBackend(textToImagePrompt); // Use backend for images
      } else if (assetType === 'interactiveElement' || assetType === 'diagram' || assetType === 'chartInfographic') {
        generatedContent = await generateTextGemini(userPromptForAI, systemInstruction);
        if (!generatedContent) throw new Error("AI failed to generate textual content.");

        if (assetType === 'diagram') {
            textToImagePrompt = generatedContent; // The content itself is the prompt for diagram image
        } else if (assetType === 'chartInfographic') {
            textToImagePrompt = parseLineValue(generatedContent, "Text-to-image prompt");
             if (!textToImagePrompt) textToImagePrompt = parseLineValue(generatedContent, "Visual Style Direction"); // Fallback
        } else { // interactiveElement
            const visualStyle = parseLineValue(generatedContent, "Visual Style Direction");
            const title = parseLineValue(generatedContent, "Title");
            // Create a descriptive prompt for a mockup image
            textToImagePrompt = `Mockup of an interactive printable worksheet: "${title}". Visual Style: ${visualStyle}. For a fitness eBook.`;
        }

        if (textToImagePrompt) {
            imageUrl = await generateImageFromBackend(textToImagePrompt); // Use backend for images
        } else {
            console.warn(`No text-to-image prompt derived for ${assetType}, skipping image generation.`);
        }

      } else if (assetType === 'motivationalQuote') {
        generatedContent = await generateTextGemini(userPromptForAI, systemInstruction);
      } else {
        throw new Error(`Unsupported asset type for generation: ${assetType}`);
      }

      updateAsset(assetId, chapterId, assetType, {
        status: AssetStatus.GENERATED,
        aiGeneratedUrl: imageUrl,
        aiGeneratedContent: generatedContent || textToImagePrompt, // Store prompt if it was for an image
        finalUrl: imageUrl,
        finalContent: generatedContent || textToImagePrompt,
        aiPrompt: prompts.user, 
      });

    } catch (error: any) {
      console.error(`Error generating ${assetType} (${assetId}):`, error);
      const errorMessage = error.message || "An unknown error occurred during AI generation.";
      setGlobalError(`Failed to generate ${assetType}: ${errorMessage}`);
      updateAsset(assetId, chapterId, assetType, { status: AssetStatus.ERROR, error: errorMessage });
    }
  }, [updateAsset, isGeminiKeyAvailable]);

  const handleApproveAsset = useCallback((assetId: string, chapterId: string | null, assetType: AssetType) => {
    setEbookStructure(prev => {
      if (!prev) return null;

      let assetToApprove: BaseAsset | undefined;
      if (chapterId) {
        if (assetType === 'coverImage') {
             console.error("handleApproveAsset: Logical error - 'coverImage' asset type encountered with a chapterId.");
             return prev;
        }
        const chapterAssetKey = assetType as keyof Omit<Chapter, 'id' | 'title' | 'rawContent' | 'contentSummary'>;
        const chapter = prev.chapters.find(ch => ch.id === chapterId);
        assetToApprove = chapter ? chapter[chapterAssetKey] : undefined;
      } else if (assetType === 'coverImage') {
        assetToApprove = prev.coverImage;
      }

      if (!assetToApprove) {
        console.error(`Asset ${assetId} of type ${assetType} not found for approval.`);
        return prev;
      }
      
      if (assetToApprove.status === AssetStatus.GENERATED) {
        updateAsset(assetId, chapterId, assetType, {
          status: AssetStatus.APPROVED,
          finalUrl: assetToApprove.aiGeneratedUrl,
          finalContent: assetToApprove.aiGeneratedContent,
          error: undefined,
        });
        setGlobalMessage(`${assetType.replace(/([A-Z])/g, ' $1')} approved successfully!`);
      } else if (assetToApprove.status === AssetStatus.USER_UPLOADED) {
        updateAsset(assetId, chapterId, assetType, {
          status: AssetStatus.APPROVED,
          finalUrl: assetToApprove.userUploadedUrl || assetToApprove.aiGeneratedUrl,
          finalContent: assetToApprove.userUploadedContent || assetToApprove.aiGeneratedContent,
        });
        setGlobalMessage(`${assetType.replace(/([A-Z])/g, ' $1')} (user uploaded) confirmed as final.`);
      }
      return prev; 
    });
  }, [updateAsset]);

  const handleFileUpload = useCallback((assetId: string, chapterId: string | null, assetType: AssetType, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const fileUrl = reader.result as string;
      let fileContent: string | undefined = undefined;

      if (file.type.startsWith('text/')) {
        const textReader = new FileReader();
        textReader.onloadend = () => {
          fileContent = textReader.result as string;
          updateAsset(assetId, chapterId, assetType, {
            status: AssetStatus.USER_UPLOADED, 
            userUploadedFile: file,
            userUploadedUrl: (file.type.startsWith('image/')) ? fileUrl : undefined,
            userUploadedContent: fileContent,
            finalUrl: (file.type.startsWith('image/')) ? fileUrl : undefined,
            finalContent: fileContent,
            aiGeneratedUrl: undefined,
            aiGeneratedContent: undefined,
            aiPrompt: "User uploaded asset",
            error: undefined,
          });
        };
        textReader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
         updateAsset(assetId, chapterId, assetType, {
            status: AssetStatus.USER_UPLOADED, 
            userUploadedFile: file,
            userUploadedUrl: fileUrl,
            userUploadedContent: undefined,
            finalUrl: fileUrl,
            finalContent: undefined,
            aiGeneratedUrl: undefined,
            aiGeneratedContent: undefined,
            aiPrompt: "User uploaded asset",
            error: undefined,
          });
      } else {
        setGlobalError(`Unsupported file type: ${file.type}. Please upload an image or text file.`);
        return;
      }
       setGlobalMessage(`${assetType.replace(/([A-Z])/g, ' $1')} uploaded successfully!`);
    };

    if (file.type.startsWith('image/') || file.type.startsWith('text/')) {
      reader.readAsDataURL(file);
    } else {
       setGlobalError(`Unsupported file type: ${file.type}. Please upload an image or text file.`);
    }
  }, [updateAsset]);


  const navigatePhase = (direction: 1 | -1) => {
    const phases = Object.values(GenerationPhase);
    const currentIndex = phases.indexOf(currentPhase);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < phases.length) {
      setCurrentPhase(phases[nextIndex]);
    }
  };

  const canProceed = (): boolean => {
    if (!ebookStructure) return false;
    const currentAssetType = phaseToAssetTypeMap[currentPhase];

    switch (currentPhase) {
      case GenerationPhase.DOCUMENT_INPUT:
        return !!ebookStructure.title; 
      case GenerationPhase.COVER_DESIGN:
        return ebookStructure.coverImage?.status === AssetStatus.APPROVED || ebookStructure.coverImage?.status === AssetStatus.USER_UPLOADED;
      case GenerationPhase.BACKGROUND_IMAGES:
      case GenerationPhase.INTERACTIVE_ELEMENTS:
      case GenerationPhase.DIAGRAMS:
      case GenerationPhase.CHARTS_INFOGRAPHICS:
      case GenerationPhase.MOTIVATIONAL_QUOTES:
        if (!currentAssetType || currentAssetType === 'coverImage') return false; 
        const chapterAssetKey = currentAssetType as keyof Omit<Chapter, 'id' | 'title' | 'rawContent' | 'contentSummary'>;
        return ebookStructure.chapters.every(ch => {
            const asset = ch[chapterAssetKey];
            return asset && (asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.USER_UPLOADED);
        });
      case GenerationPhase.REVIEW_AND_DOWNLOAD:
        return true;
      default:
        return false;
    }
  };


  const renderCurrentPhase = () => {
    if (!ebookStructure && currentPhase !== GenerationPhase.DOCUMENT_INPUT) {
      return (
        <div className="text-center p-8 bg-slate-700 rounded-lg shadow-xl">
          <BookOpenText className="w-16 h-16 mx-auto text-sky-400 mb-4" />
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">No eBook Data</h2>
          <p className="text-slate-300 mb-6">
            Please start by inputting your eBook content in Step 1.
          </p>
          <Button onClick={() => setCurrentPhase(GenerationPhase.DOCUMENT_INPUT)} variant="primary">
            Go to Content Input
          </Button>
        </div>
      );
    }
    const assetTypeForPhase = phaseToAssetTypeMap[currentPhase];

    switch (currentPhase) {
      case GenerationPhase.DOCUMENT_INPUT:
        return <DocumentInputPhase onSubmit={handleContentSubmit} isProcessing={globalLoading} />;
      case GenerationPhase.COVER_DESIGN:
        return ebookStructure && <CoverPhase
                                    asset={ebookStructure.coverImage}
                                    ebookSummary={ebookStructure.summary} 
                                    onGenerate={handleGenerateAsset}
                                    onApprove={handleApproveAsset}
                                    onUpload={handleFileUpload}
                                    onClear={handleClearAsset}
                                    isGeminiKeyAvailable={isGeminiKeyAvailable}
                                  />;
      case GenerationPhase.BACKGROUND_IMAGES:
      case GenerationPhase.INTERACTIVE_ELEMENTS:
      case GenerationPhase.DIAGRAMS:
      case GenerationPhase.CHARTS_INFOGRAPHICS:
      case GenerationPhase.MOTIVATIONAL_QUOTES:
        if (!assetTypeForPhase || assetTypeForPhase === 'coverImage') {
            return <p className="text-red-400">Error: Invalid asset type configuration for this phase.</p>;
        }
        return ebookStructure && <ChapterAssetsPhase
                                    chapters={ebookStructure.chapters}
                                    assetType={assetTypeForPhase} 
                                    phaseTitle={PHASE_TITLES[currentPhase]}
                                    onGenerate={handleGenerateAsset}
                                    onApprove={handleApproveAsset}
                                    onUpload={handleFileUpload}
                                    onClear={handleClearAsset}
                                    isGeminiKeyAvailable={isGeminiKeyAvailable}
                                  />;
      case GenerationPhase.REVIEW_AND_DOWNLOAD:
        return ebookStructure && <ReviewPhase ebookStructure={ebookStructure} />;
      case GenerationPhase.FINALIZE_EBOOK:
        return ebookStructure && <FinalizePhase ebookStructure={ebookStructure} />;
      default:
        return <p>Unknown phase.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 pb-2">
          AI eBook Generator Studio
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          Craft stunning eBooks with AI-powered asset generation. From cover to content, bring your vision to life.
        </p>
         <p className="text-xs text-slate-400 mt-1">AI Text & Images by Google Gemini.</p>
      </header>

      {globalError && (
        <div className="fixed top-5 right-5 bg-red-600 text-white p-3 rounded-lg shadow-xl z-50 max-w-sm animate-pulse" role="alert">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <strong>Error:</strong>
          </div>
          <p className="text-sm mt-1">{globalError}</p>
        </div>
      )}
      {globalMessage && (
        <div className="fixed top-5 right-5 bg-sky-500 text-white p-3 rounded-lg shadow-xl z-50 max-w-sm" role="status">
           <div className="flex items-center">
             <CheckCircle className="h-5 w-5 mr-2" />
            <strong>Success:</strong>
          </div>
          <p className="text-sm mt-1">{globalMessage}</p>
        </div>
      )}

      {globalLoading && currentPhase !== GenerationPhase.DOCUMENT_INPUT && (
          <div className="fixed inset-0 bg-slate-800/70 flex flex-col items-center justify-center z-40">
              <LoadingSpinner text="Processing..." />
          </div>
      )}


      <main className="max-w-5xl mx-auto bg-slate-800/70 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl border border-slate-700">
        <PhaseStepper
          currentPhase={currentPhase}
          phases={Object.values(GenerationPhase)}
          phaseTitles={PHASE_TITLES}
        />

        <div className="mt-6 sm:mt-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-sky-300 mb-6 pb-2 border-b-2 border-sky-500/30">
            {PHASE_TITLES[currentPhase]}
          </h2>
          {renderCurrentPhase()}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-600 flex justify-between items-center">
          <Button
            onClick={() => navigatePhase(-1)}
            disabled={currentPhase === GenerationPhase.DOCUMENT_INPUT}
            variant="secondary"
          >
            Previous Step
          </Button>
          <Button
            onClick={resetEbook}
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4"/>}
            title="Reset all eBook data and start over"
            className="bg-red-700/80 hover:bg-red-700"
          >
            Reset eBook
          </Button>
          <Button
            onClick={() => navigatePhase(1)}
            disabled={currentPhase === GenerationPhase.FINALIZE_EBOOK || !canProceed()}
            variant="primary"
          >
            Next Step
          </Button>
        </div>
      </main>
      <footer className="text-center mt-12 pb-6">
        <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} AI eBook Studio. All rights reserved (conceptually).</p>
      </footer>
    </div>
  );
};

export default App;
