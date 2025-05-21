import React, { useState } from 'react';
import { 
  AcademicCapIcon,
  CalculatorIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import UniversityGuide from '../components/orientation/UniversityGuide';
import ScoreCalculator from '../components/orientation/ScoreCalculator';
import InteractiveTest from '../components/orientation/InteractiveTest';
import PageBanner from '../components/shared/PageBanner';
import { motion, AnimatePresence } from 'framer-motion';  

type ContentType = 'university' | 'calculator' | 'test';

const Orientation = () => {
  const [activeContent, setActiveContent] = useState<ContentType>('university');

  const menuItems = [
    {
      id: 'university',
      name: 'Orientation Universitaire',
      icon: AcademicCapIcon,
      description: 'Découvrez les filières et universités qui correspondent à votre profil',
      color: 'blue'
    },
    {
      id: 'calculator',
      name: 'Calculateur de Score', 
      icon: CalculatorIcon,
      description: "Évaluez vos chances d'admission avec notre calculateur précis",
      color: 'green'
    },
    {
      id: 'test',
      name: "Test d'Orientation",
      icon: ClipboardDocumentCheckIcon,
      description: 'Découvrez les domaines qui correspondent le mieux à vos compétences',
      color: 'purple'
    }
  ];

  const renderContent = () => {
    switch (activeContent) {
      case 'university':
        return <UniversityGuide />;
      case 'calculator':
        return <ScoreCalculator />;
      case 'test':
        return <InteractiveTest />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PageBanner
        title="Orientation"
        subtitle="Découvrez votre parcours idéal et planifiez votre avenir académique avec confiance"
        highlight="universitaire"
        tag="Votre futur commence ici"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <nav className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                  <h2 className="text-white font-medium">Services d'orientation</h2>
                </div>
                <div className="p-2">
                  {menuItems.map((item) => {
                    const isActive = activeContent === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveContent(item.id as ContentType)}
                        className={`w-full flex items-center px-4 py-4 text-left rounded-lg transition-all duration-200 mb-1
                          ${isActive 
                            ? `bg-${item.color}-50 text-${item.color}-700 shadow-sm` 
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon 
                          className={`flex-shrink-0 h-6 w-6 mr-4 
                            ${isActive ? `text-${item.color}-600` : 'text-gray-400'}`} 
                        />
                        <div>
                          <span className={`block font-medium 
                            ${isActive ? `text-${item.color}-700` : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          <span className="mt-1 text-sm text-gray-500">
                            {item.description}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </nav>
              
              {/* Quick Help Box */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Besoin d'aide ?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Notre équipe est disponible pour vous guider dans votre orientation universitaire.
                </p>
                <a 
                  href="/contact" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  Contactez-nous
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="mt-8 lg:mt-0 lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeContent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-6 sm:px-8">
                  {activeContent !== 'university' && (
                    <button
                      onClick={() => setActiveContent('university')}
                      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 
                        transition-colors duration-200"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Retour à l'orientation
                    </button>
                  )}
                  <div className="transition-all duration-300 ease-in-out">
                    {renderContent()}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Orientation;