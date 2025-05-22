
import React from 'react';
import { EbookStructure, BaseAsset, AssetStatus, Chapter, AssetType } from '../types';
import { Download } from './icons';
import Button from './ui/Button';

interface ReviewPhaseProps {
  ebookStructure: EbookStructure;
}

const AssetDisplayCard: React.FC<{ asset: BaseAsset | null; name: string; type: AssetType }> = ({ asset, name, type }) => {
  if (!asset || (asset.status !== AssetStatus.APPROVED && asset.status !== AssetStatus.USER_UPLOADED)) {
    return (
      <div className="p-4 bg-slate-600/70 rounded-lg shadow-md h-full flex flex-col justify-center">
        <h5 className="font-semibold text-slate-200">{name}</h5>
        <p className="text-sm text-slate-400 mt-1">Not yet approved or uploaded.</p>
      </div>
    );
  }

  // FIX: asset.type is now a valid property. The 'type' prop passed to AssetDisplayCard is used for logic.
  // The actual asset.type (if needed for rendering decisions based on its specific stored type) can be accessed.
  // Here, 'type' prop is used which aligns with AssetType from parameters.
  const isText = type === 'motivationalQuote' || (type === 'interactiveElement' && asset.finalContent); // Check finalContent for IE too
  const content = asset.finalContent;
  const url = asset.finalUrl;

  const handleDownload = () => {
    if (!url && !content) return;

    const fileNameBase = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
    let fileName = `${fileNameBase}.${isText ? 'txt' : (url?.includes('jpeg') ? 'jpg' : 'png')}`;
    let downloadUrl = url;
    let mimeType = isText ? 'text/plain' : (url && url.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png');

    if (isText && content) {
      const blob = new Blob([content], { type: mimeType });
      downloadUrl = URL.createObjectURL(blob);
    } else if (!url && (type === 'interactiveElement' || type === 'diagram' || type === 'chartInfographic') && content) {
      // For structured text assets that might not have an image URL but have content (e.g., diagram prompt)
      const blob = new Blob([content], { type: 'text/plain' });
      downloadUrl = URL.createObjectURL(blob);
      fileName = `${fileNameBase}_description.txt`;
    } else if (!url) {
        return;
    }


    if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if ((isText && content) || (!url && content)) URL.revokeObjectURL(downloadUrl); 
    }
  };


  return (
    <div className="p-4 bg-slate-600 rounded-lg shadow-xl flex flex-col h-full">
      <h5 className="font-semibold text-sky-200 mb-2 truncate" title={name}>{name}</h5>
      <div className="flex-grow mb-3 min-h-[100px]">
        {isText && content ? (
          <p className="text-sm text-slate-200 whitespace-pre-wrap p-2 bg-slate-500/50 rounded-md max-h-40 overflow-y-auto">{content}</p>
        ) : url ? (
          <div className="aspect-video bg-slate-500/50 rounded-md overflow-hidden flex items-center justify-center">
            <img src={url} alt={name} className="w-full h-full object-contain" />
          </div>
        // FIX: Accessing asset.type (components/ReviewPhase.tsx line 67) - asset.type is now part of BaseAsset
        ) : content && (asset.type === 'diagram' || asset.type === 'chartInfographic') ? ( // Display content if it's a diagram/chart prompt
           <p className="text-sm text-slate-200 whitespace-pre-wrap p-2 bg-slate-500/50 rounded-md max-h-40 overflow-y-auto">Generated Prompt: {content}</p>
        ): (
          <p className="text-sm text-slate-400">No preview available.</p>
        )}
      </div>
      <Button
        onClick={handleDownload}
        disabled={!url && !content}
        variant="outline"
        size="sm"
        leftIcon={<Download className="w-4 h-4" />}
        className="mt-auto w-full"
      >
        Download {isText ? "Text" : (url ? "Image" : "Data")}
      </Button>
    </div>
  );
};


const ReviewPhase: React.FC<ReviewPhaseProps> = ({ ebookStructure }) => {
  const { title, summary, coverImage, chapters } = ebookStructure;

  const assetTypes: { key: keyof Chapter; name: string, type: AssetType }[] = [
    { key: 'backgroundImage', name: 'Background Image', type: 'backgroundImage' },
    { key: 'interactiveElement', name: 'Interactive Element', type: 'interactiveElement' },
    { key: 'diagram', name: 'Diagram', type: 'diagram' },
    { key: 'chartInfographic', name: 'Chart/Infographic', type: 'chartInfographic' },
    { key: 'motivationalQuote', name: 'Motivational Quote', type: 'motivationalQuote' },
  ];

  return (
    <div className="space-y-8">
      <p className="text-slate-300 leading-relaxed">
        Review all your generated and approved assets. You can download each asset individually. The final eBook generation is conceptual in this demo.
      </p>

      <section className="p-4 sm:p-6 bg-slate-700 rounded-xl shadow-2xl">
        <h3 className="text-2xl font-semibold mb-4 text-sky-300 pb-2 border-b border-slate-600">eBook Overview</h3>
        <p className="text-lg text-slate-100"><strong>Title:</strong> {title}</p>
        <div className="my-2 p-3 bg-slate-600/70 rounded-lg shadow-inner">
            <h4 className="text-sm font-medium text-sky-200 mb-1">eBook Summary:</h4>
            <p className="text-sm text-slate-200 italic max-h-24 overflow-y-auto">{summary}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetDisplayCard asset={coverImage} name="Cover Image" type="coverImage"/>
        </div>
      </section>

      {chapters.map((chapter, index) => (
        <section key={chapter.id} className="p-4 sm:p-6 bg-slate-700 rounded-xl shadow-2xl">
          <h4 className="text-xl sm:text-2xl font-semibold mb-2 text-sky-400">Chapter {index + 1}: {chapter.title}</h4>
          <div className="mb-4 p-2 bg-slate-600/70 rounded-lg shadow-inner">
             <h5 className="text-xs font-medium text-sky-200 mb-0.5">Chapter Summary:</h5>
            <p className="text-xs text-slate-300 italic max-h-20 overflow-y-auto">{chapter.contentSummary || "No summary."}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetTypes.map(at => (
              <AssetDisplayCard 
                key={`${chapter.id}-${at.key}`}
                asset={chapter[at.key] as BaseAsset} 
                name={at.name}
                type={at.type}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ReviewPhase;