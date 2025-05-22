import React, { useState } from 'react';
import Button from './ui/Button';
import TextArea from './ui/TextArea';
import LoadingSpinner from './ui/LoadingSpinner';

interface DocumentInputPhaseProps {
  onSubmit: (rawText: string, rawToc: string) => void;
  isProcessing: boolean;
}

const DocumentInputPhase: React.FC<DocumentInputPhaseProps> = ({ onSubmit, isProcessing }) => {
  const [rawText, setRawText] = useState('');
  const [rawToc, setRawToc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
        alert("Please provide the main eBook text.");
        return;
    }
    onSubmit(rawText, rawToc);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <TextArea
          label="eBook Main Text Content"
          id="ebookText"
          placeholder="Paste your full eBook text here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={15}
          disabled={isProcessing}
          required
          className="text-sm bg-slate-600 border-slate-500"
        />
        <p className="mt-2 text-xs text-slate-400">
          Provide the entire content of your eBook. Chapters will be parsed based on your Table of Contents or common chapter markers.
        </p>
      </div>

      <div>
        <TextArea
          label="Table of Contents (Optional)"
          id="ebookToc"
          placeholder="Paste your Table of Contents here, one chapter title per line..."
          value={rawToc}
          onChange={(e) => setRawToc(e.target.value)}
          rows={8}
          disabled={isProcessing}
          className="text-sm bg-slate-600 border-slate-500"
        />
        <p className="mt-2 text-xs text-slate-400">
          Example: <br />
          Chapter 1: Introduction to Fitness <br />
          Chapter 2: Mastering Your Movement <br />
          Chapter 3: Nutrition for Strength
        </p>
        <p className="mt-1 text-xs text-slate-400">
          If no Table of Contents is provided, the system will attempt to identify chapters or treat the content as a single section.
        </p>
      </div>

      <div className="text-right pt-4 border-t border-slate-600">
        <Button type="submit" size="lg" disabled={isProcessing || !rawText.trim()}>
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" color="border-white" />
              <span className="ml-2">Processing Content...</span>
            </>
          ) : (
            'Parse Content & Proceed'
          )}
        </Button>
      </div>
    </form>
  );
};

export default DocumentInputPhase;