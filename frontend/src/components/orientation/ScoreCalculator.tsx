import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalculatorIcon, 
  AcademicCapIcon, 
  CheckCircleIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline';

type Section = 'math' | 'exp' | 'tech' | 'letters' | 'eco' | 'sport' | 'info';

interface Subject {
  code: string;
  name: string;
  coefficient: number;
}

interface Formula {
  subjects: { [key: string]: number };
  name: string;
  color: string;
  icon: string;
  description: string;
}

const SUBJECTS: { [key: string]: string } = {
  MG: "Moyenne générale du baccalauréat",
  M: "Mathématiques",
  SP: "Sciences physiques",
  SVT: "Sciences de la vie et de la terre",
  F: "Français",
  Ang: "Anglais",
  TE: "Technologie",
  A: "Arabe",
  PH: "Philosophie",
  HG: "Histoire-géographie",
  Ec: "Économie",
  Ge: "Gestion",
  SB: "Sciences biologiques",
  "Sp-sport": "Sport spécialisé",
  EP: "Éducation physique",
  Algo: "Algorithmique et programmation",
  STI: "Systèmes et technologies de l'information"
};

const FORMULAS: { [key in Section]: Formula } = {
  math: {
    name: "Mathématiques",
    subjects: { MG: 4, M: 2, SP: 1.5, SVT: 0.5, F: 1, Ang: 1 },
    color: "blue",
    icon: "📐",
    description: "Filières axées sur les mathématiques et les sciences exactes"
  },
  exp: {
    name: "Sciences Expérimentales",
    subjects: { MG: 4, M: 1, SP: 1.5, SVT: 1.5, F: 1, Ang: 1 },
    color: "green",
    icon: "🧪",
    description: "Filières orientées vers les sciences biologiques et physiques"
  },
  tech: {
    name: "Sciences Techniques",
    subjects: { MG: 4, TE: 1.5, M: 1.5, SP: 1, F: 1, Ang: 1 },
    color: "orange",
    icon: "⚙️",
    description: "Filières d'ingénierie et de technologie appliquée"
  },
  letters: {
    name: "Lettres",
    subjects: { MG: 4, A: 1.5, PH: 1.5, HG: 1, F: 1, Ang: 1 },
    color: "purple",
    icon: "📚",
    description: "Filières littéraires et sciences humaines"
  },
  eco: {
    name: "Économie et Gestion",
    subjects: { MG: 4, Ec: 1.5, Ge: 1.5, M: 0.5, HG: 0.5, F: 1, Ang: 1 },
    color: "red",
    icon: "📊",
    description: "Filières économiques, commerciales et de gestion"
  },
  sport: {
    name: "Sport",
    subjects: { MG: 4, SB: 1.5, "Sp-sport": 1, EP: 0.5, SP: 0.5, PH: 0.5, F: 1, Ang: 1 },
    color: "teal",
    icon: "🏃",
    description: "Filières liées aux sciences du sport et de l'éducation physique"
  },
  info: {
    name: "Sciences de l'Informatique",
    subjects: { MG: 4, M: 1.5, Algo: 1.5, SP: 0.5, STI: 0.5, F: 1, Ang: 1 },
    color: "indigo",
    icon: "💻",
    description: "Filières informatiques et technologies numériques"
  }
};

