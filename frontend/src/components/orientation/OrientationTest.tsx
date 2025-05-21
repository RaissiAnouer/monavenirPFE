import React, { useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';

interface Question {
  id: number;
  text: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "Quelle activité préférez-vous ?",
    options: [
      "Résoudre des problèmes mathématiques",
      "Créer des œuvres artistiques",
      "Aider les autres",
      "Analyser des données"
    ]
  },
  {
    id: 2,
    text: "Dans un travail de groupe, quel rôle préférez-vous avoir ?",
    options: [
      "Leader",
      "Créatif",
      "Médiateur",
      "Organisateur"
    ]
  },
  // Add more questions as needed
];

const OrientationTest = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
  };

  if (showResult) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Résultats du Test</h3>
        <p className="text-gray-600 mb-4">
          Basé sur vos réponses, voici les domaines qui pourraient vous intéresser :
        </p>
        {/* Add result logic here */}
        <Button onClick={resetTest}>Recommencer le test</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-500">
          Question {currentQuestion + 1} sur {questions.length}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-6">{questions[currentQuestion].text}</h3>
        <div className="space-y-4">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full text-left p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OrientationTest; 