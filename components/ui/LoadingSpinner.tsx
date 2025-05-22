
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. border-sky-500
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'border-sky-500',
  text 
}) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'h-6 w-6';
      break;
    case 'md':
      sizeClasses = 'h-10 w-10';
      break;
    case 'lg':
      sizeClasses = 'h-16 w-16';
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full ${sizeClasses} border-t-2 border-b-2 ${color}`}></div>
      {text && <p className="mt-2 text-slate-300">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
