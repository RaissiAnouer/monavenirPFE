import React, { useEffect, useState } from 'react';
import { Course } from '../types/course';
import { getCourses, deleteCourseByTitle } from '../api/courseApi';
import PageBanner from '../components/shared/PageBanner';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { getImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import { 
  FaSearch, FaBook, FaClock, FaUserGraduate, FaTrash, FaEye, 
  FaPlus, FaSort, FaSortAmountDown, FaSortAmountUp, FaFilter,
  FaChalkboardTeacher, FaExclamationTriangle, FaVideo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'newest' | 'popular' | 'price-asc' | 'price-desc';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [priceDirection, setPriceDirection] = useState<'asc' | 'desc'>('asc');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const navigate = useNavigate();

  // Load logged-in user (if available) from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        setError('Échec du chargement des cours. Veuillez réessayer plus tard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter courses based on search term
  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredCourses = courses.filter(course => {
    return course.title.toLowerCase().includes(lowerSearchTerm) ||
      course.description.toLowerCase().includes(lowerSearchTerm) ||
      course.instructor.toLowerCase().includes(lowerSearchTerm);
  });

  // Sort courses based on selected option
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        // Assuming courses have a createdAt field, otherwise fallback to _id
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      case 'popular':
        // Sort by enrolled count (descending)
        return (b.enrolledCount || 0) - (a.enrolledCount || 0);
      case 'price-asc':
        // Sort by price (ascending)
        return a.price - b.price;
      case 'price-desc':
        // Sort by price (descending)
        return b.price - a.price;
      default:
        return 0;
    }
  });

  // Handle sort button clicks
  const handleSortClick = (option: SortOption) => {
    if (option === 'price-asc' || option === 'price-desc') {
      // Toggle between price-asc and price-desc
      if (sortOption === 'price-asc' || sortOption === 'price-desc') {
        const newDirection = priceDirection === 'asc' ? 'desc' : 'asc';
        setPriceDirection(newDirection);
        setSortOption(newDirection === 'asc' ? 'price-asc' : 'price-desc');
      } else {
        setPriceDirection('asc');
        setSortOption('price-asc');
      }
    } else {
      setSortOption(option);
    }
  };

  // Add a function to handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourseByTitle(courseToDelete);
      setCourses(courses.filter(course => course.title !== courseToDelete));
      toast.success('Cours supprimé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du cours:', error);
      toast.error('Échec de la suppression du cours. Veuillez réessayer.');
    } finally {
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  const openDeleteModal = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteModal(true);
  };

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
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  if (loading) return <Loader />;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md mx-auto">
        <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement des cours</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <PageBanner
        title="Cours"
        subtitle="Développez vos connaissances avec nos cours dirigés par des experts"
        highlight="Disponibles"
        tag="Commencez à apprendre aujourd'hui!"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-blue-500" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des cours par titre, description ou instructeur..."
                className="w-full pl-12 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          
            {/* Sort Options */}
            <div className="flex gap-2 flex-wrap">
              <button 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  sortOption === 'newest' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm font-medium' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleSortClick('newest')}
              >
                <FaSort className="h-3 w-3" />
                Plus récent
              </button>
              <button 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  sortOption === 'popular' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm font-medium' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleSortClick('popular')}
              >
                <FaSort className="h-3 w-3" />
                Populaire
              </button>
              <button 
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                  sortOption === 'price-asc' || sortOption === 'price-desc'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm font-medium' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleSortClick(priceDirection === 'asc' ? 'price-desc' : 'price-asc')}
              >
                {sortOption === 'price-asc' ? (
                  <FaSortAmountUp className="h-3 w-3" />
                ) : sortOption === 'price-desc' ? (
                  <FaSortAmountDown className="h-3 w-3" />
                ) : (
                  <FaSort className="h-3 w-3" />
                )}
                Prix
              </button>
            </div>
            
            {/* Create Course button */}
            {user && user.role === 'teacher' && (
              <button
                onClick={() => navigate('/add-course')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-300 flex items-center shadow-md text-sm font-medium whitespace-nowrap"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Créer un cours
              </button>
            )}
          </div>
          
          {/* Course Count */}
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <FaFilter className="h-3 w-3 text-blue-500 mr-2" />
            <p>
              Affichage de <span className="text-blue-600 font-semibold">{sortedCourses.length}</span> sur <span className="text-blue-600 font-semibold">{courses.length}</span> cours
            </p>
          </div>
        </motion.div>
        
        {/* Course Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {sortedCourses.map((course) => (
              <motion.div
                key={course.title}
                variants={itemVariants}
                layout
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group border border-gray-100"
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  <img
                    src={getImageUrl(course.image) || getPlaceholderImage()}
                    alt={course.title}
                    className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== getPlaceholderImage()) {
                        target.src = getPlaceholderImage();
                      }
                    }}
                  />
                  <div className="absolute top-3 right-3 z-20">
                    <div className="bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {course.price} DT
                    </div>
                  </div>
                  
                  {/* Course video count badge */}
                  {course.videos && course.videos.length > 0 && (
                    <div className="absolute top-3 left-3 z-20">
                      <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center">
                        <FaVideo className="mr-1 h-3 w-3" />
                        {course.videos.length} {course.videos.length === 1 ? 'vidéo' : 'vidéos'}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick action buttons that appear on hover */}
                  <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                    <button
                      onClick={() => navigate(`/course/${course.title}`)}
                      className="bg-white text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50 transition-colors"
                      title="Voir le cours"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                    {user && (user.role === 'teacher' || user.role === 'admin') && user.name === course.instructor && (
                      <button
                        onClick={() => openDeleteModal(course.title)}
                        className="bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                        title="Supprimer le cours"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                    {course.description}
                  </p>
                  
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <FaChalkboardTeacher className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Instructeur</p>
                        <p className="text-sm font-medium text-gray-800">{course.instructor}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center">
                        <FaClock className="h-3 w-3 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">{course.duration} heures</span>
                      </div>
                      <div className="flex items-center">
                        <FaUserGraduate className="h-3 w-3 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">{course.enrolledCount || 0} inscrits</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/course/${course.title}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors duration-200 flex items-center justify-center text-sm font-medium shadow-sm"
                    >
                      <FaEye className="h-3 w-3 mr-2" />
                      Voir le cours
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {sortedCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-md p-10 text-center max-w-lg mx-auto mt-8 border border-gray-100"
          >
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <FaBook className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Aucun cours trouvé</h3>
            <p className="text-gray-600 mb-6">Nous n'avons trouvé aucun cours correspondant à vos critères de recherche.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors inline-flex items-center shadow-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer la recherche
            </button>
          </motion.div>
        )}

        {/* Confirmation Modal for Deletion */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 border border-gray-200"
              >
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <FaExclamationTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h2>
                  <p className="text-gray-600 text-sm">
                    Êtes-vous sûr de vouloir supprimer ce cours ? Cette action ne peut pas être annulée et toutes les données associées seront définitivement supprimées.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteCourse}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-colors shadow-sm"
                  >
                    Supprimer le cours
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Courses;