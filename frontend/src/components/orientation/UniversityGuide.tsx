import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PDFFile {
  _id: string;
  title: string;
  description: string;
  filename: string;
  date: string;
}

const UniversityGuide: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
    setAuthToken(token);
      fetchDocuments(token);
    } else {
      setError('Veuillez vous connecter pour accéder aux documents');
    }
  }, []);

  const fetchDocuments = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPdfFiles(data);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        setAuthToken(null);
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        throw new Error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Erreur lors du chargement des documents');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont acceptés');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadDescription) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!authToken) {
      toast.error('Veuillez vous connecter pour télécharger des documents');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Document téléchargé avec succès');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        if (authToken) {
          fetchDocuments(authToken);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authToken) {
      toast.error('Veuillez vous connecter pour supprimer des documents');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        toast.success('Document supprimé avec succès');
        if (authToken) {
          fetchDocuments(authToken);
        }
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression du document');
    }
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

  const initiateBrowserDownload = (blob: Blob, filename: string, title: string, setError: React.Dispatch<React.SetStateAction<string | null>>) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setError(`Téléchargement de "${title}" réussi!`);
    setTimeout(() => setError(null), 3000);
  };

  const processDownloadError = async (response: Response, pdfFilename: string) => {
    let errorMessage = 'Erreur lors du téléchargement du fichier';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      if (errorData.details) {
        errorMessage += `: ${errorData.details}`;
      }
    } catch (e) {
      if (response.status === 404) {
        errorMessage = `Le fichier "${pdfFilename}" n'est pas disponible sur le serveur. Veuillez contacter l'administrateur.`;
      } else {
        errorMessage = `Erreur ${response.status}: ${response.statusText || 'Problème de téléchargement'}`;
      }
    }
    return new Error(errorMessage);
  };

  const validatePdfResponse = (response: Response) => {
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Le serveur n\'a pas retourné un fichier PDF valide');
    }
  };

  const downloadPdfFile = async (baseUrl: string, filename: string, authToken: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(filename)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Le fichier "${filename}" n'a pas été trouvé sur le serveur`);
        }
      throw await processDownloadError(response, filename);
    }
    
    validatePdfResponse(response);
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Le fichier téléchargé est vide');
    }
    
    return blob;
    } catch (error) {
      console.error('Download error details:', error);
      throw error;
    }
  };

  const handlePdfDownload = async (pdf: PDFFile) => {
    if (!authToken) {
      setError('Veuillez vous connecter pour télécharger les guides');
      return;
    }
    
    setLoading(prev => ({ ...prev, [pdf._id]: true }));
    setError(null);
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    
    try {
      const blob = await downloadPdfFile(baseUrl, pdf.filename, authToken);
      initiateBrowserDownload(blob, pdf.filename, pdf.title, setError);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du téléchargement');
    } finally {
      setLoading(prev => ({ ...prev, [pdf._id]: false }));
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
        {/* Header with Upload Button for Teachers */}
        <div className="flex justify-between items-center mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
            className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Guides Universitaires
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Découvrez notre collection complète de guides pour vous accompagner dans votre parcours d'orientation universitaire
          </p>
        </motion.div>

          {user?.role === 'teacher' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter un document
            </button>
          )}
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Ajouter un document</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fichier PDF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isUploading ? 'Téléchargement...' : 'Télécharger'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Error/Success Message */}
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
                  key={pdf._id}
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
                      disabled={loading[pdf._id]}
                      className={`w-full flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
                        loading[pdf._id]
                          ? 'bg-blue-100 text-blue-400 cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                      }`}
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      {loading[pdf._id] ? 'Téléchargement...' : 'Télécharger le guide'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPdfs.map(pdf => (
                <motion.div
                  key={pdf._id}
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
                        disabled={loading[pdf._id]}
                        className={`flex-shrink-0 flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out ${
                          loading[pdf._id]
                            ? 'bg-blue-100 text-blue-400 cursor-wait'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                        }`}
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        {loading[pdf._id] ? 'Téléchargement...' : 'Télécharger'}
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
