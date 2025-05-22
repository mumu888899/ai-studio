
import React, { useRef } from 'react';
import Button from './Button';
import { UploadCloud } from '../icons'; // Using a pre-defined icon

interface FileUploadButtonProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  buttonText?: string;
  disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileUpload, 
  accept = "image/*", 
  buttonText = "Upload File",
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
      event.target.value = ''; // Reset file input
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <Button 
        variant="outline" 
        onClick={handleClick} 
        disabled={disabled}
        leftIcon={<UploadCloud className="w-4 h-4" />}
      >
        {buttonText}
      </Button>
    </>
  );
};

export default FileUploadButton;