const ScoreCalculator = () => {
  const [selectedSection, setSelectedSection] = useState<Section>('math');
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [controlScores, setControlScores] = useState<{ [key: string]: number }>({});
  const [isControl, setIsControl] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Reset scores when section changes
  useEffect(() => {
    setShowResults(false);
    setFinalScore(null);
  }, [selectedSection]);

  const handleScoreChange = (subject: string, value: string, isControlSession: boolean = false) => {
    const score = parseFloat(value);
    if (!isNaN(score) && score >= 0 && score <= 20) {
      if (isControlSession) {
        setControlScores(prev => ({ ...prev, [subject]: score }));
      } else {
        setScores(prev => ({ ...prev, [subject]: score }));
      }
    }
  };

  const calculateFinalScore = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
      const formula = FORMULAS[selectedSection];
      let total = 0;
      let totalCoef = 0;

      Object.entries(formula.subjects).forEach(([subject, coef]) => {
        const score = scores[subject] || 0;
        const controlScore = controlScores[subject] || 0;
        
        let finalScore = score;
        if (isControl) {
          finalScore = ((2 * score) + controlScore) / 3;
        }

        total += finalScore * coef;
        totalCoef += coef;
      });

      const calculatedScore = total / totalCoef * 10; // Scale to 0-100
      setFinalScore(calculatedScore);
      setShowResults(true);
      setIsCalculating(false);
    }, 800);
  };

  const getScoreColor = (score: number) => {
    if (score >= 160) return "text-green-600";
    if (score >= 140) return "text-blue-600";
    if (score >= 120) return "text-yellow-600";
    if (score >= 100) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <CalculatorIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calculateur de Score d'Orientation
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Estimez vos chances d'admission selon votre section et vos notes au baccalauréat
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Section Selection */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
              <h2 className="text-white font-medium flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Sections
              </h2>
            </div>
            
            <div className="p-4 space-y-2">
              {Object.entries(FORMULAS).map(([key, formula]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSection(key as Section)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center
                    ${selectedSection === key 
                      ? `bg-${formula.color}-50 border border-${formula.color}-200 shadow-sm` 
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}
                >
                  <span className="text-2xl mr-3 flex-shrink-0">{formula.icon}</span>
                  <div>
                    <span className={`block font-medium ${selectedSection === key ? `text-${formula.color}-700` : 'text-gray-700'}`}>
                      {formula.name}
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {formula.description}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Information Box */}
            <div className="p-4 bg-blue-50 m-4 rounded-lg border border-blue-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Comment ça marche ?</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>1. Sélectionnez votre section</p>
                    <p>2. Entrez vos notes pour chaque matière</p>
                    <p>3. Calculez votre score d'orientation</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Calculator Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r from-${FORMULAS[selectedSection].color}-600 to-${FORMULAS[selectedSection].color}-700 px-6 py-4 text-white`}>
              <div className="flex items-center">
                <span className="text-3xl mr-3">{FORMULAS[selectedSection].icon}</span>
                <div>
                  <h2 className="text-xl font-semibold">{FORMULAS[selectedSection].name}</h2>
                  <p className="text-sm opacity-90">{FORMULAS[selectedSection].description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Control Session Toggle */}
              <div className="mb-6">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-medium text-gray-800">Session de contrôle</span>
                    <p className="text-sm text-gray-500 mt-1">Activez cette option si vous avez passé la session de contrôle</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                    <input
                      type="checkbox"
                      id="toggle"
                      checked={isControl}
                      onChange={(e) => setIsControl(e.target.checked)}
                      className="absolute w-0 h-0 opacity-0"
                    />
                    <label
                      htmlFor="toggle"
                      className={`absolute inset-0 rounded-full cursor-pointer transition-colors duration-300 ${
                        isControl ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                          isControl ? 'transform translate-x-6' : ''
                        }`}
                      ></span>
                    </label>
                  </div>
                </label>
              </div>

              {/* Score Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(FORMULAS[selectedSection].subjects).map(([subject, coef]) => (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 p-5 rounded-xl border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <label className="block text-sm font-medium text-gray-800">
                        {SUBJECTS[subject]}
                      </label>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Coef. {coef}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Note principale</span>
                          <span>{scores[subject] || 0}/20</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="0.25"
                          value={scores[subject] || 0}
                          onChange={(e) => handleScoreChange(subject, e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          value={scores[subject] || ''}
                          onChange={(e) => handleScoreChange(subject, e.target.value)}
                          className="mt-2 w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="0-20"
                        />
                      </div>
                      
                      {isControl && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-gray-200"
                        >
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Note de contrôle</span>
                            <span>{controlScores[subject] || 0}/20</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.25"
                            value={controlScores[subject] || 0}
                            onChange={(e) => handleScoreChange(subject, e.target.value, true)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.25"
                            value={controlScores[subject] || ''}
                            onChange={(e) => handleScoreChange(subject, e.target.value, true)}
                            className="mt-2 w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="0-20"
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Calculate Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={calculateFinalScore}
                  disabled={isCalculating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                    text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg
                    flex items-center gap-2 transition-all duration-300 disabled:opacity-70"
                >
                  {isCalculating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Calcul en cours...</span>
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="h-5 w-5" />
                      <span>Calculer mon score</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {showResults && finalScore !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                <h2 className="text-xl font-semibold flex items-center">
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  Votre Score
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col items-center">
                  <div className="text-center">
                    <span className={`text-6xl font-bold ${getScoreColor(finalScore)}`}>
                      {Math.round(finalScore)}
                    </span>
                    <span className="text-xl text-gray-500 ml-2">/200</span>
                  </div>
                  
                  <p className="mt-4 text-gray-600 text-center">
                    Score calculé pour la section <strong>{FORMULAS[selectedSection].name}</strong>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ScoreCalculator;