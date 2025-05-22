import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyle = "font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out inline-flex items-center justify-center";
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400 disabled:bg-sky-400/70 transform hover:scale-105 focus:scale-105';
      break;
    case 'secondary':
      variantStyle = 'bg-slate-600 hover:bg-slate-700 text-slate-100 focus:ring-slate-500 disabled:bg-slate-500/70';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-400/70 transform hover:scale-105 focus:scale-105';
      break;
    case 'outline':
        variantStyle = 'bg-transparent hover:bg-sky-500/20 border-2 border-sky-500 text-sky-300 hover:text-sky-200 focus:ring-sky-500 disabled:border-slate-500 disabled:text-slate-500 disabled:hover:bg-transparent';
        break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className} disabled:cursor-not-allowed disabled:transform-none`}
      {...props}
    >
      {leftIcon && <span className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">{rightIcon}</span>}
    </button>
  );
};

export default Button;