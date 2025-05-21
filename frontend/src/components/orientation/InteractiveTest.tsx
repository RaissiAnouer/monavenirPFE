import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  XMarkIcon, 
  LightBulbIcon, 
  AcademicCapIcon, 
  ClockIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const InteractiveTest: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  
  // Assuming you have some way to check if user is authenticated
  const isAuthenticated = localStorage.getItem('token') !== null; // Replace with your auth check

  const handleStartTest = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    window.open('https://framaforms.org/les-collegiens-et-lyceens-et-lintelligence-artificielle-1732377769', '_blank');
  };

  const handleNavigateToAuth = (type: 'login' | 'register') => {
    navigate(`/auth/${type}`);
  };

  const features = [
    {
      icon: LightBulbIcon,
      title: "Découvrez vos aptitudes",
      description: "Identifiez vos forces et vos domaines d'intérêt pour une orientation optimale"
    },
    {
      icon: AcademicCapIcon,
      title: "Recommandations personnalisées",
      description: "Recevez des suggestions de parcours adaptées à votre profil unique"
    },
    {
      icon: ClockIcon,
      title: "Rapide et efficace",
      description: "Complétez le test en 10-15 minutes et obtenez des résultats immédiats"
    },
    {
      icon: UserGroupIcon,
      title: "Basé sur des données réelles",
      description: "Algorithme développé avec des experts en orientation et éducation"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-sm border border-blue-100">
        <div className="p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Test d'Orientation IA
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez comment l'intelligence artificielle peut vous aider à trouver votre voie académique idéale
            </p>
          </motion.div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Test Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-lg p-6 shadow-sm mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              À propos de ce test
            </h3>
            <p className="text-gray-700 mb-4">
              Ce questionnaire fait partie d'une étude sur l'utilisation et la perception 
              de l'intelligence artificielle par les étudiants. Vos réponses nous aideront 
              à mieux comprendre et améliorer l'intégration de l'IA dans l'éducation et l'orientation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <ClockIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Durée</p>
                  <p className="text-sm text-gray-600">10-15 minutes</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Participation</p>
                  <p className="text-sm text-gray-600">Gratuite</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex justify-center"
          >
            <button 
              onClick={handleStartTest}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg
                flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
              Commencer le Test
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4 relative"
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <LockClosedIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Authentification Requise</h3>
              <p className="text-gray-600">
                Pour accéder au test et recevoir vos résultats personnalisés, veuillez vous connecter ou créer un compte.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => handleNavigateToAuth('login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se Connecter
              </button>
              <button
                onClick={() => handleNavigateToAuth('register')}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Créer un Compte
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Add missing icon import
const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    {...props} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
    />
  </svg>
);

export default InteractiveTest;