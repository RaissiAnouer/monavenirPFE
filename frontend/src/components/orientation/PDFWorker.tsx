import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';

interface PDFWorkerProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const PDFWorker: React.FC<PDFWorkerProps> = ({ isLoading, error, onRetry }) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <DocumentIcon className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-500 text-center max-w-md">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
};

export default PDFWorker; 