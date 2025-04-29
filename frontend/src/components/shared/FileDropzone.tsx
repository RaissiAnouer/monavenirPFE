import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { bytesToSize } from '../../utils/fileHelpers';

interface FileDropzoneProps {
  accept: Record<string, string[]>;
  maxSize?: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  fileType: 'video' | 'document';
  isUploading?: boolean;
  progress?: number;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  maxSize = 100 * 1024 * 1024,
  file,
  onFileChange,
  fileType,
  isUploading = false,
  progress = 0
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragReject, setIsDragReject] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setIsDragReject(false);
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    onDropRejected: (fileRejections) => {
      setIsDragReject(true);
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`Le fichier est trop volumineux. Taille maximum: ${bytesToSize(maxSize)}`);
      } else {
        setError('Format de fichier non supporté');
      }
      setTimeout(() => setIsDragReject(false), 2000);
    }
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 
          ${isDragActive ? 'border-primary-500 bg-primary-50 scale-102' : 'border-gray-300 hover:border-primary-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${file ? 'bg-gray-50' : ''}
          ${isUploading ? 'opacity-75' : ''}`}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {fileType === 'video' ? (
                  <div className="relative w-12 h-12 bg-primary-100 rounded-lg overflow-hidden">
                    <video 
                      src={URL.createObjectURL(file)} 
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="loading-spinner" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <DocumentIcon className="w-6 h-6 text-primary-600" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="loading-spinner" />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    {file.name}
                    {isUploading && progress === 100 && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{bytesToSize(file.size)}</p>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileChange(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            {isUploading && (
              <div className="mt-3">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <CloudArrowUpIcon className={`mx-auto h-12 w-12 transition-colors duration-200
              ${isDragActive ? 'text-primary-600' : 'text-gray-400'}
              ${isDragReject ? 'text-red-500' : ''}`} 
            />
            <div className="mt-4">
              <div className="flex justify-center text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                  <span>Sélectionner un fichier</span>
                </label>
                <p className="pl-1">ou glissez-déposez</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {fileType === 'video' 
                  ? 'MP4, WebM ou Ogg jusqu\'à 100MB'
                  : 'PDF, Word, Excel, PowerPoint jusqu\'à 10MB'}
              </p>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 mt-1 animate-fadeIn">
          <XMarkIcon className="w-4 h-4" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileDropzone; 