import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import PageBanner from '../components/shared/PageBanner';

const About = () => {
  const values = [
    {
      title: "Excellence",
      description: "Nous nous engageons à fournir une éducation de la plus haute qualité."
    },
    {
      title: "Innovation",
      description: "Nous adoptons les dernières technologies et méthodes pédagogiques."
    },
    {
      title: "Accessibilité",
      description: "L'éducation de qualité doit être accessible à tous les étudiants."
    }
  ];

  const team = [
    {
      name: "Sarah Ben Ali",
      role: "Fondatrice & Directrice",
      description: "Experte en éducation avec plus de 15 ans d'expérience.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
    },
    {
      name: "Mohamed Karim",
      role: "Responsable Pédagogique",
      description: "Spécialiste en développement de programmes éducatifs.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
    },
    {
      name: "Leila Mansour",
      role: "Conseillère d'Orientation",
      description: "Aide les étudiants à trouver leur voie depuis 8 ans.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageBanner
        title="À propos de"
        subtitle="Découvrez notre mission et notre engagements envers votre réussite académique"
        highlight="MonAvenir.tn"
        tag="Nos histoire"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nos Valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{value.title}</h3>
                </div>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Notre Équipe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;