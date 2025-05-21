import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ExclamationCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PDFViewer from './PDFViewer';

interface PDFFile {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: string;
  date: string;
}

const pdfFiles: PDFFile[] = [
  {
    id: '1',
    title: 'Document de Formation',
    description: 'Document détaillé sur la formation et l\'orientation',
    filename: 'guide-etudes-2024.pdf',
    category: 'Documents',
    date: '2024-03-22'
  },
  {
    id: '2',
    title: 'Orientation Post-Bac',
    description: 'Informations sur le processus d\'orientation universitaire',
    filename: 'orientation-post-bac.pdf',
    category: 'Orientation',
    date: '2024-03-22'
  }
];

const UniversityGuide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Get the authentication token from localStorage
    const token = localStorage.getItem('token');
    setAuthToken(token);
  }, []);

  const getPdfUrl = (filename: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/pdf/${encodeURIComponent(filename)}`;
  };

  const filteredPdfs = pdfFiles
    .filter(pdf => 
      pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const handlePdfDownload = async (pdf: PDFFile) => {
    if (!authToken) {
      setError('Veuillez vous connecter pour télécharger les guides');
      return;
    }
    
    setLoading(prev => ({ ...prev, [pdf.id]: true }));
    setError(null);
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    try {
      // Try to download the file directly without checking first
      const response = await fetch(`${baseUrl}/api/pdf/${encodeURIComponent(pdf.filename)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        let errorMessage = 'Erreur lors du téléchargement du fichier';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (e) {
          if (response.status === 404) {
            errorMessage = `Le fichier "${pdf.filename}" n'est pas disponible sur le serveur. Veuillez contacter l'administrateur.`;
          } else {
            errorMessage = `Erreur ${response.status}: ${response.statusText || 'Problème de téléchargement'}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Check if the response is actually a PDF
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Le serveur n\'a pas retourné un fichier PDF valide');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Verify the blob is not empty
      if (blob.size === 0) {
        throw new Error('Le fichier téléchargé est vide');
      }
      
      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdf.filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setError(`Téléchargement de "${pdf.title}" réussi!`);
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du téléchargement');
    } finally {
      setLoading(prev => ({ ...prev, [pdf.id]: false }));
    }
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Guides Universitaires
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez notre collection complète de guides pour vous accompagner dans votre parcours d'orientation universitaire
          </p>
        </motion.div>

        {/* Improved Error/Success Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 ${
                error.includes('réussi')
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              } border rounded-xl shadow-sm flex items-center justify-between`}
            >
              <div className="flex items-center">
                {error.includes('réussi') ? (
                  <CheckCircleIcon className="h-5 w-5 mr-3 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 mr-3 text-red-500" />
                )}
                <p className="font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Search and Filters */}
        <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un guide..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out shadow-sm"
            />
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-in-out shadow-sm cursor-pointer"
            >
              <option value="recent">Plus récents</option>
              <option value="title">Ordre alphabétique</option>
            </select>

            <button
              onClick={() => setViewMode(mode => mode === 'grid' ? 'list' : 'grid')}
              className="p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:text-blue-500 transition-all duration-200 ease-in-out shadow-sm"
              aria-label={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            >
              {viewMode === 'grid' ? (
                <ListBulletIcon className="h-6 w-6" />
              ) : (
                <Squares2X2Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced PDF Grid/List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPdfs.map(pdf => (
                <motion.div
                  key={pdf.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {pdf.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {pdf.description}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                        {new Date(pdf.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handlePdfDownload(pdf)}
                      disabled={loading[pdf.id]}
                      className={`w-full flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
                        loading[pdf.id]
                          ? 'bg-blue-100 text-blue-400 cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                      }`}
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      {loading[pdf.id] ? 'Téléchargement...' : 'Télécharger le guide'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPdfs.map(pdf => (
                <motion.div
                  key={pdf.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {pdf.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {pdf.description}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
                          {new Date(pdf.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePdfDownload(pdf)}
                        disabled={loading[pdf.id]}
                        className={`flex-shrink-0 flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
                          loading[pdf.id]
                            ? 'bg-blue-100 text-blue-400 cursor-wait'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                        }`}
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        {loading[pdf.id] ? 'Téléchargement...' : 'Télécharger'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {filteredPdfs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun guide trouvé</h3>
            <p className="mt-2 text-gray-500">Nous n'avons trouvé aucun guide correspondant à votre recherche.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UniversityGuide;
