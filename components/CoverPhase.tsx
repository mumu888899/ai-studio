
import React from 'react';
import { BaseAsset, AssetType } from '../types';
import AssetEditor from './AssetEditor';
import { PROMPTS, SYSTEM_PROMPTS } from '../constants';

interface CoverPhaseProps {
  asset: BaseAsset | null;
  ebookSummary: string; 
  onGenerate: (assetId: string, chapterId: null, assetType: AssetType, context: { summary: string } | undefined, prompts: { system?: string; user: string }) => Promise<void>;
  onApprove: (assetId: string, chapterId: null, assetType: AssetType) => void;
  onUpload: (assetId: string, chapterId: null, assetType: AssetType, file: File) => void;
  onClear: (assetId: string, chapterId: null, assetType: AssetType) => void;
  isGeminiKeyAvailable: boolean;
}

const CoverPhase: React.FC<CoverPhaseProps> = ({ 
  asset, 
  ebookSummary, 
  onGenerate, 
  onApprove, 
  onUpload, 
  onClear,
  isGeminiKeyAvailable,
}) => {
  const assetId = "cover";
  const assetType: AssetType = 'coverImage';

  const initialUserPrompt = PROMPTS.cover(ebookSummary);
  const initialSystemPrompt = SYSTEM_PROMPTS.cover();

  const handleGenerateWithPrompts = (prompts: { system?: string; user: string }) => {
    return onGenerate(assetId, null, assetType, { summary: ebookSummary }, prompts);
  };

  const handleApprove = () => {
    onApprove(assetId, null, assetType);
  };

  const handleUpload = (file: File) => {
    onUpload(assetId, null, assetType, file);
  };

  const handleClearAsset = () => {
    onClear(assetId, null, assetType);
  };


  if (!asset) {
     return <p className="text-slate-400">Cover asset not initialized. This usually means the document input phase is not complete or there was an error.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-300 leading-relaxed">
        Let's design a stunning cover for your eBook. Customize the AI's role and your specific instructions below. The AI will use the overall summary of your content to generate a text-to-image prompt, which is then used to create the cover.
      </p>
      <div className="bg-slate-600 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-sky-300">eBook Summary (Reference for Prompts):</h3>
        <p className="text-sm text-slate-200 italic max-h-32 overflow-y-auto p-2 bg-slate-500/50 rounded-md shadow-inner">{ebookSummary || "No summary available yet."}</p>
      </div>

      <AssetEditor
        asset={asset}
        assetType={assetType}
        assetName="eBook Cover Image"
        initialSystemPrompt={initialSystemPrompt}
        initialUserPrompt={initialUserPrompt}
        onGenerate={handleGenerateWithPrompts}
        onApprove={handleApprove}
        onUpload={handleUpload}
        onClear={handleClearAsset}
        isTextAsset={false}
        isGeminiKeyAvailable={isGeminiKeyAvailable}
      />
    </div>
  );
};

export default CoverPhase;
