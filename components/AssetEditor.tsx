
import React, { useState, useEffect } from 'react';
import { BaseAsset, AssetStatus, AssetType } from '../types';
import Button from './ui/Button';
import FileUploadButton from './ui/FileUploadButton';
import LoadingSpinner from './ui/LoadingSpinner';
import TextArea from './ui/TextArea'; 
import { Sparkles, CheckCircle, UploadCloud, Trash2, AlertTriangle, Info } from './icons';

interface AssetEditorProps {
  asset: BaseAsset | null;
  assetType: AssetType;
  assetName: string;
  initialSystemPrompt: string;
  initialUserPrompt: string;
  onGenerate: (prompts: { system?: string; user: string }) => Promise<void>;
  onApprove: () => void;
  onUpload: (file: File) => void;
  onClear?: () => void; 
  isTextAsset?: boolean;
  isGeminiKeyAvailable?: boolean; // Only Gemini key now
}

const AssetEditor: React.FC<AssetEditorProps> = ({
  asset,
  assetType,
  assetName,
  initialSystemPrompt,
  initialUserPrompt,
  onGenerate,
  onApprove,
  onUpload,
  onClear,
  isTextAsset = false,
  isGeminiKeyAvailable,
}) => {
  const [editableSystemPrompt, setEditableSystemPrompt] = useState<string>('');
  const [editableUserPrompt, setEditableUserPrompt] = useState<string>('');

  useEffect(() => {
    setEditableSystemPrompt(initialSystemPrompt);
  }, [initialSystemPrompt, asset?.id]); 

  useEffect(() => {
    if (asset?.aiPrompt && (asset.status === AssetStatus.GENERATED || asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.ERROR || asset.status === AssetStatus.USER_UPLOADED)) {
      setEditableUserPrompt(asset.aiPrompt);
    } else {
      setEditableUserPrompt(initialUserPrompt);
    }
  }, [initialUserPrompt, asset?.aiPrompt, asset?.status, asset?.id]);


  if (!asset) {
    return (
      <div className="p-4 border border-slate-600 rounded-lg bg-slate-700">
        <h4 className="text-md font-semibold text-slate-300 mb-2">{assetName}</h4>
        <p className="text-sm text-slate-400">Asset not initialized.</p>
      </div>
    );
  }

  const currentContent = asset.finalContent || asset.aiGeneratedContent || (asset.userUploadedFile && asset.userUploadedContent);
  const currentUrl = asset.finalUrl || asset.aiGeneratedUrl || (asset.userUploadedFile && !isTextAsset ? asset.userUploadedUrl : undefined);


  const handleLocalGenerate = () => {
    onGenerate({ system: editableSystemPrompt, user: editableUserPrompt });
  };
  
  const handleFileUpload = (file: File) => {
    onUpload(file);
  };

  const getAcceptType = () => {
    if (assetType === 'motivationalQuote') return ".txt";
    // For assets that can be text (description/prompt) or an image (mockup)
    if (assetType === 'interactiveElement' || assetType === 'diagram' || assetType === 'chartInfographic') {
      return "image/*, .txt"; 
    }
    return "image/*"; // For coverImage, backgroundImage
  }
  
  const canClear = asset.status !== AssetStatus.IDLE && (asset.aiGeneratedUrl || asset.aiGeneratedContent || asset.userUploadedFile);

  // All AI generation (text and image) now depends on the Gemini key.
  const geminiKeyMissing = isGeminiKeyAvailable === false;
  const generationDisabledDueToMissingKey = geminiKeyMissing;
  
  const generationDisabledTitle = generationDisabledDueToMissingKey 
    ? "AI Generation disabled: Google Gemini API Key (API_KEY) is missing." 
    : "Generate using the customized prompts above";

  return (
    <div className="p-4 sm:p-5 bg-slate-700 rounded-lg shadow-xl relative overflow-hidden">
      {(asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.USER_UPLOADED) && (
        <div className={`absolute top-3 right-3 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center z-10 shadow-md ${asset.status === AssetStatus.APPROVED ? 'bg-green-500' : 'bg-sky-500'}`}>
          {asset.status === AssetStatus.APPROVED ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <UploadCloud className="w-3.5 h-3.5 mr-1.5" />}
          {asset.status === AssetStatus.APPROVED ? 'Approved' : 'User Uploaded'}
        </div>
      )}

      <h4 className="text-xl font-semibold text-sky-300 mb-4">{assetName}</h4>

      {asset.status === AssetStatus.GENERATING && (
        <div className="flex flex-col items-center justify-center h-48">
          <LoadingSpinner text={`Generating ${assetName}...`} />
          <p className="text-sm text-slate-300 mt-2">AI is working its magic!</p>
        </div>
      )}

      {asset.status !== AssetStatus.GENERATING && (
        <>
          {asset.error && (
             <div className="my-3 p-3 bg-red-700/30 border border-red-500 text-red-200 rounded-md text-sm flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <span>Error: {asset.error}</span>
            </div>
          )}

          {/* Prompt Customization Area */}
          <div className="space-y-4 my-4 p-4 bg-slate-600 rounded-lg shadow">
            <div>
              <TextArea
                label="System Prompt (AI Role & Context)"
                id={`${asset.id}-system-prompt`}
                value={editableSystemPrompt}
                onChange={(e) => setEditableSystemPrompt(e.target.value)}
                rows={3}
                className="text-sm leading-relaxed"
                aria-describedby={`${asset.id}-system-prompt-desc`}
                disabled={asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.USER_UPLOADED || generationDisabledDueToMissingKey}
              />
              <p id={`${asset.id}-system-prompt-desc`} className="mt-1.5 text-xs text-slate-400 flex items-start">
                <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" /> 
                <span>Defines the AI's persona and general guidelines. 
                For images, this helps guide the initial text prompt generation.
                For structured data, this helps guide the AI's output format and style.
                </span>
              </p>
            </div>
            <div>
              <TextArea
                label="User Prompt (Specific Instructions)"
                id={`${asset.id}-user-prompt`}
                value={editableUserPrompt}
                onChange={(e) => setEditableUserPrompt(e.target.value)}
                rows={isTextAsset || assetType === 'interactiveElement' || assetType === 'diagram' || assetType === 'chartInfographic' ? 5 : 3}
                className="text-sm leading-relaxed"
                aria-describedby={`${asset.id}-user-prompt-desc`}
                disabled={asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.USER_UPLOADED || generationDisabledDueToMissingKey}
              />
              <p id={`${asset.id}-user-prompt-desc`} className="mt-1.5 text-xs text-slate-400 flex items-start">
                <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 mt-0.5" /> 
                <span>Your detailed request to the AI for this specific asset. Edit this to customize the generation.</span>
              </p>
            </div>
          </div>

          {isTextAsset ? ( // Primarily for motivationalQuote
            currentContent && (
              <div className="my-4 p-3 bg-slate-600 rounded-md shadow-inner">
                <h5 className="text-sm font-medium text-sky-200 mb-1">Content Preview:</h5>
                <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{currentContent}</p>
              </div>
            )
          ) : ( // For image assets (cover, background) and assets that produce an image (diagram, chart, interactive element mockup)
            currentUrl && (
              <div className="my-4 aspect-video bg-slate-600 rounded-md overflow-hidden flex items-center justify-center shadow-inner">
                <img src={currentUrl} alt={assetName} className="max-h-full max-w-full object-contain" />
              </div>
            )
          )}
          
          {/* For structured text assets that also have a textual component (description/prompt) before image gen */}
          {(assetType === 'interactiveElement' || assetType === 'diagram' || assetType === 'chartInfographic') && currentContent && !currentUrl && (
             <div className="my-4 p-3 bg-slate-600 rounded-md shadow-inner">
                <h5 className="text-sm font-medium text-sky-200 mb-1">Generated Text Content:</h5>
                <p className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">{currentContent}</p>
              </div>
          )}


          {(!currentUrl && !currentContent && asset.status !== AssetStatus.IDLE && asset.status !== AssetStatus.ERROR ) && (
            <p className="text-slate-400 text-sm my-3 p-3 bg-slate-600/50 rounded-md">No preview available. Generate or upload an asset.</p>
          )}
          {(asset.status === AssetStatus.IDLE || (asset.status === AssetStatus.ERROR && !currentUrl && !currentContent)) && !generationDisabledDueToMissingKey && (
             <p className="text-slate-300 text-sm my-3 p-3 bg-slate-600/50 rounded-md">
                Ready to generate. Review and customize the prompts above, then click "Generate with AI".
            </p>
          )}

          {geminiKeyMissing && (
              <p className="my-3 p-2 text-xs text-yellow-200 bg-yellow-700/30 border border-yellow-600 rounded-md flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                  AI-powered generation requires the Google Gemini API Key (API_KEY) to be configured in your environment.
              </p>
          )}


          <div className="flex flex-wrap gap-2 mt-5 items-center">
            {(asset.status !== AssetStatus.APPROVED && asset.status !== AssetStatus.USER_UPLOADED) && (
                <Button 
                  onClick={handleLocalGenerate}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  variant="primary"
                  size="sm"
                  title={generationDisabledTitle}
                  disabled={generationDisabledDueToMissingKey}
                >
                  {asset.aiGeneratedUrl || asset.aiGeneratedContent ? 'Regenerate with AI' : 'Generate with AI'}
                </Button>
            )}

            {(asset.status === AssetStatus.GENERATED || (asset.status === AssetStatus.ERROR && (asset.aiGeneratedUrl || asset.aiGeneratedContent))) && (
              <Button 
                onClick={onApprove} 
                leftIcon={<CheckCircle className="w-4 h-4" />}
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                size="sm"
              >
                Approve
              </Button>
            )}
            
             {(asset.status !== AssetStatus.APPROVED && asset.status !== AssetStatus.USER_UPLOADED) && (
                <FileUploadButton
                    onFileUpload={handleFileUpload}
                    buttonText={asset.userUploadedFile ? "Change Upload" : "Upload Own"}
                    accept={getAcceptType()}
                    // Allow upload even if key is missing, as it's a manual override
                />
             )}
            
            {onClear && canClear && (asset.status !== AssetStatus.APPROVED && asset.status !== AssetStatus.USER_UPLOADED) && (
              <Button
                onClick={onClear}
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                title="Clear current data for this asset"
                className="bg-red-700/80 hover:bg-red-700"
              >
                Clear
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssetEditor;
