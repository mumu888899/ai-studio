import React, { useState }  from 'react';
import { EbookStructure, AssetStatus } from '../types';
import Button from './ui/Button';
import { CheckCircle, AlertTriangle, Download } from './icons'; // Added Download
import LoadingSpinner from './ui/LoadingSpinner'; // Added LoadingSpinner

interface FinalizePhaseProps {
  ebookStructure: EbookStructure;
}

const FinalizePhase: React.FC<FinalizePhaseProps> = ({ ebookStructure }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);


  const countAssets = () => {
    let total = 0;
    let approved = 0;

    if (ebookStructure.coverImage) {
      total++;
      if (ebookStructure.coverImage.status === AssetStatus.APPROVED || ebookStructure.coverImage.status === AssetStatus.USER_UPLOADED) {
        approved++;
      }
    }
    ebookStructure.chapters.forEach(ch => {
      const chapterAssets = [ch.backgroundImage, ch.interactiveElement, ch.diagram, ch.chartInfographic, ch.motivationalQuote];
      chapterAssets.forEach(asset => {
        if (asset) {
          total++;
          if (asset.status === AssetStatus.APPROVED || asset.status === AssetStatus.USER_UPLOADED) {
            approved++;
          }
        }
      });
    });
    return { total, approved };
  };

  const { total, approved } = countAssets();
  const allApproved = total > 0 && total === approved;

  const handleGenerateEbook = async () => {
    setIsGenerating(true);
    setGenerationStatus("Compiling eBook assets... this is a simulation.");
    setGeneratedFileUrl(null);

    // Simulate eBook generation
    console.log("Preparing to generate eBook with structure:", ebookStructure);
    
    // Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // In a real app, this would involve sending all asset data/URLs to a backend
    // or using a client-side library like jsPDF and epub-gen (which is complex).
    // For this demo, we'll simulate creating a JSON file of the structure.
    try {
      const ebookJson = JSON.stringify(ebookStructure, null, 2);
      const blob = new Blob([ebookJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setGeneratedFileUrl(url);
      setGenerationStatus("eBook asset compilation (JSON) complete! You can download the structure data.");
    } catch (error) {
      console.error("Error generating conceptual eBook file:", error);
      setGenerationStatus("Error during conceptual eBook generation simulation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <p className="text-slate-200 text-lg leading-relaxed">
        You're at the final step! All your hard work and AI collaboration comes together here.
      </p>

      <div className={`p-6 rounded-xl shadow-xl border-2 ${allApproved ? 'bg-green-700/30 border-green-500' : 'bg-yellow-700/30 border-yellow-500'}`}>
        {allApproved ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-400 mb-3" />
            <h3 className="text-2xl font-semibold text-green-200">All Assets Ready!</h3>
            <p className="text-green-100 mt-1">{approved}/{total} assets are approved or uploaded.</p>
          </div>
        ) : (
           <div className="flex flex-col items-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mb-3" />
            <h3 className="text-2xl font-semibold text-yellow-200">Attention Needed</h3>
            <p className="text-yellow-100 mt-1">
              {approved}/{total} assets are approved or uploaded. Some assets still require your attention.
            </p>
            <p className="text-sm text-yellow-200 mt-2">Please go back to previous steps to approve or upload any remaining assets before final generation.</p>
          </div>
        )}
      </div>
      
      <Button
        onClick={handleGenerateEbook}
        disabled={!allApproved || isGenerating}
        size="lg"
        variant="primary"
        leftIcon={isGenerating ? <LoadingSpinner size="sm" color="border-white"/> : <Download className="w-5 h-5"/>}
      >
        {isGenerating ? 'Generating Your eBook...' : 'Generate Final eBook (Conceptual Data)'}
      </Button>

      {generationStatus && (
        <div className={`mt-6 p-4 border rounded-md text-sm ${generatedFileUrl ? 'bg-sky-700/50 border-sky-600 text-sky-100' : 'bg-slate-600 border-slate-500 text-slate-200'}`}>
          <p>{generationStatus}</p>
          {generatedFileUrl && (
            <a
              href={generatedFileUrl}
              download="ebook_structure.json"
              className="inline-block mt-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
              <Download className="w-4 h-4 inline-block mr-2" />
              Download eBook Data (JSON)
            </a>
          )}
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-xl">
        <h4 className="text-lg font-semibold text-sky-300 mb-2">What "Generate Final eBook" Means Here:</h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          In this demonstration, clicking "Generate Final eBook" simulates collecting all your approved assets and compiles them into a downloadable JSON file representing your eBook's structure and asset references.
          A full-fledged application would typically use this data to then compile a downloadable ePub or PDF file, often requiring a backend service or complex client-side libraries for formatting and packaging.
          The AI's role is in generating the *content and visual assets* for the eBook, not usually in the final file format assembly itself.
        </p>
      </div>
    </div>
  );
};

export default FinalizePhase;