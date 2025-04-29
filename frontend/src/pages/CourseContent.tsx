import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseByTitle, addCourseVideo, addCourseDocument, removeCourseVideo, removeCourseDocument } from '../api/courseApi';
import { Course } from '../types/course';
import Loader from '../components/Loader';
import { Tab } from '@headlessui/react';
import { FaVideo, FaFileAlt, FaInfoCircle, FaUpload, FaTimes, FaTrash, FaClock, FaPlay, FaPause, FaExpand, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import PageBanner from '../components/shared/PageBanner';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { fixResourceUrl } from '../utils/imageUtils';
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';

// Add custom scrollbar styles
const scrollbarStyles = `
  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3b82f6;
  }
`;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Custom Video Player Component
const VideoPlayer: React.FC<{ src: string; poster?: string }> = ({ src, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fix the source URL if needed
  const fixedSrc = useMemo(() => {
    try {
      if (!src) return '';
      
      // If the URL starts with /uploads/videos/
      if (src.startsWith('/uploads/videos/')) {
        // Extract the filename from the path
        const filename = src.split('/').pop();
        // Use the streaming route instead of direct file access
        if (filename) {
          // Include the token in the URL as a query parameter
          const token = localStorage.getItem('token');
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          // Add timestamp to prevent caching issues
          return `${baseUrl}/api/stream/${filename}?token=${token}&t=${Date.now()}`;
        }
      } else if (src.startsWith('/uploads')) {
        // Include the token in the URL as a query parameter
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        // Add timestamp to prevent caching issues
        return `${baseUrl}${src}?token=${token}&t=${Date.now()}`;
      }
      return src;
    } catch (error) {
      console.error('Error fixing source URL ', error);
      setHasError(true);
      setErrorDetails('Invalid source URL');
      return '';
    }
  }, [src]);

  // Direct access URL for fallback

  // Set up video element with proper authentication
  useEffect(() => {
    if (videoRef.current && fixedSrc) {
      setIsLoading(true);
      setHasError(false);
      
      // Reset video element
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      
      // Set new source
      videoRef.current.src = fixedSrc;
      
      // Set video attributes
      videoRef.current.preload = 'metadata';
      videoRef.current.crossOrigin = 'anonymous';
      videoRef.current.playsInline = true;
      
      // Load video
      videoRef.current.load();
    }
  }, [fixedSrc]);

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      console.log('Video metadata loaded:', {
        duration: videoRef.current.duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        readyState: videoRef.current.readyState
      });
      setDuration(videoRef.current.duration);
      setHasError(false);
      setIsLoading(false);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle video can play
  const handleCanPlay = () => {
    console.log('Video can play');
    setIsLoading(false);
    setHasError(false);
  };

  // Handle video error
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.currentTarget;
    const error = videoElement.error;
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          toast.error('Video playback was aborted.');
          break;
        case error.MEDIA_ERR_NETWORK:
          toast.error('A network error caused the video download to fail.');
          break;
        case error.MEDIA_ERR_DECODE:
          toast.error('The video playback was aborted due to a corruption problem or because the video used features your browser did not support.');
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          toast.error('The video could not be loaded, either because the server or network failed or because the format is not supported.');
          break;
        default:
          toast.error('An unknown error occurred.');
          break;
      }
    }
  };

  // Check if the video source is valid
  useEffect(() => {
    // Reset error state when source changes
    setHasError(false);
    setErrorDetails('');
    
    // Validate the source URL
    if (!src) {
      setHasError(true);
      setErrorDetails('No video source provided');
    } else if (fixedSrc) {
      // Test if the URL is accessible
      const testImage = new Image();
      testImage.onload = () => {
        // If it's an image URL, it's probably not a valid video
        setHasError(true);
        setErrorDetails('Invalid video format');
      };
      testImage.onerror = () => {
        // This is expected for video URLs - they won't load as images
        // We don't set an error here
      };
      
      // Only test if it looks like a URL
      if (fixedSrc.startsWith('http') || fixedSrc.startsWith('/')) {
        testImage.src = fixedSrc;
      }
    }
  }, [src, fixedSrc]);

  // Format time (seconds) to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setHasError(true);
          setErrorDetails(err.message || 'Failed to play video');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && !hasError) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && !hasError) {
      const newVolume = parseFloat(e.target.value);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current && !hasError) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current && !hasError) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Show/hide controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !hasError) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Fix the poster URL if needed
  const fixedPoster = useMemo(() => {
    try {
      if (poster && poster.startsWith('/uploads')) {
        return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${poster}`;
      }
      return poster;
    } catch (error) {
      console.error('Error fixing poster URL:', error);
      return '';
    }
  }, [poster]);

  // Try direct file access if streaming fails


  const handleVideoLoad = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load video: ${response.statusText}`);
      }

      console.log('Video source is accessible:', response.status, response.statusText);
    } catch (error) {
      console.error('Video loading error:', error);
    }
  };

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden shadow-lg group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !hasError && setShowControls(false)}
    >
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white text-lg font-medium mb-2">Erreur de lecture de la vidéo</h3>
          <p className="text-gray-300 text-sm mb-4">
            {errorDetails || "La vidéo n'a pas pu être chargée. Veuillez vérifier le format ou réessayer plus tard."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Réessayer
            </button>
            <a 
              href={fixedSrc} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              Télécharger
            </a>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full rounded-lg"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadataLoaded}
            onCanPlay={handleCanPlay}
            onClick={togglePlay}
            onError={handleVideoError}
            preload="metadata"
            playsInline
            crossOrigin="anonymous"
            poster={fixedPoster}
            controls
            onLoadedData={() => handleVideoLoad(fixedSrc)}
          >
            <source src={fixedSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Play/Pause Overlay Button (center) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={togglePlay}
                className="bg-blue-600/80 hover:bg-blue-700/80 text-white rounded-full p-6 transform transition-transform hover:scale-110 shadow-lg backdrop-blur-sm"
              >
                <FaPlay className="h-8 w-8" />
              </button>
            </div>
          )}
          
          {/* Video Controls */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div className="flex items-center mb-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-400/50 rounded-full appearance-none cursor-pointer accent-blue-600"
                style={{
                  backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 100)) * 100}%, rgba(255,255,255,0.3) 100%)`,
                  height: '6px'
                }}
              />
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause Button */}
                <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                  {isPlaying ? <FaPause className="h-4 w-4" /> : <FaPlay className="h-4 w-4" />}
                </button>
                
                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                    {isMuted ? <FaVolumeMute className="h-4 w-4" /> : <FaVolumeUp className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-gray-400/50 rounded-full appearance-none cursor-pointer accent-blue-600 hidden sm:block"
                    style={{
                      backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`,
                      height: '4px'
                    }}
                  />
                </div>
                
                {/* Time Display */}
                <div className="text-white text-xs font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              {/* Fullscreen Button */}
              <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
                <FaExpand className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Extend AxiosRequestConfig to include onUploadProgress
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}

