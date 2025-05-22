import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-sky-200 mb-1">{label}</label>}
      <textarea
        id={id}
        className={`w-full px-4 py-2.5 bg-slate-600/70 border border-slate-500 rounded-lg shadow-sm placeholder-slate-400 text-slate-100
                    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 
                    disabled:bg-slate-500 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-400' : ''} ${className}`}
        rows={props.rows || 6}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
};

export default TextArea;