import React from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  UserGroupIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: LightBulbIcon,
    title: 'Orientation Personnalisée',
    description: "Découvrez votre voie avec notre système d'orientation intelligent",
    color: 'yellow',
    link: '/orientation'
  },
  {
    icon: UserGroupIcon,
    title: 'Coaching Professionnel',
    description: "Bénéficiez d'un accompagnement personnalisé par nos experts",
    color: 'green',
    link: '/coaching'
  },
  {
    icon: AcademicCapIcon,
    title: 'Formations Adaptées',
    description: 'Accédez à des cours de qualité conçus pour votre réussite',
    color: 'blue',
    link: '/courses'
  }
];

const colors = {
  blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20',
  green: 'bg-green-500/10 text-green-600 ring-green-500/20',
  purple: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  pink: 'bg-pink-500/10 text-pink-600 ring-pink-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20'
};

const Services = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Nos Services
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Découvrez comment nous pouvons vous aider à atteindre vos objectifs professionnels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 rounded-2xl bg-white shadow-lg transform 
                transition-transform group-hover:-translate-y-2" />
              <div className="relative p-8 rounded-2xl bg-white">
                <div className={`inline-flex p-3 rounded-lg ${
                  service.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                  service.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {service.title}
                </h3>
                <p className="mt-2 text-gray-600">
                  {service.description}
                </p>
                <Link
                  to={service.link}
                  className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 
                    hover:text-blue-700"
                >
                  En savoir plus
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 