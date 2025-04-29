import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { addCourse } from '../api/courseApi';
import PageBanner from '../components/shared/PageBanner';
import { FaUpload, FaBook, FaClock, FaDollarSign, FaChalkboardTeacher, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const AddCourse: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [instructor, setInstructor] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Update instructor from logged-in user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setInstructor(user.name);
    } else {
      // Redirect if not logged in
      navigate('/login', { state: { from: '/add-course' } });
    }
  }, [navigate]);

  // Image preview handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setImage(file);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    maxFiles: 1
  });

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!duration.trim()) newErrors.duration = 'Duration is required';
    if (isNaN(Number(duration)) || Number(duration) <= 0) newErrors.duration = 'Duration must be a positive number';
    if (!price.trim()) newErrors.price = 'Price is required';
    if (isNaN(Number(price)) || Number(price) < 0) newErrors.price = 'Price must be a non-negative number';
    if (!image) newErrors.image = 'Course image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('duration', duration);
      formData.append('price', price);
      formData.append('instructor', instructor);
      if (image) formData.append('image', image);
      
      await addCourse(formData);
      toast.success('Course created successfully!');
      navigate('/courses');
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast.error(error.message || 'Failed to create course , check and try again');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <PageBanner
        title="Créer"
        subtitle="Partagez vos connaissances avec le monde"
        highlight="Nouveau Cours"
        tag="Commencez à enseigner aujourd'hui!"
      />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FaBook className="mr-3" />
              Créer un nouveau cours
            </h2>
            <p className="text-blue-100 text-sm mt-1">Remplissez les détails ci-dessous pour créer votre cours</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={itemVariants} className="space-y-6 md:col-span-1">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium mb-2">Titre du cours</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setErrors(prev => ({ ...prev, title: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}
                      placeholder="Entrez un titre descriptif"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBook className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setErrors(prev => ({ ...prev, description: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}
                      rows={5}
                      placeholder="Décrivez ce que les étudiants apprendront dans ce cours"
                    />
                    <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
                      <FaInfoCircle className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.description}
                    </p>
                  )}
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium mb-2">Durée (heures)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => {
                          setDuration(e.target.value);
                          setErrors(prev => ({ ...prev, duration: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaClock className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    {errors.duration && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaInfoCircle className="mr-1" /> {errors.duration}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium mb-2">Prix (DT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          setErrors(prev => ({ ...prev, price: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaDollarSign className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <FaInfoCircle className="mr-1" /> {errors.price}
                      </p>
                    )}
                  </div>
                </div>

                {/* Instructor Field */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium mb-2">Instructeur</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg border-gray-300 bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      disabled={!!instructor}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaChalkboardTeacher className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">Ce champ est automatiquement défini sur le nom de votre profil</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6 md:col-span-1">
                {/* Image Upload with Preview */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium mb-2">Image du cours</label>
                  <div 
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                      ${errors.image ? 'border-red-500 bg-red-50' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="max-h-48 mx-auto rounded-md shadow-md"
                        />
                        <p className="text-sm text-blue-600 font-medium">
                          Cliquez ou glissez pour remplacer l'image
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUpload className="h-6 w-6 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {isDragActive ? 'Déposez l\'image ici' : 'Glissez une image ou cliquez pour télécharger'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Taille recommandée: 800x450px (ratio 16:9)
                        </p>
                        <p className="text-xs text-gray-400">
                          Taille maximale du fichier: 5MB
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <FaInfoCircle className="mr-1" /> {errors.image}
                    </p>
                  )}
                </div>

                {/* Course Preview */}
                {(title || description || price || imagePreview) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                      <FaBook className="mr-2 text-blue-500" />
                      Aperçu du cours
                    </h3>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      {imagePreview && (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Aperçu du cours" 
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-3">
                            <p className="text-white font-bold text-lg">{title || 'Titre du cours'}</p>
                            <p className="text-white/80 text-xs">Par {instructor}</p>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <FaClock className="h-3 w-3 text-blue-500 mr-1" />
                            <span>{duration || '0'} heures</span>
                          </div>
                          <p className="text-lg font-bold text-blue-600">{price || '0'} DT</p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{description || 'La description du cours apparaîtra ici'}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Submit Button */}
            <motion.div 
              variants={itemVariants}
              className="pt-4 border-t border-gray-100"
            >
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center justify-center shadow-md"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création du cours...
                  </>
                ) : (
                  'Créer le cours'
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                En créant ce cours, vous acceptez nos conditions générales
              </p>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddCourse;