const CourseContent: React.FC = () => {
  const { title } = useParams<{ title: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const { register: docRegister, handleSubmit: handleDocSubmit, reset: resetDoc, formState: { errors } } = useForm();
  const { register: videoRegister, handleSubmit: handleVideoSubmit, reset: resetVideo, formState: { errors: videoErrors } } = useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  // Define the function to handle document input changes
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Selected document:', file.name);
      // You can add more logic here, such as updating state or preparing the file for upload
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!title) throw new Error('Course title is required');
        const courseData = await getCourseByTitle(title);
        setCourse(courseData);
      } catch (err: any) {
        setError(err.message || 'Failed to load course content');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [title]);

  const isInstructor = user && (user.role === 'teacher' || user.role === 'admin') && 
    course?.instructor === user.name;

  // Define the expected response type
  interface DocumentUploadResponse {
    success: boolean;
    course: Course; // Assuming you have a Course type defined
  }

  // Update the handleDocUpload function
  const handleDocUpload = async (data: any) => {
    if (!course) return;
    
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.document[0]) {
      formData.append('document', data.document[0]);
      const docType = detectDocumentType(data.document[0].name);
      formData.append('type', docType);
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Use the extended type for the request config
      const response = await axiosInstance.post<DocumentUploadResponse>(
        `/api/courses/${course._id}/documents`,
        formData,
        {
          onUploadProgress: (progressEvent: ProgressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        }
      );

      if (response.data.success) {
        const updatedCourse = await getCourseByTitle(title!);
        setCourse(updatedCourse);
        toast.success('Document uploaded successfully');
        setShowDocUpload(false);
        resetDoc();
        setDocumentName(null);
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to detect document type from filename
  const detectDocumentType = (filename: string): string => {
    if (!filename) return 'other';
    
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'doc';
    if (['ppt', 'pptx'].includes(extension)) return 'ppt';
    if (['xls', 'xlsx'].includes(extension)) return 'xls';
    
    return 'other';
  };

  const handleDeleteDocument = async (documentIndex: number) => {
    if (!course) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      setLoading(true);
      await removeCourseDocument(course._id!, documentIndex);
      const updatedCourse = await getCourseByTitle(title!);
      setCourse(updatedCourse);
      toast.success('Document supprimé avec succès!');
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression du document');
    } finally {
      setLoading(false);
    }
  };

  // Clean up document preview URL when component unmounts or preview changes
  useEffect(() => {
    if (documentPreview) {
      return () => {
        URL.revokeObjectURL(documentPreview);
      };
    }
  }, [documentPreview]);

  interface VideoUploadResponse {
    success: boolean;
    message: string;
    course: Course;
  }

  const handleVideoUpload = async (data: any) => {
    if (!course) return;
    
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    
    const videoFile = data.video[0];
    if (!videoFile) {
      toast.error('Veuillez sélectionner une vidéo');
      return;
    }
    
    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (videoFile.size > maxSize) {
      toast.error('La vidéo est trop volumineuse. Taille maximum: 500MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(videoFile.type)) {
      toast.error('Format de vidéo non valide. Formats acceptés: MP4, WebM, OGG');
      return;
    }
    
    formData.append('video', videoFile);
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Create axios instance for the request
      const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Upload with progress tracking
      const response = await axiosInstance.post<VideoUploadResponse>(
        `/api/courses/${course._id}/videos`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          // @ts-ignore - onUploadProgress is available but not typed correctly in axios
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          }
        }
      );
      
      if (!response.data.success || !response.data.course) {
        throw new Error(response.data.message || 'Invalid response from server');
      }
      
      // Update the course with the new data
      const updatedCourse = await getCourseByTitle(title!);
      setCourse(updatedCourse);
      
      toast.success('Vidéo téléchargée avec succès!');
      setShowVideoUpload(false);
      resetVideo();
      
      // Clear the preview
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
      setVideoName(null);
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Échec du téléchargement de la vidéo';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle video file change
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoName(file.name);
      
      // Create a preview URL for the video
      const fileUrl = URL.createObjectURL(file);
      setVideoPreview(fileUrl);
    } else {
      setVideoName(null);
      setVideoPreview(null);
    }
  };

  // Clean up video preview URL when component unmounts or preview changes
  useEffect(() => {
    if (videoPreview) {
      return () => {
        URL.revokeObjectURL(videoPreview);
      };
    }
  }, [videoPreview]);

  const handleDeleteVideo = async (videoIndex: number) => {
    if (!course) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;
    
    try {
      setLoading(true);
      await removeCourseVideo(course._id!, videoIndex);
      const updatedCourse = await getCourseByTitle(title!);
      setCourse(updatedCourse);
      toast.success('Vidéo supprimée avec succès!');
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression de la vidéo');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle document upload
  const handleDocumentUpload = async (courseId: string, documentData: FormData) => {
    try {
      const updatedCourse = await addCourseDocument(courseId, documentData);
      setCourse(updatedCourse); // Update the course state with the new document
      toast.success('Document added successfully');
    } catch (error) {
      toast.error('Failed to add document');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;
  if (!course) return <div className="text-center p-4">Course not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      {/* Apply custom scrollbar styles */}
      <style>{scrollbarStyles}</style>
      
      <PageBanner
        title={course.title}
        subtitle="Explorez le contenu du cours et améliorez votre expérience d'apprentissage"
        highlight="Contenu du cours"
      />

      {/* Video Upload Modal */}
      {showVideoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl relative shadow-2xl">
            <button 
              onClick={() => {
                setShowVideoUpload(false);
                resetVideo();
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Fermer"
            >
              <FaTimes className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <FaVideo className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Ajouter une nouvelle vidéo</h2>
              <p className="text-gray-600 mt-1">Téléchargez une vidéo pour enrichir votre cours</p>
            </div>
            
            <form onSubmit={handleVideoSubmit(handleVideoUpload)} className="space-y-6">
              {/* Title field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la vidéo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaVideo className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...videoRegister('title', { required: true })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 border-gray-300"
                    placeholder="Entrez un titre descriptif pour cette vidéo"
                  />
                </div>
              </div>
              
              {/* Video upload section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier vidéo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    {...videoRegister('video', { required: true })}
                    className="hidden"
                    id="video-upload"
                    onChange={(e) => {
                      videoRegister('video').onChange(e); // Keep the form registration
                      handleVideoChange(e); // Handle the preview
                    }}
                  />
                  
                  {videoName ? (
                    <div className="flex flex-col items-center">
                      {videoPreview && (
                        <div className="mb-3 w-full max-w-xs">
                          <video 
                            src={videoPreview} 
                            className="w-full rounded-lg" 
                            controls
                          />
                        </div>
                      )}
                      <p className="text-sm font-medium text-gray-800 mb-1">{videoName}</p>
                      <div className="flex space-x-2">
                        <label htmlFor="video-upload" className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                          Changer
                        </label>
                        <button 
                          type="button" 
                          className="text-xs text-red-600 hover:text-red-800"
                          onClick={() => {
                            setVideoName(null);
                            setVideoPreview(null);
                            const fileInput = document.getElementById('video-upload') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = '';
                              resetVideo({ video: null });
                            }
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                      <FaUpload className="h-10 w-10 text-blue-500 mb-3" />
                      <span className="text-sm font-medium text-gray-700">
                        Cliquez pour sélectionner une vidéo ou glissez-la ici
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        Formats acceptés: MP4, WebM, OGG (max 500MB)
                      </span>
                      {videoErrors.video && (
                        <span className="text-xs text-red-500 mt-1">
                          Veuillez sélectionner une vidéo
                        </span>
                      )}
                    </label>
                  )}
                </div>
              </div>
              
              {/* Upload button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg
                    hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                >
                  {uploading ? (
                    <>
                      <div className="mr-3 relative">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <span>Téléchargement en cours... {uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Télécharger la vidéo
                    </>
                  )}
                </button>
                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative shadow-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
            
            <form onSubmit={handleDocSubmit(handleDocUpload)} className="space-y-4">
              <div>
                <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...docRegister('title', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                />
                {errors.title && <span className="text-red-500 text-sm">Title is required</span>}
              </div>
              
              <div>
                <label htmlFor="document-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Document File <span className="text-red-500">*</span>
                </label>
                
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="document-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input 
                          {...docRegister('document', { required: true })}
                          id="document-file"
                          type="file" 
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setDocumentName(e.target.files[0].name);
                            }
                          }}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    
                    {documentName && (
                      <div className="mt-2 flex items-center justify-center">
                        <FaFileAlt className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-700">{documentName}</span>
                      </div>
                    )}
                    {errors.document && <span className="text-red-500 text-sm">Document is required</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocUpload(false);
                    resetDoc();
                    setDocumentName(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </div>
            </form>
            
            <button 
              onClick={() => setShowDocUpload(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-auto relative shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="py-2 px-4 border border-gray-300 shadow-sm text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (documentToDelete !== null) {
                    handleDeleteDocument(documentToDelete);
                    setShowDeleteModal(false);
                  } else {
                    toast.error('No document selected for deletion');
                  }
                }} 
                className="py-2 px-4 border border-transparent shadow-sm text-sm rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
            <button 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
         

          {/* Course Content Tabs */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6 shadow-sm">
                <Tab
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-3 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                      selected
                        ? 'bg-white shadow text-blue-700'
                        : 'text-gray-600 hover:bg-white/[0.5] hover:text-blue-700'
                    )
                  }
                >
                  <div className="flex items-center justify-center">
                    <FaInfoCircle className="h-4 w-4 mr-2" />
                    À propos
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-3 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                      selected
                        ? 'bg-white shadow text-blue-700'
                        : 'text-gray-600 hover:bg-white/[0.5] hover:text-blue-700'
                    )
                  }
                >
                  <div className="flex items-center justify-center">
                    <FaVideo className="h-4 w-4 mr-2" />
                    Vidéos {course.videos && course.videos.length > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
                        {course.videos.length}
                      </span>
                    )}
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-3 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none',
                      selected
                        ? 'bg-white shadow text-blue-700'
                        : 'text-gray-600 hover:bg-white/[0.5] hover:text-blue-700'
                    )
                  }
                >
                  <div className="flex items-center justify-center">
                    <FaFileAlt className="h-4 w-4 mr-2" />
                    Documents {course.documents && course.documents.length > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
                        {course.documents.length}
                      </span>
                    )}
                  </div>
                </Tab>
              </Tab.List>
              <Tab.Panels className="p-6">
                {/* Description Panel */}
                <Tab.Panel>
                  <div className="prose max-w-none">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Aperçu du cours
                      </h2>
                      <div className="mb-6">
                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{course.detailedDescription || course.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-blue-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <FaClock className="text-blue-500 mr-2" />
                            Détails du cours
                          </h3>
                          <ul className="space-y-3">
                            <li className="flex items-start">
                              <span className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                              <div>
                                <span className="font-medium">Durée totale:</span> {course.duration} heures
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </span>
                              <div>
                                <span className="font-medium">Ressources:</span> {course.videos?.length || 0} vidéos, {course.documents?.length || 0} documents
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </span>
                              <div>
                                <span className="font-medium">Instructeur:</span> {course.instructor}
                              </div>
                            </li>
                            <li className="flex items-start">
                              <span className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </span>
                              <div>
                                <span className="font-medium">Inscrits:</span> {course.enrolledCount || 0} étudiants
                              </div>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="bg-blue-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Ce que vous apprendrez
                          </h3>
                          <ul className="space-y-2">
                            {course.syllabus ? (
                              course.syllabus.split('\n').filter(line => line.trim()).map((line, index) => (
                                <li key={index} className="flex items-start">
                                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-gray-700">{line}</span>
                                </li>
                              ))
                            ) : (
                              <p className="text-gray-500 italic">Aucun programme détaillé n'est disponible pour ce cours.</p>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Videos Panel */}
                <Tab.Panel>
                  <div className="space-y-8">
                    {/* Add Upload Video Button for Teachers */}
                    {isInstructor && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowVideoUpload(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <FaUpload className="h-4 w-4" />
                          Ajouter une vidéo
                        </button>
                      </div>
                    )}
                    
                    {course.videos && course.videos.length > 0 ? (
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Sidebar - Video Navigation */}
                        <div className="md:w-1/3 lg:w-1/4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="p-4 bg-blue-50 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                              <FaVideo className="h-4 w-4 mr-2 text-blue-600" />
                              Vidéos du cours
                            </h3>
                          </div>
                          <div className="custom-scrollbar overflow-y-auto max-h-[calc(100vh-300px)]">
                          {course.videos.map((video, index) => (
                            <div 
                              key={index} 
                                onClick={() => {
                                  setActiveVideoIndex(index);
                                  // Scroll to the video player and set active video
                                  document.getElementById('video-player-container')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors flex items-start gap-3 ${activeVideoIndex === index ? 'bg-blue-100' : ''}`}
                              >
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-800 truncate">{video.title}</h4>
                                  <div className="flex items-center justify-between mt-2">
                                    {video.duration && (
                                      <p className="text-xs text-gray-500 flex items-center">
                                        <FaClock className="h-3 w-3 mr-1" />
                                        {video.duration}
                                      </p>
                                    )}
                                    {/* Video progress indicator - you can implement actual progress tracking */}
                                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: activeVideoIndex > index ? '100%' : activeVideoIndex === index ? '50%' : '0%' }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                                </div>
                              </div>
                              
                        {/* Main Content - Video Player */}
                        <div id="video-player-container" className="md:w-2/3 lg:w-3/4">
                          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Current Video Title */}
                            <div className="p-6 pb-4">
                              <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                                    Vidéo {activeVideoIndex + 1}
                                  </span>
                                  {course.videos[activeVideoIndex]?.title}
                                </h3>
                                {isInstructor && (
                                  <button
                                    onClick={() => handleDeleteVideo(activeVideoIndex)}
                                    className="text-red-500 hover:text-red-700 p-2 bg-white rounded-lg border border-gray-200 hover:bg-red-50 transition-colors"
                                    title="Supprimer la vidéo"
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Video Player */}
                              <div className="aspect-w-16 aspect-h-9 bg-black">
                              {course.videos && course.videos.length > 0 && (
                                <VideoPlayer src={course.videos[0].url} poster={course.videos[0].thumbnail} />
                              )}
                              </div>
                              
                            {/* Video Navigation Buttons */}
                            <div className="p-4 flex justify-between">
                              <button
                                onClick={() => setActiveVideoIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeVideoIndex === 0}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                  activeVideoIndex === 0 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Précédent
                              </button>
                              
                              <button
                                onClick={() => setActiveVideoIndex(prev => Math.min((course.videos?.length || 1) - 1, prev + 1))}
                                disabled={activeVideoIndex === (course.videos?.length || 1) - 1}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                  activeVideoIndex === (course.videos?.length || 1) - 1 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                Suivant
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Video Description */}
                            {course.videos[activeVideoIndex]?.description && course.videos[activeVideoIndex]?.description.trim() !== '' && (
                                <div className="p-6 pt-4">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                                  <p className="text-gray-700">{course.videos[activeVideoIndex]?.description}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="max-w-md mx-auto">
                          <FaVideo className="mx-auto h-16 w-16 text-blue-200 mb-4" />
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune vidéo disponible</h3>
                          <p className="text-gray-600 mb-6">Ce cours ne contient pas encore de vidéos.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Panel>

                {/* Documents Panel */}
                <Tab.Panel>
                  <div className="space-y-8">
                    {/* Add Upload Document Button for Teachers */}
                    {isInstructor && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowDocUpload(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <FaUpload className="h-4 w-4" />
                          Ajouter un document
                        </button>
                      </div>
                    )}
                    
                    {course.documents && course.documents.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-blue-50 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FaFileAlt className="h-5 w-5 mr-2 text-blue-600" />
                            Documents du cours ({course.documents.length})
                          </h3>
                        </div>
                        
                        <ul className="divide-y divide-gray-200">
                          {course.documents.map((doc, index) => {
                            // Determine document type icon and color
                            let bgColor = "bg-gray-100";
                            let textColor = "text-gray-700";
                            let icon = <FaFileAlt className="h-5 w-5" />;
                            
                            if (doc.type === 'pdf') {
                              bgColor = "bg-red-100";
                              textColor = "text-red-700";
                              icon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>;
                            } else if (doc.type === 'doc' || doc.type === 'docx') {
                              bgColor = "bg-blue-100";
                              textColor = "text-blue-700";
                              icon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>;
                            } else if (doc.type === 'ppt' || doc.type === 'pptx') {
                              bgColor = "bg-orange-100";
                              textColor = "text-orange-700";
                              icon = <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>;
                            }
                            
                            return (
                              <li 
                            key={index}
                                id={`doc-${index}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <div className="p-4 flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-lg ${bgColor} ${textColor} flex items-center justify-center flex-shrink-0`}>
                                      {icon}
                                      </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-medium text-gray-900 truncate">{doc.title}</h4>
                                      {doc.description && (
                                        <p className="text-sm text-gray-500 truncate">{doc.description}</p>
                                    )}
                                  </div>
                                    </div>
                                  
                              <div className="flex items-center space-x-2">
                                <a
                                  href={fixResourceUrl(doc.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                                      title="Télécharger"
                                  onClick={(e) => {
                                    if (!doc.url) {
                                      e.preventDefault();
                                      toast.error('URL du document invalide');
                                    }
                                  }}
                                >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                                {isInstructor && (
                                  <button
                                    onClick={() => {
                                      setDocumentToDelete(index);
                                      setShowDeleteModal(true);
                                    }}
                                        className="text-red-500 hover:text-red-700 p-2 bg-white rounded-lg border border-gray-200 hover:bg-red-50 transition-colors"
                                    title="Supprimer le document"
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="max-w-md mx-auto">
                          <FaFileAlt className="mx-auto h-16 w-16 text-blue-200 mb-4" />
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun document disponible</h3>
                          <p className="text-gray-600 mb-6">Ce cours ne contient pas encore de documents.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-md p-5 sticky top-24">
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 mb-3">Contenu du cours</h3>
            <nav className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
              {course.videos && course.videos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTab(1);
                    setActiveVideoIndex(index);
                    // Scroll to the video after a short delay to allow tab change
                    setTimeout(() => {
                      document.getElementById(`video-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center group"
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <FaVideo className="h-3 w-3" />
                  </div>
                  <span className="truncate">{video.title}</span>
                </button>
              ))}
              
              {course.documents && course.documents.map((doc, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTab(2);
                    // Scroll to the document after a short delay
                    setTimeout(() => {
                      document.getElementById(`doc-${index}`)?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center group"
                >
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <FaFileAlt className="h-3 w-3" />
                  </div>
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <ul className="space-y-3 mt-6 border-t border-gray-100 pt-4">
            <li className="flex items-center text-sm text-gray-600">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                <FaVideo className="h-3 w-3" />
              </div>
              {course.videos ? course.videos.length : 0} vidéos
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                <FaFileAlt className="h-3 w-3" />
              </div>
              {course.documents ? course.documents.length : 0} ressources téléchargeables
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                <FaInfoCircle className="h-3 w-3" />
              </div>
              Accès illimité
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                <FaInfoCircle className="h-3 w-3" />
              </div>
              Accès sur mobile et TV
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                <FaInfoCircle className="h-3 w-3" />
              </div>
              Certificat d'achvement
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
