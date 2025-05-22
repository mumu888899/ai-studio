import React from 'react';
import { GenerationPhase } from '../types';

interface PhaseStepperProps {
  currentPhase: GenerationPhase;
  phases: GenerationPhase[];
  phaseTitles: Record<GenerationPhase, string>;
}

const PhaseStepper: React.FC<PhaseStepperProps> = ({ currentPhase, phases, phaseTitles }) => {
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <nav aria-label="Progress" className="my-8 p-4 bg-slate-700 rounded-lg shadow-md">
      <ol role="list" className="flex flex-wrap items-center justify-center gap-y-4 gap-x-2 sm:gap-x-4">
        {phases.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const title = phaseTitles[phase].replace(/^Step \d+:\s*/, ''); // Remove "Step X: " prefix for brevity

          return (
            <li key={phase} className="relative flex items-center">
              {index !== 0 && (
                <div className={`absolute left-[-0.8rem] sm:left-[-1.3rem] top-1/2 -translate-y-1/2 h-0.5 w-3 sm:w-5 ${isCompleted || isCurrent ? 'bg-sky-500' : 'bg-slate-500'}`} aria-hidden="true" />
              )}
              <div
                className={`flex items-center text-sm font-medium transition-colors
                  ${isCompleted ? 'text-sky-400 hover:text-sky-300' : ''}
                  ${isCurrent ? 'text-sky-200 ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-700 rounded-md px-2.5 py-1.5 shadow-lg' : ''}
                  ${!isCompleted && !isCurrent ? 'text-slate-400 hover:text-slate-300' : ''}`}
              >
                <span 
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full mr-2 text-xs sm:text-sm transition-all duration-200
                    ${isCompleted ? 'bg-sky-500 text-white shadow-md' : ''}
                    ${isCurrent ? 'border-2 border-sky-400 text-sky-200 bg-sky-500/20 shadow-md' : ''}
                    ${!isCompleted && !isCurrent ? 'border-2 border-slate-500 text-slate-400 bg-slate-600' : ''}`}
                >
                  {isCompleted ? (
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={isCurrent ? 'font-bold': ''}>{index + 1}</span>
                  )}
                </span>
                <span className="hidden sm:inline-block">{title}</span>
                 <span className="sm:hidden inline-block text-xs max-w-[60px] truncate">{title}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PhaseStepper;